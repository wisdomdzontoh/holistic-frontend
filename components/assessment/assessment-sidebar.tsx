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
  FileDown
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
  onGenerateReport,
  getOrgUnitDisplayNames,
  getPeriodDisplayNames
}: AssessmentSidebarProps) {
  return (
    <div className={`no-print bg-gradient-to-br from-slate-50 via-white to-blue-50 border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl ${
      sidebarExpanded ? 'w-80' : 'w-16'
    }`}>
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
        <div className="relative flex items-center justify-between">
          {sidebarExpanded && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Assessment</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-9 w-9 p-0 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
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
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800">Configuration</span>
              </div>

              {/* Organization Units */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Organization Units</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200 font-semibold px-2 py-1">
                    {selectedOrgUnits.length} selected
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOrgUnitModalOpen}
                  disabled={isLoadingOrgUnits}
                  className="w-full justify-start text-left h-auto p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 rounded-xl group"
                >
                  {isLoadingOrgUnits ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-900">Loading...</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-900">
                          {selectedOrgUnits.length > 0 ? 'Selected Units' : 'Select Organization Units'}
                        </div>
                        {selectedOrgUnits.length > 0 && (
                          <div className="text-xs text-slate-500 truncate mt-1">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Assessment Periods</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 font-semibold px-2 py-1">
                    {selectedPeriods.length} selected
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPeriodModalOpen}
                  className="w-full justify-start text-left h-auto p-4 border-2 border-dashed border-slate-300 hover:border-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 rounded-xl group"
                >
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">
                      {selectedPeriods.length > 0 ? 'Selected Periods' : 'Select Periods'}
                    </div>
                    {selectedPeriods.length > 0 && (
                      <div className="text-xs text-slate-500 truncate mt-1">
                        {getPeriodDisplayNames().slice(0, 2).join(', ')}
                        {selectedPeriods.length > 2 && ` +${selectedPeriods.length - 2} more`}
                      </div>
                    )}
                  </div>
                </Button>
              </div>

              {/* Data Source Filter */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data Source</span>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    size="sm" 
                    variant={indicatorSourceFilter==='all'?'default':'outline'}
                    className={indicatorSourceFilter==='all'? 'bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold shadow-lg':'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-xs font-semibold'}
                    onClick={()=>onIndicatorSourceFilterChange('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm" 
                    variant={indicatorSourceFilter==='dhis2'?'default':'outline'}
                    className={indicatorSourceFilter==='dhis2'? 'bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-lg':'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-xs font-semibold'}
                    onClick={()=>onIndicatorSourceFilterChange('dhis2')}
                  >
                    DHIS2
                  </Button>
                  <Button
                    size="sm" 
                    variant={indicatorSourceFilter==='manual'?'default':'outline'}
                    className={indicatorSourceFilter==='manual'? 'bg-orange-600 text-white hover:bg-orange-700 text-xs font-semibold shadow-lg':'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-xs font-semibold'}
                    onClick={()=>onIndicatorSourceFilterChange('manual')}
                  >
                    Manual
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-slate-200" />

          {/* Action Buttons */}
          <div className="space-y-6">
            {sidebarExpanded && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-slate-800">Actions</span>
                </div>
                
                {/* Generate Report Button */}
                <Button 
                  onClick={onGenerateReport}
                  disabled={isGenerating || selectedPeriods.length === 0 || selectedOrgUnits.length === 0}
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all duration-300 h-14 text-sm font-bold rounded-xl"
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
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 h-12 rounded-xl font-semibold shadow-md hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-3" />
                  Save Assessment
                </Button>

                {/* Export Buttons */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">Export</span>
                  </div>
                  <Button 
                    onClick={onExportExcel}
                    disabled={!isDataLoaded || isGenerating}
                    variant="outline" 
                    size="sm"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 h-12 rounded-xl font-semibold shadow-md hover:shadow-lg"
                  >
                    <FileDown className="h-4 w-4 mr-3" />
                    Export Excel
                  </Button>
                  {isExporting && exportProgress && (
                    <div className="text-xs text-purple-600 text-center bg-purple-50 p-3 rounded-lg border border-purple-200">
                      {exportProgress}
                    </div>
                  )}
                  <Button 
                    onClick={onExportPDF}
                    disabled={!isDataLoaded || isGenerating}
                    variant="outline" 
                    size="sm"
                    className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 h-12 rounded-xl font-semibold shadow-md hover:shadow-lg"
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
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 h-12 rounded-xl font-semibold shadow-md hover:shadow-lg"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Open Saved
                </Button>
              </div>
            )}

            {/* Collapsed Sidebar Icons */}
            {!sidebarExpanded && (
              <div className="space-y-4">
                <Button
                  onClick={onGenerateReport}
                  disabled={isGenerating || selectedPeriods.length === 0 || selectedOrgUnits.length === 0}
                  size="sm"
                  className="w-10 h-10 p-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-xl rounded-xl transition-all duration-300"
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
                  className="w-10 h-10 p-0 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl shadow-md"
                  title="Save Assessment"
                >
                  <Save className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={onExportExcel}
                  disabled={!isDataLoaded || isGenerating}
                  variant="outline"
                  size="sm" 
                  className="w-10 h-10 p-0 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl shadow-md"
                  title="Export Excel"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={onExportPDF}
                  disabled={!isDataLoaded || isGenerating}
                  variant="outline"
                  size="sm" 
                  className="w-10 h-10 p-0 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-md"
                  title="Export PDF"
                >
                  <Printer className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={onOpenAssessmentModal}
                  variant="outline"
                  size="sm" 
                  className="w-10 h-10 p-0 border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl shadow-md"
                  title="Open Saved"
                >
                  <FileText className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
