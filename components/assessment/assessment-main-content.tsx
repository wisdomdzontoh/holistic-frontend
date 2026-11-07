'use client';

import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/common/empty-state';
import { InlineNotice } from '@/components/common/inline-notice';
import ExcelTable from '@/components/assessment/excel-table';

interface AssessmentMainContentProps {
  isLoadingSavedAssessment: boolean;
  isGenerating: boolean;
  isDataLoaded: boolean;
  assessmentData: any;
  selectedPeriods: any[];
  loadingProgress: number;
  loadingMessage: string;
  error: string | null;
  indicatorSourceFilter: 'all' | 'dhis2' | 'manual';
  isExporting: boolean;
  onBulkScoreCalculation: (manualEntries: Record<number, Record<string, number | null>>) => Promise<void>;
  onCalculatingStateChange?: (isCalculating: boolean) => void;
  excelTableRef?: React.RefObject<any>;
}

// Stable no-op handlers — new function identities every render would make the
// table's imperative handle and children re-create needlessly.
const noopCellEdit = async () => {};
const noopScoreChange = () => {};

export default function AssessmentMainContent({
  isLoadingSavedAssessment,
  isGenerating,
  isDataLoaded,
  assessmentData,
  selectedPeriods,
  loadingProgress,
  loadingMessage,
  error,
  indicatorSourceFilter,
  isExporting,
  onBulkScoreCalculation,
  onCalculatingStateChange,
  excelTableRef,
}: AssessmentMainContentProps) {
  // Memoised so the table only re-initialises its cells when the data or the
  // filter actually change — not on every parent re-render (which used to wipe
  // live score previews and typed remarks).
  const filteredData = useMemo(() => {
    if (!assessmentData) return null;
    return assessmentData.map((pd: any) => ({
      ...pd,
      objectives: pd.objectives.map((obj: any) => ({
        ...obj,
        indicators: obj.indicators.filter((ind: any) => {
          if (indicatorSourceFilter === 'all') return true;
          const isDHIS2 = Boolean(ind.dhis2_uid);
          return indicatorSourceFilter === 'dhis2' ? isDHIS2 : !isDHIS2;
        }),
      })),
    }));
  }, [assessmentData, indicatorSourceFilter]);

  if (isLoadingSavedAssessment) {
    return (
      <CenteredPanel>
        <div className="flex items-center gap-3" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Opening saved assessment…</p>
            <p className="text-sm text-muted-foreground">Loading its indicators, values and scores.</p>
          </div>
        </div>
      </CenteredPanel>
    );
  }

  if (isGenerating) {
    return (
      <CenteredPanel>
        <div className="space-y-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Generating your assessment</p>
              <p className="text-sm text-muted-foreground">{loadingMessage || 'Fetching data from DHIMS2…'}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-clinical font-medium text-foreground">{loadingProgress}%</span>
            </div>
            <Progress value={loadingProgress} />
          </div>
          <p className="text-xs text-muted-foreground">This can take a minute for many facilities or periods.</p>
        </div>
      </CenteredPanel>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-lg rounded-xl border border-border bg-card">
          <EmptyState
            illustration="assessment"
            title="Set up your assessment"
            description="Use the set-up panel on the left to choose what to assess."
          >
            <ol className="w-full space-y-2 text-left text-sm">
              {[
                'Choose one or more facilities.',
                'Choose the periods to compare.',
                'Select “Generate report” to fetch the data and score it.',
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-3 rounded-lg bg-surface-subtle px-3 py-2">
                  <span className="font-clinical flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
            {error && (
              <InlineNotice tone="error" className="w-full text-left">
                {error}
              </InlineNotice>
            )}
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="print-auto flex min-h-0 flex-1 flex-col p-3 sm:p-4">
      <div className="print-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <ExcelTable
          ref={excelTableRef}
          multiPeriodData={filteredData}
          selectedPeriods={selectedPeriods}
          onCellEdit={noopCellEdit}
          onScoreChange={noopScoreChange}
          onBulkScoreCalculation={onBulkScoreCalculation}
          isExporting={isExporting}
          onCalculatingStateChange={onCalculatingStateChange}
        />
      </div>
    </div>
  );
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">{children}</div>
    </div>
  );
}
