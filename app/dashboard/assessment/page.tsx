'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { assessmentService } from '@/lib/assessment-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  Building2, 
  Calendar, 
  FileText,
  Download, 
  Play,
  Settings,
  Database,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  FileText as FileTextIcon,
  Printer,
  Save
} from 'lucide-react';
import { OrgUnitSelectionModal } from '@/components/modals/org-unit-selection-modal';
import PeriodSelectionModal from '@/components/modals/period-selection-modal';
import { OpenAssessmentModal } from '@/components/modals/open-assessment-modal';
import { SaveAssessmentModal } from '@/components/modals/save-assessment-modal';
import ExcelTable from '@/components/assessment/excel-table';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { toast } from 'sonner';

interface State {
  selectedOrgUnits: string[];
  selectedPeriods: any[];
  dhis2OrgUnitsFlat: any[];
  isGenerating: boolean;
  isDataLoaded: boolean;
  assessmentData: any;
  configExpanded: boolean;
  sidebarExpanded: boolean;
  loadingProgress: number;
  loadingMessage: string;
  error: string | null;
}

export default function AssessmentPage() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({
    selectedOrgUnits: [],
    selectedPeriods: [],
    dhis2OrgUnitsFlat: [],
    isGenerating: false,
    isDataLoaded: false,
    assessmentData: null,
    configExpanded: true,
    sidebarExpanded: true,
    loadingProgress: 0,
    loadingMessage: '',
    error: null
  });

  const [indicatorSourceFilter, setIndicatorSourceFilter] = useState<'all' | 'dhis2' | 'manual'>('all');
  const [manualEntriesData, setManualEntriesData] = useState<Record<number, Record<string, number | null>>>({});
  const [preCalculatedScores, setPreCalculatedScores] = useState<Record<number, any>>({});
  const [isOrgUnitModalOpen, setIsOrgUnitModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isOpenAssessmentModalOpen, setIsOpenAssessmentModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSavedAssessment, setIsLoadingSavedAssessment] = useState(false);
  const [isLoadingOrgUnits, setIsLoadingOrgUnits] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [currentAssessmentName, setCurrentAssessmentName] = useState<string | null>(null);

  // Fetch org units on component mount
  useEffect(() => {
    const fetchOrgUnits = async () => {
      setIsLoadingOrgUnits(true);
      try {
        const orgUnits = await assessmentService.getOrgUnits();
        setState(prev => ({ ...prev, dhis2OrgUnitsFlat: orgUnits }));
      } catch (error) {
        console.error('Error fetching org units:', error);
        setState(prev => ({ ...prev, error: 'Failed to fetch organization units' }));
        toast.error('Failed to fetch organization units. Please refresh the page.');
      } finally {
        setIsLoadingOrgUnits(false);
      }
    };

    if (user) {
      fetchOrgUnits();
    }
  }, [user]);

  const handleGenerateReport = useCallback(async () => {
    if (state.selectedOrgUnits.length === 0 || state.selectedPeriods.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one organization unit and period' }));
      return;
    }

      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
      loadingProgress: 0,
      loadingMessage: 'Initializing assessment...',
      error: null 
        }));

        try {
      // Extract org unit names for the backend
      const orgUnitNames = state.selectedOrgUnits.map(orgUnitId => {
        const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
        return orgUnit ? (orgUnit.displayName || orgUnit.name || orgUnitId) : orgUnitId;
      });

      setState(prev => ({
        ...prev,
        loadingProgress: 20,
        loadingMessage: 'Fetching DHIS2 data...' 
      }));

      const data = await assessmentService.getMultiPeriodAssessmentData({
        org_unit_ids: state.selectedOrgUnits,
        org_unit_names: orgUnitNames,
        periods: state.selectedPeriods,
        include_scores: true,
      });

      setState(prev => ({ 
        ...prev, 
        loadingProgress: 100,
        loadingMessage: 'Assessment completed successfully!' 
      }));

      setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
          assessmentData: data, 
          isDataLoaded: true, 
        isGenerating: false,
          loadingProgress: 0,
          loadingMessage: ''
        }));
        toast.success('Assessment report generated successfully!');
      }, 500);

      } catch (error) {
      console.error('Error generating report:', error);
          setState(prev => ({ 
            ...prev, 
        isGenerating: false, 
        error: 'Failed to generate assessment report',
        loadingProgress: 0,
        loadingMessage: ''
      }));
          toast.error('Failed to generate assessment report. Please try again.');
    }
  }, [state.selectedOrgUnits, state.selectedPeriods, state.dhis2OrgUnitsFlat, manualEntriesData, preCalculatedScores]);

    const handleExportExcel = async () => {
    if (!state.assessmentData) {
      setState(prev => ({ ...prev, error: 'No assessment data to export' }));
      return;
    }

    try {
      const orgUnitNames = state.selectedOrgUnits.map(orgUnitId => {
        const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
        return orgUnit ? (orgUnit.displayName || orgUnit.name || orgUnitId) : orgUnitId;
      });

      const exportResult = await assessmentService.exportHolisticExcelWithFilename({
          org_unit_ids: state.selectedOrgUnits,
        org_unit_names: orgUnitNames,
        periods: state.selectedPeriods,
        include_scores: true,
        manual_entries: manualEntriesData,
        pre_calculated_scores: preCalculatedScores,
      });

      // Create download link with the correct filename from backend
      const url = window.URL.createObjectURL(exportResult.blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', exportResult.filename || `holistic-assessment-${new Date().toISOString().slice(0, 10)}.xlsx`);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel file exported successfully!');

    } catch (error) {
      console.error('Error exporting assessment to Excel:', error);
      setState(prev => ({ ...prev, error: 'Failed to export assessment to Excel' }));
      toast.error('Failed to export Excel file. Please try again.');
    }
  };

  const handleExportPDF = () => {
    if (!state.assessmentData) {
      setState(prev => ({ ...prev, error: 'No assessment data to export' }));
      toast.error('No assessment data to export');
      return;
    }

    // Trigger print functionality
    window.print();
    toast.success('PDF export initiated! Check your print dialog.');
  };

  const handleBulkScoreCalculation = async (manualEntries: Record<number, Record<string, number | null>>) => {
    try {
      const orgUnitNames = state.selectedOrgUnits.map(orgUnitId => {
        const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
        return orgUnit ? (orgUnit.displayName || orgUnit.display_name || orgUnit.name || orgUnit.id) : orgUnitId;
      });

      // Call the backend to calculate scores for manual entries
      const updatedData = await assessmentService.getMultiPeriodAssessmentData({
        org_unit_ids: state.selectedOrgUnits,
        org_unit_names: orgUnitNames,
        periods: state.selectedPeriods,
        include_scores: true,
        manual_entries: manualEntries,
      });

      // Update the assessment data with new scores
      setState(prev => ({
        ...prev,
        assessmentData: updatedData 
      }));
      
      toast.success('Scores calculated successfully for manual entries!');
      
    } catch (error) {
      console.error('Error calculating scores:', error);
      setState(prev => ({ ...prev, error: 'Failed to calculate scores for manual entries' }));
      toast.error('Failed to calculate scores for manual entries. Please try again.');
    }
  };

  const handleSaveAssessment = async (name: string, isUpdate: boolean, assessmentId?: string) => {
    if (!state.assessmentData) {
      setState(prev => ({ ...prev, error: 'No assessment data to save' }));
      return;
    }

    setIsSaving(true);
    try {
      const orgUnitNames = state.selectedOrgUnits.map(orgUnitId => {
        const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
        return orgUnit ? (orgUnit.displayName || orgUnit.display_name || orgUnit.name || orgUnit.id) : orgUnitId;
      });

      // Convert assessment data from list to dictionary format expected by backend
      let indicatorDataDict: Record<string, any> = {};
      
      if (Array.isArray(state.assessmentData)) {
        // If it's a list, convert to dictionary
        state.assessmentData.forEach((periodData, index) => {
          if (periodData.objectives) {
            periodData.objectives.forEach((objective: any) => {
              if (objective.indicators) {
                objective.indicators.forEach((indicator: any) => {
                  indicatorDataDict[indicator.id] = {
                    ...indicator,
                    objective_id: objective.id,
                    objective_name: objective.name
                  };
                });
              }
            });
          }
        });
      } else {
        // If it's already a dictionary, use it as is
        indicatorDataDict = state.assessmentData;
      }

      if (isUpdate && assessmentId) {
        // Update existing assessment
        await assessmentService.updateAssessment({
          assessment_id: assessmentId,
          name: name,
          org_unit_id: state.selectedOrgUnits[0],
          org_unit_name: orgUnitNames[0] || state.selectedOrgUnits[0],
          periods: state.selectedPeriods.map(p => p.name),
          indicator_data: indicatorDataDict,
          calculated_scores: preCalculatedScores,
          metadata: {
            org_unit_ids: state.selectedOrgUnits,
            org_unit_names: orgUnitNames,
            manual_entries: manualEntriesData,
          }
        });
        toast.success('Assessment updated successfully!');
      } else {
        // Save new assessment
        await assessmentService.saveAssessment({
          name: name,
          org_unit_id: state.selectedOrgUnits[0],
          org_unit_name: orgUnitNames[0] || state.selectedOrgUnits[0],
          periods: state.selectedPeriods.map(p => p.name),
          indicator_data: indicatorDataDict,
          calculated_scores: preCalculatedScores,
          metadata: {
            org_unit_ids: state.selectedOrgUnits,
            org_unit_names: orgUnitNames,
            manual_entries: manualEntriesData,
          }
        });
        toast.success('Assessment saved successfully!');
      }

      setState(prev => ({ ...prev, error: null }));
      console.log('Assessment saved successfully');
      
    } catch (error) {
      console.error('Error saving assessment:', error);
      setState(prev => ({ ...prev, error: 'Failed to save assessment' }));
      toast.error('Failed to save assessment. Please try again.');
      throw error; // Re-throw to let the modal handle it
    } finally {
      setIsSaving(false);
    }
  };

  const getOrgUnitDisplayNames = () => {
    return state.selectedOrgUnits.map(id => {
      const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === id);
      // Debug: Log the org unit structure
      if (orgUnit) {
        console.log('Org unit structure:', orgUnit);
      }
      // Try different possible property names for the display name
      return orgUnit ? (
        orgUnit.displayName || 
        orgUnit.display_name || 
        orgUnit.name || 
        orgUnit.id
      ) : id;
    });
  };

  const getPeriodDisplayNames = () => {
    return state.selectedPeriods.map(period => period.displayName || period.name);
  };

  const handleOpenAssessment = async (assessmentId: string) => {
    setIsLoadingSavedAssessment(true);
    setState(prev => ({ ...prev, error: null }));
    
    try {
      // Fetch the saved assessment data
      const response = await assessmentService.loadAssessment({ assessment_id: assessmentId });
      
      // The response structure has the assessment data nested under assessment.assessment
      const savedAssessment = response.assessment || response;
      
      // Extract the data from the saved assessment
      const indicatorData = savedAssessment.indicator_data;
      const metadata = savedAssessment.metadata || {};
      
      // Convert dictionary format back to list format expected by Excel table
      let assessmentDataList: any[] = [];
      
      if (indicatorData && typeof indicatorData === 'object') {
        // Group indicators by objective
        const objectivesMap: Record<string, any> = {};
        
        Object.values(indicatorData).forEach((indicator: any) => {
          const objectiveId = indicator.objective_id || indicator.objectiveId;
          const objectiveName = indicator.objective_name || indicator.objectiveName;
          
          if (!objectivesMap[objectiveId]) {
            objectivesMap[objectiveId] = {
              id: objectiveId,
              name: objectiveName,
              indicators: []
            };
          }
          
          objectivesMap[objectiveId].indicators.push(indicator);
        });
        
        // Convert to the format expected by Excel table
        assessmentDataList = [{
          objectives: Object.values(objectivesMap)
        }];
      }
      
      // Update state with the loaded assessment data
      setState(prev => ({
        ...prev,
        assessmentData: assessmentDataList,
        selectedOrgUnits: metadata.org_unit_ids || [],
        selectedPeriods: savedAssessment.periods?.map((periodName: string) => ({
          name: periodName,
          displayName: periodName,
          code: periodName
        })) || [],
        isDataLoaded: true,
        isGenerating: false,
        loadingProgress: 0,
        loadingMessage: '',
        error: null
      }));

      // Update manual entries and pre-calculated scores if available
      if (metadata.manual_entries) {
        setManualEntriesData(metadata.manual_entries);
      }
      if (savedAssessment.calculated_scores) {
        setPreCalculatedScores(savedAssessment.calculated_scores);
      }

      // Set current assessment info for save/update functionality
      setCurrentAssessmentId(savedAssessment.id);
      setCurrentAssessmentName(savedAssessment.name);

      toast.success(`Assessment "${savedAssessment.name}" loaded successfully!`);
      console.log('Assessment loaded successfully:', savedAssessment.name);
      
    } catch (error) {
      console.error('Error loading saved assessment:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load saved assessment. Please try again.' 
      }));
      toast.error('Failed to load saved assessment. Please try again.');
    } finally {
      setIsLoadingSavedAssessment(false);
      setIsOpenAssessmentModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Dashboard Header */}
      <div className="no-print">
        <DashboardHeader user={user} />
      </div>
      
      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Configuration Panel */}
        <div className={`no-print bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          state.sidebarExpanded ? 'w-80' : 'w-16'
        }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {state.sidebarExpanded && (
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#1E8449]" />
              <span className="font-semibold text-gray-900">Assessment Config</span>
          </div>
        )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, sidebarExpanded: !prev.sidebarExpanded }))}
            className="h-8 w-8 p-0"
          >
            {state.sidebarExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sidebar Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 pb-6">
            {/* Configuration Section */}
            {state.sidebarExpanded && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Configuration</span>
              </div>

                {/* Organization Units */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Organization Units</span>
                    <Badge variant="secondary" className="text-xs">
                      {state.selectedOrgUnits.length} selected
                    </Badge>
            </div>
                                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOrgUnitModalOpen(true)}
                    disabled={isLoadingOrgUnits}
                    className="w-full justify-start text-left h-auto p-3"
                  >
                    {isLoadingOrgUnits ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#1E8449]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">Loading...</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-2 text-[#1E8449]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {state.selectedOrgUnits.length > 0 ? 'Selected Units' : 'Select Organization Units'}
                          </div>
                          {state.selectedOrgUnits.length > 0 && (
                            <div className="text-xs text-gray-500 truncate">
                              {getOrgUnitDisplayNames().slice(0, 2).join(', ')}
                              {state.selectedOrgUnits.length > 2 && ` +${state.selectedOrgUnits.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                    </div>

                {/* Periods */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Periods</span>
                    <Badge variant="secondary" className="text-xs">
                      {state.selectedPeriods.length} selected
                </Badge>
                    </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPeriodModalOpen(true)}
                    className="w-full justify-start text-left h-auto p-3"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-[#1E8449]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {state.selectedPeriods.length > 0 ? 'Selected Periods' : 'Select Periods'}
                      </div>
                      {state.selectedPeriods.length > 0 && (
                        <div className="text-xs text-gray-500 truncate">
                          {getPeriodDisplayNames().slice(0, 2).join(', ')}
                          {state.selectedPeriods.length > 2 && ` +${state.selectedPeriods.length - 2} more`}
                  </div>
                )}
                    </div>
                  </Button>
              </div>

                {/* Indicator Source Filter */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Data Source</span>
                  <div className="flex gap-1">
                  <Button 
                    size="sm"
                      variant={indicatorSourceFilter==='all'?'default':'outline'}
                      className={indicatorSourceFilter==='all'? 'bg-[#1E8449] text-white hover:bg-[#1E8449]/90 text-xs':'border-gray-300 text-gray-700 hover:bg-gray-50 text-xs'}
                      onClick={()=>setIndicatorSourceFilter('all')}
                    >
                      All
                  </Button>
                    <Button
                      size="sm" 
                      variant={indicatorSourceFilter==='dhis2'?'default':'outline'}
                      className={indicatorSourceFilter==='dhis2'? 'bg-blue-900 text-white hover:bg-blue-800 text-xs':'border-gray-300 text-gray-700 hover:bg-gray-50 text-xs'}
                      onClick={()=>setIndicatorSourceFilter('dhis2')}
                    >
                      DHIS2
                    </Button>
                    <Button
                      size="sm" 
                      variant={indicatorSourceFilter==='manual'?'default':'outline'}
                      className={indicatorSourceFilter==='manual'? 'bg-[#C0392B] text-white hover:bg-[#C0392B]/90 text-xs':'border-gray-300 text-gray-700 hover:bg-gray-50 text-xs'}
                      onClick={()=>setIndicatorSourceFilter('manual')}
                    >
                      Manual
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {state.sidebarExpanded && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</span>
                
                {/* Generate Report Button */}
                <Button 
                  onClick={handleGenerateReport}
                  disabled={state.isGenerating || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                  size="sm"
                    className="w-full bg-[#1E8449] text-white hover:bg-[#1E8449]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Fetch DHIS2 data and calculate scores for selected periods and org units"
                >
                  {state.isGenerating ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                    </>
                  ) : (
                    <>
                        <Play className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>

                {/* Save Assessment Button */}
                <Button 
                  onClick={() => setIsSaveModalOpen(true)}
                  disabled={!state.isDataLoaded || state.isGenerating}
                  variant="outline" 
                  size="sm"
                  className="w-full bg-[#1E8449]/10 border-[#1E8449]/20 text-[#1E8449] hover:bg-[#1E8449]/20"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Assessment
                </Button>

                                    {/* Export Buttons */}
                  <div className="space-y-2">
                <Button 
                      onClick={handleExportExcel}
                      disabled={!state.isDataLoaded || state.isGenerating}
                  variant="outline" 
                  size="sm"
                      className="w-full"
                >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Excel
                </Button>
                <Button 
                      onClick={handleExportPDF}
                      disabled={!state.isDataLoaded || state.isGenerating}
                  variant="outline" 
                  size="sm"
                      className="w-full"
                >
                      <Printer className="h-4 w-4 mr-2" />
                      Export PDF
                </Button>
              </div>
              
                  {/* Open Saved Assessment Button */}
                <Button
                    onClick={() => setIsOpenAssessmentModalOpen(true)}
                  variant="outline"
                  size="sm"
                    className="w-full"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Open Saved
                </Button>
                      </div>
              )}

              {/* Collapsed Sidebar Icons */}
              {!state.sidebarExpanded && (
                    <div className="space-y-2">
                <Button
                    onClick={handleGenerateReport}
                    disabled={state.isGenerating || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                  size="sm"
                    className="w-8 h-8 p-0 bg-[#1E8449] text-white hover:bg-[#1E8449]/90"
                    title="Generate Report"
                  >
                    {state.isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => setIsSaveModalOpen(true)}
                    disabled={!state.isDataLoaded || state.isGenerating}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 bg-[#1E8449]/10 border-[#1E8449]/20 text-[#1E8449]"
                    title="Save Assessment"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                      <Button 
                    onClick={handleExportExcel}
                    disabled={!state.isDataLoaded || state.isGenerating}
                    variant="outline"
                        size="sm" 
                    className="w-8 h-8 p-0"
                    title="Export Excel"
                      >
                    <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      <Button 
                    onClick={handleExportPDF}
                    disabled={!state.isDataLoaded || state.isGenerating}
                    variant="outline"
                        size="sm" 
                    className="w-8 h-8 p-0"
                    title="Export PDF"
                      >
                    <Printer className="h-4 w-4" />
                      </Button>
                      <Button 
                    onClick={() => setIsOpenAssessmentModalOpen(true)}
                    variant="outline"
                        size="sm" 
                    className="w-8 h-8 p-0"
                    title="Open Saved"
                      >
                    <FileText className="h-4 w-4" />
                      </Button>
              </div>
                  )}
            </div>
          </div>
        </ScrollArea>
        </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Configuration Bar */}
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
                  Period {state.selectedPeriods.length > 0 ? state.selectedPeriods.length : '0'}
                </Badge>
                </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Org Unit {state.selectedOrgUnits.length > 0 ? state.selectedOrgUnits.length : '0'}
                </Badge>
                    </div>
                </div>
            <div className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Assessment Results</span>
              </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isLoadingSavedAssessment ? (
            /* Loading Saved Assessment State */
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
                    <Clock className="h-3 w-3" />
                    <span>Please wait...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : state.isGenerating ? (
            /* Loading State */
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
                      <span className="text-gray-900 font-medium">{state.loadingProgress}%</span>
                  </div>
                    <Progress value={state.loadingProgress} className="h-2" />
              </div>
                  <div className="text-sm text-gray-600">
                    {state.loadingMessage}
                    </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>This may take a few moments...</span>
                </div>
                </CardContent>
              </Card>
              </div>
          ) : !state.isDataLoaded ? (
            /* Getting Started State */
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
                  {state.error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">{state.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
          ) : (
            /* Assessment Data Display */
            <div className="h-full overflow-auto">
              <ExcelTable
                multiPeriodData={state.assessmentData}
            selectedPeriods={state.selectedPeriods}
                onCellEdit={async (indicatorId: number, period: string, value: string) => {
                  // Handle cell edit
                  console.log('Cell edit:', indicatorId, period, value);
                }}
                onScoreChange={(indicatorId: number, score: string) => {
                  // Handle score change
                  console.log('Score change:', indicatorId, score);
                }}
                onBulkScoreCalculation={handleBulkScoreCalculation}
              />
            </div>
            )}
          </div>
        </div>
        </div>

        {/* Modals */}
        <div className="no-print">
        <OrgUnitSelectionModal
          isOpen={isOrgUnitModalOpen}
          onClose={() => setIsOrgUnitModalOpen(false)}
          selectedOrgUnits={state.selectedOrgUnits}
        onUpdate={(orgUnits: string[]) => {
          setState(prev => ({ ...prev, selectedOrgUnits: orgUnits }));
          setIsOrgUnitModalOpen(false);
        }}
        dhis2OrgUnits={state.dhis2OrgUnitsFlat}
      />

      <PeriodSelectionModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        selectedPeriods={state.selectedPeriods}
        onPeriodsSelected={(periods) => {
          setState(prev => ({ ...prev, selectedPeriods: periods }));
          setIsPeriodModalOpen(false);
        }}
        maxPeriods={10}
      />

      <OpenAssessmentModal
        isOpen={isOpenAssessmentModalOpen}
        onClose={() => setIsOpenAssessmentModalOpen(false)}
        onOpenAssessment={handleOpenAssessment}
      />

      <SaveAssessmentModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveAssessment}
        existingAssessmentId={currentAssessmentId || undefined}
        existingAssessmentName={currentAssessmentName || undefined}
        isSaving={isSaving}
      />
              </div>
              </div>
  );
} 