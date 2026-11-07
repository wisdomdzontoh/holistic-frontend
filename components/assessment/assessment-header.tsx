'use client';

import React from 'react';
import { Building2, Calculator, Calendar, Filter, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface AssessmentHeaderProps {
  selectedOrgUnits: string[];
  selectedPeriods: any[];
  indicatorSourceFilter: 'all' | 'dhis2' | 'manual';
  isCalculatingScores?: boolean;
  onBulkScoreCalculation?: () => void;
  /** Show the "Calculate scores" action only once a report is on screen. */
  isDataLoaded?: boolean;
}

const SOURCE_LABEL = {
  all: 'All indicators',
  dhis2: 'DHIMS2 indicators',
  manual: 'Indicators entered by hand',
} as const;

/** Toolbar band above the sheet: what is being shown, plus "Calculate scores" for hand-entered values. */
export default function AssessmentHeader({
  selectedOrgUnits,
  selectedPeriods,
  indicatorSourceFilter,
  isCalculatingScores = false,
  onBulkScoreCalculation,
  isDataLoaded = true,
}: AssessmentHeaderProps) {
  return (
    <div className="no-print flex min-h-14 shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-surface-subtle px-4 py-2.5">
      <Summary icon={Building2} label="Facilities" value={selectedOrgUnits.length} />
      <Summary icon={Calendar} label="Periods" value={selectedPeriods.length} />
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" aria-hidden="true" />
        Showing <span className="font-medium text-foreground">{SOURCE_LABEL[indicatorSourceFilter]}</span>
      </span>

      {onBulkScoreCalculation && isDataLoaded && (
        <Button
          variant="outline"
          className="ml-auto"
          onClick={onBulkScoreCalculation}
          disabled={isCalculatingScores}
          title="Recalculate scores using the values you have typed in"
        >
          {isCalculatingScores ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Calculating…
            </>
          ) : (
            <>
              <Calculator aria-hidden="true" />
              Calculate scores
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
      <span className="font-clinical inline-flex min-w-6 justify-center rounded-full border border-border bg-card px-1.5 text-xs font-medium text-foreground">
        {value}
      </span>
    </span>
  );
}
