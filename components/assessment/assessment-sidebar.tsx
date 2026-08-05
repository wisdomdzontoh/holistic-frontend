'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  Building2, 
  Calendar, 
  Settings,
  Play,
  Save,
  Download,
  Printer,
  FileText,
  ChevronRight,
  ChevronDown,
  Loader2,
  FileDown,
  Layers,
  ListChecks
} from 'lucide-react';

interface AssessmentSidebarProps {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  selectedOrgUnits: string[];
  selectedPeriods: any[];
  dhis2OrgUnitsFlat: any[];
  isLoadingOrgUnits: boolean;
  isGenerating: boolean;
  isDataLoaded: boolean;
  isExporting: boolean;
  exportProgress: string;
  indicatorSourceFilter: 'all' | 'dhis2' | 'manual';
  onIndicatorSourceFilterChange: (filter: 'all' | 'dhis2' | 'manual') => void;
  onOrgUnitModalOpen: () => void;
  onPeriodModalOpen: () => void;
  onSaveModalOpen: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenAssessmentModal: () => void;
  onBulkGenerateModalOpen: () => void;
  activeBulkJobId: number | null;
  onReopenBulkProgress: () => void;
  onGenerateReport: () => void;
  getOrgUnitDisplayNames: () => string[];
  getPeriodDisplayNames: () => string[];
}

export default function AssessmentSidebar({
  sidebarExpanded,
  onToggleSidebar,
  selectedOrgUnits,
  selectedPeriods,
  dhis2OrgUnitsFlat,
  isLoadingOrgUnits,
  isGenerating,
  isDataLoaded,
  isExporting,
  exportProgress,
  indicatorSourceFilter,
  onIndicatorSourceFilterChange,
  onOrgUnitModalOpen,
  onPeriodModalOpen,
  onSaveModalOpen,
  onExportExcel,
  onExportPDF,
  onOpenAssessmentModal,
  onBulkGenerateModalOpen,
  activeBulkJobId,
  onReopenBulkProgress,
  onGenerateReport,
  getOrgUnitDisplayNames,
  getPeriodDisplayNames
}: AssessmentSidebarProps) {
  return (
    <div className={`no-print bg-gradient-to-b from-white to-surface-muted border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm ${
      sidebarExpanded ? 'w-80' : 'w-16'
    }`}>
      {/* Sidebar Header */}
      <div className="p-5 border-b border-brand-navy-dark bg-brand-navy text-white">
        <div className="flex items-center justify-between">
          {sidebarExpanded && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-white text-lg" style={{ fontFamily: 'var(--font-display)' }}>Assessment</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            {sidebarExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 pb-8">
          {/* Configuration Section */}
          {sidebarExpanded && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-navy rounded-lg">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>Configuration</span>
              </div>

              {/* Organization Units */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Organization Units</span>
                  <Badge variant="secondary" className="text-xs bg-brand-navy/10 text-brand-navy border-brand-navy/20 font-medium px-2 py-0.5">
                    {selectedOrgUnits.length} selected
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOrgUnitModalOpen}
                  disabled={isLoadingOrgUnits}
                  className="w-full justify-start text-left h-auto p-4 border border-gray-200 hover:border-brand-navy/40 hover:bg-brand-navy/5 transition-colors duration-200 rounded-xl group"
                >
                  {isLoadingOrgUnits ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin text-brand-navy" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-ink">Loading...</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-brand-navy rounded-lg mr-3">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-ink">
                          {selectedOrgUnits.length > 0 ? 'Selected Units' : 'Select Organization Units'}
                        </div>
                        {selectedOrgUnits.length > 0 && (
                          <div className="text-xs text-ink-muted truncate mt-1">
                            {getOrgUnitDisplayNames().slice(0, 2).join(', ')}
                            {selectedOrgUnits.length > 2 && ` +${selectedOrgUnits.length - 2} more`}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </Button>
              </div>

              {/* Assessment Periods */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Assessment Periods</span>
                  <Badge variant="secondary" className="text-xs bg-brand-teal/10 text-brand-teal border-brand-teal/20 font-medium px-2 py-0.5">
                    {selectedPeriods.length} selected
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPeriodModalOpen}
                  className="w-full justify-start text-left h-auto p-4 border border-gray-200 hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors duration-200 rounded-xl group"
                >
                  <div className="p-2 bg-brand-teal rounded-lg mr-3">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-ink">
                      {selectedPeriods.length > 0 ? 'Selected Periods' : 'Select Periods'}
                    </div>
                    {selectedPeriods.length > 0 && (
                      <div className="text-xs text-ink-muted truncate mt-1">
                        {getPeriodDisplayNames().slice(0, 2).join(', ')}
                        {selectedPeriods.length > 2 && ` +${selectedPeriods.length - 2} more`}
                      </div>
                    )}
                  </div>
                </Button>
              </div>

              {/* Data Source Filter */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Data Source</span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={indicatorSourceFilter==='all'?'default':'outline'}
                    className={indicatorSourceFilter==='all'? 'bg-brand-navy text-white hover:bg-brand-navy-dark text-xs font-medium':'border-gray-200 text-ink-muted hover:bg-gray-50 hover:border-gray-300 text-xs font-medium'}
                    onClick={()=>onIndicatorSourceFilterChange('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={indicatorSourceFilter==='dhis2'?'default':'outline'}
                    className={indicatorSourceFilter==='dhis2'? 'bg-brand-green text-white hover:bg-brand-green-dark text-xs font-medium':'border-gray-200 text-ink-muted hover:bg-gray-50 hover:border-gray-300 text-xs font-medium'}
                    onClick={()=>onIndicatorSourceFilterChange('dhis2')}
                  >
                    DHIS2
                  </Button>
                  <Button
                    size="sm"
                    variant={indicatorSourceFilter==='manual'?'default':'outline'}
                    className={indicatorSourceFilter==='manual'? 'bg-accent-gold text-white hover:bg-accent-gold/90 text-xs font-medium':'border-gray-200 text-ink-muted hover:bg-gray-50 hover:border-gray-300 text-xs font-medium'}
                    onClick={()=>onIndicatorSourceFilterChange('manual')}
                  >
                    Manual
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-gray-200" />

          {/* Action Buttons */}
          <div className="space-y-6">
            {sidebarExpanded && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-green rounded-lg">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>Actions</span>
                </div>

                {/* Generate Report Button */}
                <Button
                  onClick={onGenerateReport}
                  disabled={isGenerating || selectedPeriods.length === 0 || selectedOrgUnits.length === 0}
                  size="sm"
                  className="w-full bg-brand-green text-white hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 h-14 text-sm font-semibold rounded-xl"
                  title="Fetch DHIS2 data and calculate scores for selected periods and org units"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-3" />
                      Generate Report
                    </>
                  )}
                </Button>

                {/* Save Assessment Button */}
                <Button
                  onClick={onSaveModalOpen}
                  disabled={!isDataLoaded || isGenerating}
                  variant="outline"
                  size="sm"
                  className="w-full bg-brand-teal/5 border-brand-teal/30 text-brand-teal hover:bg-brand-teal/10 hover:border-brand-teal/40 transition-colors duration-200 h-12 rounded-xl font-medium"
                >
                  <Save className="h-4 w-4 mr-3" />
                  Save Assessment
                </Button>

                {/* Export Buttons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-navy rounded-lg">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>Export</span>
                  </div>
                  <Button
                    onClick={onExportExcel}
                    disabled={!isDataLoaded || isGenerating}
                    variant="outline"
                    size="sm"
                    className="w-full border-brand-navy/25 text-brand-navy hover:bg-brand-navy/5 hover:border-brand-navy/40 transition-colors duration-200 h-12 rounded-xl font-medium"
                  >
                    <FileDown className="h-4 w-4 mr-3" />
                    Export Excel
                  </Button>
                  {isExporting && exportProgress && (
                    <div className="text-xs text-brand-navy text-center bg-brand-navy/5 p-3 rounded-lg border border-brand-navy/15">
                      {exportProgress}
                    </div>
                  )}
                  <Button
                    onClick={onExportPDF}
                    disabled={!isDataLoaded || isGenerating}
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-200 text-ink-muted hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 h-12 rounded-xl font-medium"
                  >
                    <Printer className="h-4 w-4 mr-3" />
                    Export PDF
                  </Button>
                </div>

                {/* Open Saved Assessment Button */}
                <Button
                  onClick={onOpenAssessmentModal}
                  variant="outline"
                  size="sm"
                  className="w-full border-brand-green/25 text-brand-green hover:bg-brand-green/5 hover:border-brand-green/40 transition-colors duration-200 h-12 rounded-xl font-medium"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Open Saved
                </Button>

                {/* Bulk Generate Button */}
                <Button
                  onClick={onBulkGenerateModalOpen}
                  variant="outline"
                  size="sm"
                  className="w-full border-brand-navy/25 text-brand-navy hover:bg-brand-navy/5 hover:border-brand-navy/40 transition-colors duration-200 h-12 rounded-xl font-medium"
                >
                  <Layers className="h-4 w-4 mr-3" />
                  Bulk Generate
                </Button>

                {/* Reopen bulk progress - only visible once a bulk job has been started */}
                {activeBulkJobId != null && (
                  <Button
                    onClick={onReopenBulkProgress}
                    variant="outline"
                    size="sm"
                    className="w-full border-brand-teal/25 text-brand-teal hover:bg-brand-teal/5 hover:border-brand-teal/40 transition-colors duration-200 h-12 rounded-xl font-medium"
                  >
                    <ListChecks className="h-4 w-4 mr-3" />
                    View Bulk Progress
                  </Button>
                )}
              </div>
            )}

            {/* Collapsed Sidebar Icons */}
            {!sidebarExpanded && (
              <div className="space-y-3">
                <Button
                  onClick={onGenerateReport}
                  disabled={isGenerating || selectedPeriods.length === 0 || selectedOrgUnits.length === 0}
                  size="sm"
                  className="w-10 h-10 p-0 bg-brand-green text-white hover:bg-brand-green-dark shadow-sm rounded-xl transition-colors duration-200"
                  title="Generate Report"
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  onClick={onSaveModalOpen}
                  disabled={!isDataLoaded || isGenerating}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 bg-brand-teal/5 border-brand-teal/30 text-brand-teal hover:bg-brand-teal/10 rounded-xl shadow-sm"
                  title="Save Assessment"
                >
                  <Save className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onExportExcel}
                  disabled={!isDataLoaded || isGenerating}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 border-brand-navy/25 text-brand-navy hover:bg-brand-navy/5 rounded-xl shadow-sm"
                  title="Export Excel"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onExportPDF}
                  disabled={!isDataLoaded || isGenerating}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 border-gray-200 text-ink-muted hover:bg-gray-50 rounded-xl shadow-sm"
                  title="Export PDF"
                >
                  <Printer className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onOpenAssessmentModal}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 border-brand-green/25 text-brand-green hover:bg-brand-green/5 rounded-xl shadow-sm"
                  title="Open Saved"
                >
                  <FileText className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onBulkGenerateModalOpen}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 p-0 border-brand-navy/25 text-brand-navy hover:bg-brand-navy/5 rounded-xl shadow-sm"
                  title="Bulk Generate"
                >
                  <Layers className="h-5 w-5" />
                </Button>
                {activeBulkJobId != null && (
                  <Button
                    onClick={onReopenBulkProgress}
                    variant="outline"
                    size="sm"
                    className="w-10 h-10 p-0 border-brand-teal/25 text-brand-teal hover:bg-brand-teal/5 rounded-xl shadow-sm"
                    title="View Bulk Progress"
                  >
                    <ListChecks className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
