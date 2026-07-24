'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Edit3, Calculator, CheckCircle2, Info, Loader2, Search, X } from 'lucide-react';
import { AssessmentData, Period, calculateRealTimeScore } from '@/lib/assessment-service';

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



const ExcelTable = forwardRef<{ triggerBulkCalculation: () => void }, ExcelTableProps>(({ 
  multiPeriodData, 
  selectedPeriods, 
  onCellEdit, 
  onScoreChange,
  onMilestoneScoreChange,
  onRemarksChange,
  onMilestoneRemarksChange,
  onBulkScoreCalculation,
  isExporting,
  onCalculatingStateChange
}, ref) => {
  const [cellData, setCellData] = useState<Record<string, CellData>>({});
  const [hasManualEntries, setHasManualEntries] = useState(false);
  const [isCalculatingScores, setIsCalculatingScores] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const manualEntriesRef = useRef<Record<string, string>>({});

  // Live score preview: as the user types period values, debounce a call to the
  // same backend scoring service used everywhere else (no scoring math is
  // duplicated client-side) and update the Change/Gap/Score cells in place.
  const [liveCalculatingIds, setLiveCalculatingIds] = useState<Set<number>>(new Set());
  const liveScoreTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const liveScoreAbortControllers = useRef<Map<number, AbortController>>(new Map());
  const LIVE_SCORE_DEBOUNCE_MS = 500;

  // Check if there are manual entries
  useEffect(() => {
    if (cellData) {
      const manualEntries = Object.values(cellData).some(cell => 
        !cell.isDHIS2Data && cell.value.trim() !== ''
      );
      setHasManualEntries(manualEntries);
    }
  }, [cellData]);

  // Initialize cell data when multiPeriodData changes or when forced to refresh
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
            
                                      // Change column (computed in page logic)
             const changeKey = `${indicator.id}_change`;
             let changeDisplay = '';
             
             // Debug: Log the indicator score data for Change column
             console.log(`Change column for indicator ${indicator.id}:`, {
               percent_change: indicator.score?.percent_change,
               target_type: indicator.target_type,
               score: indicator.score?.score
             });
             
             if (indicator.score?.percent_change !== undefined && indicator.score?.percent_change !== null) {
               const percentChange = indicator.score.percent_change;
               const isDecreaseIndicator = indicator.target_type === 'decrease';
               
               // For decrease indicators, add visual indicator
               if (isDecreaseIndicator) {
                 if (percentChange > 0) {
                   changeDisplay = `+${percentChange}% (↗️ Bad)`; // Increased when should decrease
                 } else if (percentChange < 0) {
                   changeDisplay = `${percentChange}% (↘️ Good)`; // Decreased when should decrease
                 } else {
                   changeDisplay = `${percentChange}% (→ Stable)`;
                 }
               } else {
                 // For increase indicators, standard display
                 if (percentChange > 0) {
                   changeDisplay = `+${percentChange}% (↗️ Good)`; // Increased when should increase
                 } else if (percentChange < 0) {
                   changeDisplay = `${percentChange}% (↘️ Bad)`; // Decreased when should increase
                 } else {
                   changeDisplay = `${percentChange}% (→ Stable)`;
                 }
               }
             } else {
               // Handle cases where percent_change is null (first year, no data, etc.)
               if (indicator.score?.score === -2) {
                 changeDisplay = 'No Data';
               } else if (indicator.score?.is_first_year === "Yes" || indicator.score?.is_first_year === true) {
                 changeDisplay = 'First Year';
               } else {
                 changeDisplay = 'N/A';
               }
             }
            
            newCellData[changeKey] = {
              value: changeDisplay,
              isEditable: false,
              isDHIS2Data: false
            };
            
            // P-T Gap Analysis column (computed in page logic)
            const gapKey = `${indicator.id}_gap`;
            newCellData[gapKey] = {
              value: indicator.score?.target_gap !== undefined && indicator.score?.target_gap !== null
                ? `${indicator.score?.target_gap}%`
                : '',
              isEditable: false,
              isDHIS2Data: false
            };
            
            // Target column - display target_display but keep target_value for scoring
            const targetKey = `${indicator.id}_target`;
            newCellData[targetKey] = {
              value: indicator.target_display || indicator.target_value?.toString() || '',
              isEditable: false,
              isDHIS2Data: false
            };
            
                         // Assessed score column
             const scoreKey = `${indicator.id}_score`;
             newCellData[scoreKey] = {
               value: indicator.score?.score?.toString() || '-2.00',
               isEditable: true,
               isDHIS2Data: false
             };
             
             // Remarks column
             const remarksKey = `${indicator.id}_remarks`;
             newCellData[remarksKey] = {
               value: indicator.score?.remarks || '',
               isEditable: true,
               isDHIS2Data: false
             };
          });
        });
             });
       
       // Add milestone remarks
       multiPeriodData.forEach((periodData) => {
         periodData.objectives.forEach((objective) => {
           if (objective.milestone) {
             const milestoneRemarksKey = `milestone_${objective.id}_remarks`;
             newCellData[milestoneRemarksKey] = {
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
    return () => {
      liveScoreTimers.current.forEach(timer => clearTimeout(timer));
      liveScoreAbortControllers.current.forEach(controller => controller.abort());
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
      if (onRemarksChange) {
        onRemarksChange(parseInt(indicatorId), value);
      }
    } else if (selectedPeriods.some(p => (p.code || p.name) === column)) {
      await onCellEdit(parseInt(indicatorId), column, value);
      // Fire the debounced live score preview using the value the user just typed
      // (cellData state hasn't necessarily flushed yet, so pass it explicitly).
      triggerLiveScorePreview(parseInt(indicatorId), { ...cellData, [cellKey]: { ...cellData[cellKey], value } });
    }
  };

  const handleMilestoneScoreChange = (objectiveId: number, value: string) => {
    if (onMilestoneScoreChange) {
      onMilestoneScoreChange(objectiveId, value);
    }
  };

  const handleMilestoneRemarksChange = (objectiveId: number, value: string) => {
    if (onMilestoneRemarksChange) {
      onMilestoneRemarksChange(objectiveId, value);
    }
  };



  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '#6c757d';
    
    // New color scheme: 2 (Dark Green), 1 (Light Green), 0 (Yellow), -1 (Light Red), -2 (Red)
    if (numScore >= 2) return '#548235';
    if (numScore >= 1) return '#A9D08E';
    if (numScore === 0) return '#FFFF00';
    if (numScore === -1) return '#FFC7CE';
    return '#FF0000';
  };

  const handleBulkScoreCalculation = async () => {
    if (!onBulkScoreCalculation) return;
    
    setIsCalculatingScores(true);
    
    // Notify parent about calculating state
    if (onCalculatingStateChange) {
      onCalculatingStateChange(true);
    }
    
    try {
      // Collect manual entries
      const manualEntries: Record<number, Record<string, number | null>> = {};
      
      Object.entries(cellData).forEach(([cellKey, cell]) => {
        if (!cell.isDHIS2Data && cell.value.trim() !== '') {
          const [indicatorId, periodKey] = cellKey.split('_');
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

      await onBulkScoreCalculation(manualEntries);
    } catch (error) {
      console.error('Error calculating scores:', error);
    } finally {
      setIsCalculatingScores(false);
      
      // Notify parent about calculating state
      if (onCalculatingStateChange) {
        onCalculatingStateChange(false);
      }
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    triggerBulkCalculation: handleBulkScoreCalculation
  }), [handleBulkScoreCalculation]);

  const getRowBackground = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-accent-gold-pale border-l-4 border-l-accent-gold';
      case 'objective':
        return 'bg-accent-gold-pale';
      default:
        return 'bg-white';
    }
  };

  const getChangeBg = (val?: string) => {
    if (!val) return '';
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    // Flow diagram: >5% (Green), -5% to 5% (Yellow), <-5% (Red)
    if (n > 5) return 'bg-green-50';
    if (n >= -5) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getGapBg = (val?: string) => {
    if (!val) return '';
    const n = Math.abs(parseFloat(val));
    if (isNaN(n)) return '';
    // Flow diagram: ≤10% (Green), 10%<PT≤40% (Yellow), >40% (Red)
    if (n <= 10) return 'bg-green-50';
    if (n <= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getPrintRowClass = (type: string) => {
    if (isExporting) return ''; // No print styles when exporting
    switch (type) {
      case 'milestone':
        return 'print-row-milestone';
      case 'objective':
        return 'print-row-objective';
      default:
        return '';
    }
  };

  const getPrintChangeClass = (val?: string) => {
    if (!val) return '';
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    if (n > 0) return 'print-change-positive';
    if (n < 0) return 'print-change-negative';
    return 'print-change-neutral';
  };

  const getPrintGapClass = (val?: string) => {
    if (!val) return '';
    const n = Math.abs(parseFloat(val));
    if (isNaN(n)) return '';
    if (n <= 10) return 'print-gap-good';
    if (n <= 40) return 'print-gap-warning';
    return 'print-gap-poor';
  };

  const getPrintScoreClass = (score: string) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '';
    if (numScore >= 2) return 'print-score-2';
    if (numScore >= 1) return 'print-score-1';
    if (numScore === 0) return 'print-score-0';
    if (numScore === -1) return 'print-score-neg1';
    if (numScore === -2) return 'print-score-neg2';
    return '';
  };

  // Filter indicators based on search term
  const filterIndicators = (objectives: any[]) => {
    if (!searchTerm.trim()) return objectives;
    
    return objectives.map(objective => ({
      ...objective,
      indicators: objective.indicators.filter((indicator: any) =>
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(objective => objective.indicators.length > 0);
  };

  if (!multiPeriodData || multiPeriodData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No assessment data available. Generate a report to view data.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Print Styles for Color Coding */}
      <style jsx>{`
        @media print {
          /* Score Color Coding for Print */
          .print-score-2 { background-color: #548235 !important; color: white !important; }
          .print-score-1 { background-color: #A9D08E !important; color: black !important; }
          .print-score-0 { background-color: #FFFF00 !important; color: black !important; }
          .print-score-neg1 { background-color: #FFC7CE !important; color: black !important; }
          .print-score-neg2 { background-color: #FF0000 !important; color: white !important; }
          
          /* Change Background Colors for Print */
          .print-change-positive { background-color: #d1fae5 !important; }
          .print-change-neutral { background-color: #fef3c7 !important; }
          .print-change-negative { background-color: #fee2e2 !important; }
          
          /* Gap Background Colors for Print */
          .print-gap-good { background-color: #d1fae5 !important; }
          .print-gap-warning { background-color: #fef3c7 !important; }
          .print-gap-poor { background-color: #fee2e2 !important; }
          
          /* Row Background Colors for Print */
          .print-row-objective { background-color: #fdf3dc !important; }
          .print-row-milestone { background-color: #fdf3dc !important; border-left: 4px solid #b8860b !important; }
          
          /* Table Styling for Print */
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db !important;
            padding: 4px 6px !important;
            text-align: center !important;
            vertical-align: middle !important;
          }
          
          .print-table th {
            background-color: var(--brand-navy) !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 9px !important;
          }
          
          /* Header Styling for Print */
          .print-header {
            text-align: center !important;
            margin-bottom: 20px !important;
            page-break-after: avoid !important;
          }
          
          .print-header h1 {
            font-size: 24px !important;
            font-weight: bold !important;
            margin-bottom: 8px !important;
            color: #1f2937 !important;
          }
          
          .print-header p {
            font-size: 12px !important;
            color: #6b7280 !important;
            margin: 0 !important;
          }
          
          /* Ensure proper page breaks */
          .print-table tr {
            page-break-inside: avoid !important;
          }
          
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print-header">
        <h1>Holistic Assessment Report</h1>
        <p>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Search Bar - Hidden when printing */}
      <div className="no-print mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search indicators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 h-9 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-500 mt-1">
            Showing indicators matching "{searchTerm}"
          </p>
        )}
      </div>
    
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-collapse border border-gray-200 text-sm print-table">
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: 'var(--brand-navy)' }} className="text-white">
              <th className="border border-gray-200 px-2 py-2 text-left font-medium bg-brand-navy" style={{ width: '50px' }}>
                #
              </th>
              <th className="border border-gray-200 px-2 py-2 text-left font-medium bg-brand-navy" style={{ width: '300px' }}>
                Indicator
              </th>
              {/* Performance Trend columns */}
              {selectedPeriods.map((period) => (
                <th key={period.name} className="border border-gray-200 px-2 py-2 text-center font-medium bg-brand-navy" style={{ width: '100px' }}>
                  {period.name}
                </th>
              ))}
              <th className="border border-gray-200 px-2 py-2 text-center font-medium bg-brand-navy" style={{ width: '80px' }}>
                Change
              </th>
              <th className="border border-gray-200 px-2 py-2 text-center font-medium bg-brand-navy" style={{ width: '100px' }}>
                P-T Gap Analysis
              </th>
              <th className="border border-gray-200 px-2 py-2 text-center font-medium bg-brand-navy" style={{ width: '80px' }}>
                Target
              </th>
              <th className="border border-gray-200 px-2 py-2 text-center font-medium bg-brand-navy" style={{ width: '120px' }}>
                Assessed score (-2, -1, 0 +1, +2)
              </th>
              <th className="border border-gray-200 px-2 py-2 text-center font-medium bg-brand-navy" style={{ width: '100px' }}>
                Remarks
              </th>
            </tr>
          </thead>
        <tbody>
          {filterIndicators(multiPeriodData[0]?.objectives || []).length > 0 ? (
            filterIndicators(multiPeriodData[0]?.objectives || []).map((objective, objIndex) => (
            <React.Fragment key={objective.id}>
              {/* Objective Row */}
              <tr className={`${getRowBackground('objective')} ${getPrintRowClass('objective')}`}>
                <td className="border border-gray-200 px-2 py-2 font-medium" colSpan={7 + selectedPeriods.length}>
                  {objective.name}
                </td>
              </tr>
              
              {/* Indicators */}
              {objective.indicators
                .sort((a: any, b: any) => a.display_order - b.display_order)
                .map((indicator: any, indIndex: number) => (
                <tr key={indicator.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-2 text-center font-medium">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1 cursor-help">
                          {indicator.indicator_number || `${objIndex + 1}.${indicator.display_order || indIndex + 1}`}
                          {indicator.dhis2_uid ? (
                            <Database className="h-3 w-3 text-brand-green" />
                          ) : (
                            <Edit3 className="h-3 w-3 text-accent-gold" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          {indicator.dhis2_uid ? (
                            <div>
                              <p className="font-medium text-brand-green">DHIS2 Indicator</p>
                              <p className="text-xs text-gray-600">UID: {indicator.dhis2_uid}</p>
                              <p className="text-xs">Data fetched automatically from DHIS2</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-accent-gold">Manual Entry</p>
                              <p className="text-xs">Data requires manual input</p>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-gray-200 px-2 py-2">
                    <div className="text-xs">
                      {indicator.name}
                    </div>
                  </td>
                  
                  {/* Performance Trend columns */}
                  {selectedPeriods.map((period) => {
                    const periodKey = period.code || period.name;
                    const cellKey = `${indicator.id}_${periodKey}`;
                    const cell = cellData[cellKey];
                    
                    return (
                      <td key={period.name} className="border border-gray-200 px-1 py-1">
                        {cell?.isEditable ? (
                          <Input
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={cell?.value || ''}
                            onChange={(e) => handleCellChange(cellKey, e.target.value)}
                            className="h-6 text-xs border-0 p-1 focus:ring-1 focus:ring-brand-green"
                            placeholder="Enter value"
                          />
                        ) : (
                          <div className="text-xs text-center">
                            {cell?.value ? (
                              <span>{cell.value}</span>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </div>
                        )}

                      </td>
                    );
                  })}
                  
                              {/* Change column */}
            <td className={`border border-gray-200 px-1 py-1 ${getChangeBg((cellData[`${indicator.id}_change`]?.value || '').replace('%',''))} ${getPrintChangeClass((cellData[`${indicator.id}_change`]?.value || '').replace('%',''))}`}>
              <div className="text-xs text-center">
                {cellData[`${indicator.id}_change`]?.value || ''}
              </div>
            </td>
            
            {/* P-T Gap Analysis column */}
            <td className={`border border-gray-200 px-1 py-1 ${getGapBg((cellData[`${indicator.id}_gap`]?.value || '').replace('%',''))} ${getPrintGapClass((cellData[`${indicator.id}_gap`]?.value || '').replace('%',''))}`}>
              <div className="text-xs text-center">
                {cellData[`${indicator.id}_gap`]?.value || ''}
              </div>
            </td>
                  
                  {/* Target column */}
                  <td className="border border-gray-200 px-1 py-1">
                    <div className="text-xs text-center">
                      {cellData[`${indicator.id}_target`]?.value || ''}
                    </div>
                  </td>
                  
                  {/* Assessed score column */}
                  <td className={`border border-gray-200 px-1 py-1 ${getPrintScoreClass(cellData[`${indicator.id}_score`]?.value || '-2.00')}`}>
                    {indicator.score?.isLoading ? (
                      <div className="h-6 text-xs text-center flex items-center justify-center" style={{ 
                        backgroundColor: '#6c757d',
                        color: 'white'
                      }}>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Calculating...
                      </div>
                    ) : (
                      <div className="relative">
                        <Select
                          value={cellData[`${indicator.id}_score`]?.value?.replace('.00', '') || '-2'}
                          onValueChange={(value) => handleCellChange(`${indicator.id}_score`, `${value}.00`)}
                        >
                          <SelectTrigger className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-brand-green font-bold" style={{
                            backgroundColor: getScoreColor(cellData[`${indicator.id}_score`]?.value || '-2.00'),
                            color: 'black'
                          }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="-2">-2</SelectItem>
                            <SelectItem value="-1">-1</SelectItem>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                          </SelectContent>
                        </Select>
                        {liveCalculatingIds.has(indicator.id) && (
                          <div
                            className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand-teal animate-pulse"
                            title="Recalculating score..."
                          />
                        )}
                      </div>
                    )}
                  </td>
                  
                                     {/* Remarks column */}
                   <td className="border border-gray-200 px-1 py-1">
                     <Input
                       className="h-6 text-xs border-0 p-1"
                       placeholder="Add remarks"
                       value={cellData[`${indicator.id}_remarks`]?.value || ''}
                       onChange={(e) => handleCellChange(`${indicator.id}_remarks`, e.target.value)}
                     />
                   </td>
                </tr>
              ))}
              
              {/* Milestone row with score input */}
              <tr className={`${getRowBackground('milestone')} ${getPrintRowClass('milestone')}`}>
                <td className="border border-gray-200 px-2 py-2 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        MS
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <div className="space-y-2">
                        <div className="font-semibold text-sm text-accent-gold">Milestone Score (MS)</div>
                        <div className="text-xs">
                          <p>Milestone scores are manually assigned based on evidence of implementation progress.</p>
                          <p className="mt-2 font-medium">Scoring:</p>
                          <ul className="mt-1 space-y-1">
                            <li><span className="font-bold text-green-600">+2:</span> Complete realization</li>
                            <li><span className="font-bold text-yellow-600">0:</span> Started but not achieved</li>
                            <li><span className="font-bold text-red-600">-2:</span> No evidence/incomplete</li>
                          </ul>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="border border-gray-200 px-2 py-2 font-medium">
                  {objective.milestone?.name || `Milestone for ${objective.name.replace('Objective', '')}`}
                </td>
                
                {/* Performance Trend columns - empty for milestone */}
                {selectedPeriods.map((period) => (
                  <td key={period.name} className="border border-gray-200 px-1 py-1">
                    <div className="text-xs text-center text-gray-400">
                      -
                    </div>
                  </td>
                ))}
                
                {/* Change column - empty for milestone */}
                <td className="border border-gray-200 px-1 py-1">
                  <div className="text-xs text-center text-gray-400">
                    -
                  </div>
                </td>
                
                {/* P-T Gap Analysis column - empty for milestone */}
                <td className="border border-gray-200 px-1 py-1">
                  <div className="text-xs text-center text-gray-400">
                    -
                  </div>
                </td>
                
                {/* Target column - empty for milestone */}
                <td className="border border-gray-200 px-1 py-1">
                  <div className="text-xs text-center text-gray-400">
                    -
                  </div>
                </td>
                
                {/* Milestone score dropdown - properly aligned */}
                <td className={`border border-gray-200 px-1 py-1 ${getPrintScoreClass(`${objective.milestone?.score || -2}.00`)}`}>
                  <Select
                    value={objective.milestone?.score?.toString() || '-2'}
                    onValueChange={(value) => handleMilestoneScoreChange(objective.id, value)}
                  >
                    <SelectTrigger className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-brand-green font-bold" style={{ 
                      backgroundColor: getScoreColor(`${objective.milestone?.score || -2}.00`),
                      color: 'black'
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-2">-2</SelectItem>
                      <SelectItem value="-1">-1</SelectItem>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                
                {/* Milestone remarks column */}
                <td className="border border-gray-200 px-1 py-1">
                  <Input
                    className="h-6 text-xs border-0 p-1"
                    placeholder="Add remarks"
                    value={cellData[`milestone_${objective.id}_remarks`]?.value || ''}
                    onChange={(e) => handleMilestoneRemarksChange(objective.id, e.target.value)}
                  />
                </td>
              </tr>
            </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={7 + selectedPeriods.length} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-gray-300" />
                  <p>No indicators found matching "{searchTerm}"</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
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

export default ExcelTable;