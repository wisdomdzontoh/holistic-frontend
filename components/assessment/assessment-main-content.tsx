'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
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
}

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
  onBulkScoreCalculation
}: AssessmentMainContentProps) {
  if (isLoadingSavedAssessment) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#1E8449] animate-spin" />
              Loading Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              Loading your saved assessment data...
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Target className="h-3 w-3" />
              <span>Please wait...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#1E8449] animate-spin" />
              Generating Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900 font-medium">{loadingProgress}%</span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
            </div>
            <div className="text-sm text-gray-600">
              {loadingMessage}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Target className="h-3 w-3" />
              <span>This may take a few moments...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#1E8449]" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#1E8449] rounded-full mt-2 flex-shrink-0"></div>
                <span>All configuration options are available in the left sidebar</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#1E8449] rounded-full mt-2 flex-shrink-0"></div>
                <span>Select organization units and periods to begin</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#1E8449] rounded-full mt-2 flex-shrink-0"></div>
                <span>Click "Generate Report" to fetch data and calculate scores</span>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {(() => {
        // Apply filtering based on indicatorSourceFilter
        const filteredData = assessmentData ? assessmentData.map((pd: any) => ({
          ...pd,
          objectives: pd.objectives.map((obj: any) => ({
            ...obj,
            indicators: obj.indicators.filter((ind: any) => {
              if (indicatorSourceFilter === 'all') return true;
              const isDHIS2 = Boolean(ind.dhis2_uid);
              return indicatorSourceFilter === 'dhis2' ? isDHIS2 : !isDHIS2;
            })
          }))
        })) : null;

        return (
          <ExcelTable
            multiPeriodData={filteredData}
            selectedPeriods={selectedPeriods}
            onCellEdit={async (indicatorId: number, period: string, value: string) => {
              // Handle cell edit
              console.log('Cell edit:', indicatorId, period, value);
            }}
            onScoreChange={(indicatorId: number, score: string) => {
              // Handle score change
              console.log('Score change:', indicatorId, score);
            }}
            onBulkScoreCalculation={onBulkScoreCalculation}
            isExporting={isExporting}
          />
        );
      })()}
    </div>
  );
}
