'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Database,
  Calendar,
  Building2,
  Calculator,
  Loader2
} from 'lucide-react';

interface AssessmentHeaderProps {
  selectedOrgUnits: string[];
  selectedPeriods: any[];
  indicatorSourceFilter: 'all' | 'dhis2' | 'manual';
  isCalculatingScores?: boolean;
  onBulkScoreCalculation?: () => void;
}

export default function AssessmentHeader({
  selectedOrgUnits,
  selectedPeriods,
  indicatorSourceFilter,
  isCalculatingScores = false,
  onBulkScoreCalculation
}: AssessmentHeaderProps) {
  return (
    <div className="no-print bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Columns:</span>
              <Badge variant="outline" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Data
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Rows:</span>
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Period {selectedPeriods.length > 0 ? selectedPeriods.length : '0'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Org Unit {selectedOrgUnits.length > 0 ? selectedOrgUnits.length : '0'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {onBulkScoreCalculation && (
              <button
                onClick={onBulkScoreCalculation}
                disabled={isCalculatingScores}
                className="px-4 py-2 bg-gradient-to-r from-[#1E8449] to-[#27AE60] text-white rounded-md hover:from-[#27AE60] hover:to-[#2ECC71] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
              >
                {isCalculatingScores ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Calculate Scores</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
