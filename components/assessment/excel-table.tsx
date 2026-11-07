'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { Database, Loader2, PenLine, Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/common/empty-state';
import { AssessmentData, Period, calculateRealTimeScore } from '@/lib/assessment-service';
import { cn } from '@/lib/utils';

interface ExcelTableProps {
  multiPeriodData: AssessmentData[] | null;
  selectedPeriods: Period[];
  onCellEdit: (indicatorId: number, period: string, value: string) => Promise<void>;
  onScoreChange: (indicatorId: number, score: string) => void;
  onMilestoneScoreChange?: (objectiveId: number, score: string) => void;
  onRemarksChange?: (indicatorId: number, remarks: string) => void;
  onMilestoneRemarksChange?: (objectiveId: number, remarks: string) => void;
  onBulkScoreCalculation?: (manualEntries: Record<number, Record<string, number | null>>) => Promise<void>;
  isExporting?: boolean;
  onCalculatingStateChange?: (isCalculating: boolean) => void;
}

interface CellData {
  value: string;
  isEditable: boolean;
  isDHIS2Data: boolean;
  isManualEntry?: boolean;
}

const SCORE_OPTIONS = ['-2', '-1', '0', '1', '2'] as const;

/**
 * -2 … +2 score → its token class. Same thresholds the sheet has always used
 * (and the Excel export uses), so colours match the downloaded workbook.
 */
function scoreClass(score: string): string {
  const n = parseFloat(score);
  if (isNaN(n)) return 'score-none';
  if (n >= 2) return 'score-2';
  if (n >= 1) return 'score-1';
  if (n === 0) return 'score-0';
  if (n === -1) return 'score-neg1';
  return 'score-neg2';
}

// Flow diagram: >5% good, -5% to 5% watch, < -5% poor.
function changeClass(val?: string): string {
  if (!val) return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  if (n > 5) return 'cell-good';
  if (n >= -5) return 'cell-watch';
  return 'cell-poor';
}

// Flow diagram: ≤10% good, 10–40% watch, >40% poor.
function gapClass(val?: string): string {
  if (!val) return '';
  const n = Math.abs(parseFloat(val));
  if (isNaN(n)) return '';
  if (n <= 10) return 'cell-good';
  if (n <= 40) return 'cell-watch';
  return 'cell-poor';
}

const CELL = 'border border-border px-2 py-1.5 align-middle';
const HEAD = 'border border-border px-2 py-2 text-xs font-medium text-foreground';

const ExcelTable = forwardRef<{ triggerBulkCalculation: () => void }, ExcelTableProps>(({
  multiPeriodData,
  selectedPeriods,
  onCellEdit,
  onScoreChange,
  onMilestoneScoreChange,
  onRemarksChange,
  onMilestoneRemarksChange,
  onBulkScoreCalculation,
  onCalculatingStateChange
}, ref) => {
  const [cellData, setCellData] = useState<Record<string, CellData>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const manualEntriesRef = useRef<Record<string, string>>({});

  // Live score preview: as the user types period values, debounce a call to the
  // same backend scoring service used everywhere else (no scoring math is
  // duplicated client-side) and update the Change/Gap/Score cells in place.
  const [liveCalculatingIds, setLiveCalculatingIds] = useState<Set<number>>(new Set());
  const liveScoreTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const liveScoreAbortControllers = useRef<Map<number, AbortController>>(new Map());
  const LIVE_SCORE_DEBOUNCE_MS = 500;

  // Initialize cell data when multiPeriodData changes
  useEffect(() => {
    if (multiPeriodData && multiPeriodData.length > 0) {
      const newCellData: Record<string, CellData> = {};

      multiPeriodData.forEach((periodData) => {
        periodData.objectives.forEach((objective) => {
          objective.indicators.forEach((indicator) => {
            // Performance trend columns (period data)
            selectedPeriods.forEach((period) => {
              // Use period.code instead of period.name to match backend data keys
              const periodKey = period.code || period.name;
              const cellKey = `${indicator.id}_${periodKey}`;
              const dataValue = indicator.data_values && indicator.data_values[periodKey];

              // Check if this is DHIS2 data (has dhis2_uid) or manual data
              const isDHIS2Data = !!indicator.dhis2_uid;
              const hasValue = dataValue && dataValue.value !== null && dataValue.value !== undefined;
              const isManualEntry = dataValue && dataValue.manual_override !== null && dataValue.manual_override !== undefined;

              // Preserve existing manual entries during calculation
              const existingManualValue = manualEntriesRef.current[cellKey];
              const isManualCell = existingManualValue && existingManualValue.trim() !== '';

              newCellData[cellKey] = {
                value: isManualCell ? existingManualValue : (hasValue && dataValue.value !== null ? dataValue.value.toString() : ''),
                isEditable: !isDHIS2Data, // Editable if not DHIS2 data
                isDHIS2Data: isDHIS2Data,
                isManualEntry: isManualEntry
              };
            });

            // Change column
            const changeKey = `${indicator.id}_change`;
            let changeDisplay = '';

            if (indicator.score?.percent_change !== undefined && indicator.score?.percent_change !== null) {
              const percentChange = indicator.score.percent_change;
              const isDecreaseIndicator = indicator.target_type === 'decrease';

              if (isDecreaseIndicator) {
                // Decrease indicators: going down is good
                if (percentChange > 0) changeDisplay = `+${percentChange}% (↑ Bad)`;
                else if (percentChange < 0) changeDisplay = `${percentChange}% (↓ Good)`;
                else changeDisplay = `${percentChange}% (→ Stable)`;
              } else {
                if (percentChange > 0) changeDisplay = `+${percentChange}% (↑ Good)`;
                else if (percentChange < 0) changeDisplay = `${percentChange}% (↓ Bad)`;
                else changeDisplay = `${percentChange}% (→ Stable)`;
              }
            } else {
              // percent_change is null (first year, no data, etc.)
              if (indicator.score?.score === -2) {
                changeDisplay = 'No data';
              } else if (indicator.score?.is_first_year === "Yes" || indicator.score?.is_first_year === true) {
                changeDisplay = 'First year';
              } else {
                changeDisplay = '—';
              }
            }

            newCellData[changeKey] = { value: changeDisplay, isEditable: false, isDHIS2Data: false };

            // P-T Gap Analysis column
            newCellData[`${indicator.id}_gap`] = {
              value: indicator.score?.target_gap !== undefined && indicator.score?.target_gap !== null
                ? `${indicator.score?.target_gap}%`
                : '',
              isEditable: false,
              isDHIS2Data: false
            };

            // Target column - display target_display but keep target_value for scoring
            newCellData[`${indicator.id}_target`] = {
              value: indicator.target_display || indicator.target_value?.toString() || '',
              isEditable: false,
              isDHIS2Data: false
            };

            // Assessed score column
            newCellData[`${indicator.id}_score`] = {
              value: indicator.score?.score?.toString() || '-2.00',
              isEditable: true,
              isDHIS2Data: false
            };

            // Remarks column
            newCellData[`${indicator.id}_remarks`] = {
              value: indicator.score?.remarks || '',
              isEditable: true,
              isDHIS2Data: false
            };
          });
        });
      });

      // Milestone remarks
      multiPeriodData.forEach((periodData) => {
        periodData.objectives.forEach((objective) => {
          if (objective.milestone) {
            newCellData[`milestone_${objective.id}_remarks`] = {
              value: objective.milestone.notes || '',
              isEditable: true,
              isDHIS2Data: false
            };
          }
        });
      });

      setCellData(newCellData);
    }
  }, [multiPeriodData, selectedPeriods]);

  // Latest vs previous period, chronologically - matches the semantics the
  // backend export/bulk-calculation path already uses (periods[-1]/periods[-2]).
  const getSortedPeriodKeys = () => {
    return [...selectedPeriods]
      .sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name))
      .map(p => p.code || p.name);
  };

  const triggerLiveScorePreview = (indicatorId: number, latestCellData: Record<string, CellData>) => {
    const existingTimer = liveScoreTimers.current.get(indicatorId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      liveScoreTimers.current.delete(indicatorId);

      const sortedPeriodKeys = getSortedPeriodKeys();
      if (sortedPeriodKeys.length === 0) return;

      const latestKey = sortedPeriodKeys[sortedPeriodKeys.length - 1];
      const previousKey = sortedPeriodKeys.length > 1 ? sortedPeriodKeys[sortedPeriodKeys.length - 2] : null;

      const parseCell = (periodKey: string | null) => {
        if (!periodKey) return null;
        const raw = latestCellData[`${indicatorId}_${periodKey}`]?.value;
        if (raw === undefined || raw === null || raw.trim() === '') return null;
        const parsed = parseFloat(raw);
        return isNaN(parsed) ? null : parsed;
      };

      const currentValue = parseCell(latestKey);
      const previousValue = parseCell(previousKey);

      // The backend requires current_value - skip firing a call that would just 400
      // (e.g. the user cleared the field, or hasn't reached the latest period yet).
      if (currentValue === null) return;

      // Abort any in-flight preview call for this indicator before starting a new one.
      liveScoreAbortControllers.current.get(indicatorId)?.abort();
      const controller = new AbortController();
      liveScoreAbortControllers.current.set(indicatorId, controller);

      setLiveCalculatingIds(prev => new Set(prev).add(indicatorId));
      try {
        const result = await calculateRealTimeScore(indicatorId, currentValue, previousValue, controller.signal);
        if (controller.signal.aborted) return;

        if (result.success && result.score_result) {
          const { score, percent_change, target_gap } = result.score_result;
          setCellData(prev => ({
            ...prev,
            [`${indicatorId}_score`]: { ...prev[`${indicatorId}_score`], value: score?.toString() ?? prev[`${indicatorId}_score`]?.value, isEditable: true, isDHIS2Data: false },
            [`${indicatorId}_change`]: { ...prev[`${indicatorId}_change`], value: percent_change !== null && percent_change !== undefined ? `${percent_change}%` : prev[`${indicatorId}_change`]?.value, isEditable: false, isDHIS2Data: false },
            [`${indicatorId}_gap`]: { ...prev[`${indicatorId}_gap`], value: target_gap !== null && target_gap !== undefined ? `${target_gap}%` : prev[`${indicatorId}_gap`]?.value, isEditable: false, isDHIS2Data: false },
          }));
          onScoreChange(indicatorId, score?.toString() ?? '');
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Live score preview failed:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLiveCalculatingIds(prev => {
            const next = new Set(prev);
            next.delete(indicatorId);
            return next;
          });
        }
      }
    }, LIVE_SCORE_DEBOUNCE_MS);

    liveScoreTimers.current.set(indicatorId, timer);
  };

  // Clean up any pending debounce timers / in-flight requests on unmount.
  useEffect(() => {
    const timers = liveScoreTimers.current;
    const controllers = liveScoreAbortControllers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      controllers.forEach(controller => controller.abort());
    };
  }, []);

  const handleCellChange = async (cellKey: string, value: string) => {
    setCellData(prev => ({
      ...prev,
      [cellKey]: { ...prev[cellKey], value }
    }));

    // Store manual entries in ref for preservation during calculation
    const cell = cellData[cellKey];
    if (cell && !cell.isDHIS2Data) {
      manualEntriesRef.current[cellKey] = value;
    }

    // Parse cell key to get indicator ID and period/column
    const [indicatorId, column] = cellKey.split('_');

    if (column === 'score') {
      onScoreChange(parseInt(indicatorId), value);
    } else if (column === 'remarks') {
      onRemarksChange?.(parseInt(indicatorId), value);
    } else if (selectedPeriods.some(p => (p.code || p.name) === column)) {
      await onCellEdit(parseInt(indicatorId), column, value);
      // Fire the debounced live score preview using the value the user just typed
      // (cellData state hasn't necessarily flushed yet, so pass it explicitly).
      triggerLiveScorePreview(parseInt(indicatorId), { ...cellData, [cellKey]: { ...cellData[cellKey], value } });
    }
  };

  // Single source of truth for "what has the user manually typed right now" -
  // cellData is ExcelTable's own state, never synced up to the parent page's
  // assessmentData (onCellEdit is a display-only notification, not a data
  // sync), so exporting/saving must read it from here rather than from
  // whatever the parent thinks the data looks like.
  const collectManualEntriesFromCells = (): Record<number, Record<string, number | null>> => {
    const manualEntries: Record<number, Record<string, number | null>> = {};

    Object.entries(cellData).forEach(([cellKey, cell]) => {
      if (!cell.isDHIS2Data && cell.value.trim() !== '') {
        const [indicatorId, periodKey] = cellKey.split('_');
        // Only period columns are indicator data - skip synthetic keys like
        // "<id>_score" / "<id>_remarks" that share the same cellData map.
        if (!selectedPeriods.some(p => (p.code || p.name) === periodKey)) return;
        const indicatorIdNum = parseInt(indicatorId);
        const value = parseFloat(cell.value);

        if (!isNaN(value)) {
          if (!manualEntries[indicatorIdNum]) {
            manualEntries[indicatorIdNum] = {};
          }
          manualEntries[indicatorIdNum][periodKey] = value;
        }
      }
    });

    return manualEntries;
  };

  const handleBulkScoreCalculation = async () => {
    if (!onBulkScoreCalculation) return;
    onCalculatingStateChange?.(true);
    try {
      await onBulkScoreCalculation(collectManualEntriesFromCells());
    } catch (error) {
      console.error('Error calculating scores:', error);
    } finally {
      onCalculatingStateChange?.(false);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    triggerBulkCalculation: handleBulkScoreCalculation,
    getManualEntries: collectManualEntriesFromCells
  }), [handleBulkScoreCalculation, cellData, selectedPeriods]);

  // Filter indicators based on search term — computed once per change, not per render pass.
  const visibleObjectives = useMemo(() => {
    const objectives = multiPeriodData?.[0]?.objectives || [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return objectives;
    return objectives
      .map((objective: any) => ({
        ...objective,
        indicators: objective.indicators.filter((indicator: any) => indicator.name.toLowerCase().includes(term)),
      }))
      .filter((objective: any) => objective.indicators.length > 0);
  }, [multiPeriodData, searchTerm]);

  const columnCount = 7 + selectedPeriods.length;

  if (!multiPeriodData || multiPeriodData.length === 0) {
    return (
      <EmptyState
        illustration="assessment"
        title="No assessment data yet"
        description="Generate a report to see the indicators and scores here."
      />
    );
  }

  return (
    <div className="print-auto flex min-h-0 flex-1 flex-col">
      {/* Print header - only visible when printing */}
      <div className="mb-4 hidden text-center print:block">
        <h1 className="text-2xl font-bold">Holistic Assessment Report</h1>
        <p className="text-xs text-muted-foreground">
          Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Toolbar band */}
      <div className="no-print flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-subtle px-4 py-3">
        <div className="relative w-full max-w-sm">
          <label htmlFor="sheet-search" className="sr-only">Search indicators</label>
          <Input
            id="sheet-search"
            type="text"
            placeholder="Search indicators by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <ul className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Key">
          <li className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-info" aria-hidden="true" /> From DHIMS2
          </li>
          <li className="inline-flex items-center gap-1.5">
            <PenLine className="h-3.5 w-3.5 text-tint-amber" aria-hidden="true" /> Entered by hand
          </li>
          <li className="inline-flex items-center gap-1">
            Score
            {SCORE_OPTIONS.map((s) => (
              <span key={s} className={cn('font-clinical inline-flex h-5 min-w-6 items-center justify-center rounded px-1 text-2xs font-semibold', scoreClass(s))}>
                {Number(s) > 0 ? `+${s}` : s}
              </span>
            ))}
          </li>
        </ul>
      </div>

      <div className="print-table-container min-h-0 flex-1 overflow-auto">
        <table className="print-table w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface-subtle">
            <tr>
              <th scope="col" className={cn(HEAD, 'w-16 text-left')}>#</th>
              <th scope="col" className={cn(HEAD, 'min-w-[280px] text-left')}>Indicator</th>
              {selectedPeriods.map((period) => (
                <th key={period.name} scope="col" className={cn(HEAD, 'font-clinical w-28 text-center')}>
                  {period.name}
                </th>
              ))}
              <th scope="col" className={cn(HEAD, 'w-36 text-center')}>Change</th>
              <th scope="col" className={cn(HEAD, 'w-28 text-center')}>Gap to target</th>
              <th scope="col" className={cn(HEAD, 'w-24 text-center')}>Target</th>
              <th scope="col" className={cn(HEAD, 'w-32 text-center')}>
                Assessed score
                <span className="block text-2xs font-normal text-muted-foreground">−2 to +2</span>
              </th>
              <th scope="col" className={cn(HEAD, 'min-w-[160px] text-left')}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleObjectives.length > 0 ? (
              visibleObjectives.map((objective: any, objIndex: number) => (
                <React.Fragment key={objective.id}>
                  {/* Objective row */}
                  <tr className="sheet-row-objective">
                    <th scope="colgroup" colSpan={columnCount} className={cn(CELL, 'py-2 text-left text-sm font-semibold')}>
                      {objective.name}
                    </th>
                  </tr>

                  {/* Indicators */}
                  {[...objective.indicators]
                    .sort((a: any, b: any) => a.display_order - b.display_order)
                    .map((indicator: any, indIndex: number) => {
                      const scoreValue = cellData[`${indicator.id}_score`]?.value || '-2.00';
                      const changeValue = cellData[`${indicator.id}_change`]?.value || '';
                      const gapValue = cellData[`${indicator.id}_gap`]?.value || '';
                      return (
                        <tr key={indicator.id} className="transition-colors hover:bg-surface-muted/60">
                          <td className={cn(CELL, 'text-center')}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-clinical inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground" tabIndex={0}>
                                  {indicator.indicator_number || `${objIndex + 1}.${indicator.display_order || indIndex + 1}`}
                                  {indicator.dhis2_uid ? (
                                    <Database className="h-3 w-3 text-info" aria-label="From DHIMS2" />
                                  ) : (
                                    <PenLine className="h-3 w-3 text-tint-amber" aria-label="Entered by hand" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {indicator.dhis2_uid ? (
                                  <div className="space-y-0.5">
                                    <p className="font-medium">From DHIMS2</p>
                                    <p className="font-clinical opacity-80">{indicator.dhis2_uid}</p>
                                    <p>Values are fetched automatically.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <p className="font-medium">Entered by hand</p>
                                    <p>Type the values for each period.</p>
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className={cn(CELL, 'text-xs text-foreground')}>{indicator.name}</td>

                          {/* Period values */}
                          {selectedPeriods.map((period) => {
                            const periodKey = period.code || period.name;
                            const cellKey = `${indicator.id}_${periodKey}`;
                            const cell = cellData[cellKey];

                            return (
                              <td key={period.name} className={cn(CELL, 'p-1')}>
                                {cell?.isEditable ? (
                                  <Input
                                    type="number"
                                    step="any"
                                    inputMode="decimal"
                                    value={cell?.value || ''}
                                    onChange={(e) => handleCellChange(cellKey, e.target.value)}
                                    className="font-clinical h-7 rounded-md border-dashed border-input/70 bg-tint-amber-bg px-1.5 text-center text-xs"
                                    placeholder="Enter"
                                    aria-label={`${indicator.name}, ${period.name}`}
                                  />
                                ) : (
                                  <div className="font-clinical text-center text-xs">
                                    {cell?.value ? (
                                      <span className="text-foreground">{cell.value}</span>
                                    ) : (
                                      <span className="text-text-disabled">No data</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Change */}
                          <td className={cn(CELL, 'text-center text-xs', changeClass(changeValue.replace('%', '')))}>
                            {changeValue}
                          </td>

                          {/* Gap to target */}
                          <td className={cn(CELL, 'font-clinical text-center text-xs', gapClass(gapValue.replace('%', '')))}>
                            {gapValue}
                          </td>

                          {/* Target */}
                          <td className={cn(CELL, 'font-clinical text-center text-xs')}>
                            {cellData[`${indicator.id}_target`]?.value || ''}
                          </td>

                          {/* Assessed score */}
                          <td className={cn(CELL, 'p-1')}>
                            {indicator.score?.isLoading ? (
                              <div className="score-none flex h-7 items-center justify-center gap-1 rounded-md text-xs" role="status">
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                Calculating…
                              </div>
                            ) : (
                            <div className="relative">
                              <ScoreCell score={scoreValue} label={`Score for ${indicator.name}`} />
                              {liveCalculatingIds.has(indicator.id) && (
                                <span
                                  className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full bg-accent"
                                  title="Recalculating score…"
                                  role="status"
                                  aria-label="Recalculating score"
                                />
                              )}
                            </div>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className={cn(CELL, 'p-1')}>
                            <Input
                              className="h-7 rounded-md border-transparent bg-transparent px-1.5 text-xs hover:border-input"
                              placeholder="Add remarks"
                              value={cellData[`${indicator.id}_remarks`]?.value || ''}
                              onChange={(e) => handleCellChange(`${indicator.id}_remarks`, e.target.value)}
                              aria-label={`Remarks for ${indicator.name}`}
                            />
                          </td>
                        </tr>
                      );
                    })}

                  {/* Milestone row */}
                  <tr className="sheet-row-milestone">
                    <td className={cn(CELL, 'text-center')}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help text-xs font-semibold text-tint-amber" tabIndex={0}>MS</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1.5">
                            <p className="font-semibold">Milestone score</p>
                            <p>Given by hand, based on evidence of progress.</p>
                            <ul className="space-y-0.5">
                              <li><span className="font-semibold">+2</span> Fully achieved</li>
                              <li><span className="font-semibold">0</span> Started but not achieved</li>
                              <li><span className="font-semibold">−2</span> No evidence, or not complete</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className={cn(CELL, 'text-xs font-medium text-foreground')}>
                      {objective.milestone?.name || `Milestone for ${objective.name.replace('Objective', '').trim()}`}
                    </td>

                    {/* Period, change, gap and target columns are empty for milestones */}
                    {Array.from({ length: selectedPeriods.length + 3 }).map((_, i) => (
                      <td key={i} className={cn(CELL, 'text-center text-xs text-text-disabled')}>—</td>
                    ))}

                    <td className={cn(CELL, 'p-1')}>
                      <ScoreCell
                        score={`${objective.milestone?.score ?? -2}`}
                        label={`Milestone score for ${objective.name}`}
                      />
                    </td>

                    <td className={cn(CELL, 'p-1')}>
                      <Input
                        className="h-7 rounded-md border-transparent bg-transparent px-1.5 text-xs hover:border-input"
                        placeholder="Add remarks"
                        value={cellData[`milestone_${objective.id}_remarks`]?.value || ''}
                        onChange={(e) => onMilestoneRemarksChange?.(objective.id, e.target.value)}
                        aria-label={`Milestone remarks for ${objective.name}`}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="border border-border">
                  <EmptyState
                    illustration="no-results"
                    title={`No indicator matches “${searchTerm}”`}
                    description="Check the spelling, or clear the search to see every indicator."
                    action={{ label: 'Clear search', onClick: () => setSearchTerm('') }}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ExcelTable.displayName = 'ExcelTable';

/** Read-only score: the calculated value in its scale colour ("-2.00" → "-2", "2.00" → "+2"). */
function ScoreCell({ score, label }: { score: string; label: string }) {
  const n = parseFloat(score);
  const text = isNaN(n) ? '—' : n > 0 ? `+${n}` : `${n}`;
  return (
    <div
      className={cn('score-cell font-clinical flex h-7 items-center justify-center rounded-md text-xs font-bold', scoreClass(score))}
      aria-label={`${label}: ${text}`}
    >
      {text}
    </div>
  );
}

export default ExcelTable;
