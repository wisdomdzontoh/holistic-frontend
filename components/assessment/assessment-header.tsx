'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Database,
  Calendar,
  Building2,
  ChevronRight
} from 'lucide-react';

interface AssessmentHeaderProps {
  selectedOrgUnits: string[];
  selectedPeriods: any[];
  indicatorSourceFilter: 'all' | 'dhis2' | 'manual';
}

export default function AssessmentHeader({
  selectedOrgUnits,
  selectedPeriods,
  indicatorSourceFilter
}: AssessmentHeaderProps) {
  return (
    <div className="no-print bg-white border-b border-gray-200 p-4">
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
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Assessment Results</span>
        </div>
      </div>
    </div>
  );
}
