'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { assessmentService } from '@/lib/assessment-service';


import { OrgUnitSelectionModal } from '@/components/modals/org-unit-selection-modal';
import PeriodSelectionModal from '@/components/modals/period-selection-modal';
import { OpenAssessmentModal } from '@/components/modals/open-assessment-modal';
import { SaveAssessmentModal } from '@/components/modals/save-assessment-modal';
import ExcelTable from '@/components/assessment/excel-table';
import AssessmentSidebar from '@/components/assessment/assessment-sidebar';
import AssessmentHeader from '@/components/assessment/assessment-header';
import AssessmentMainContent from '@/components/assessment/assessment-main-content';
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCalculatingScores, setIsCalculatingScores] = useState(false);
  const excelTableRef = useRef<{ triggerBulkCalculation: () => void } | null>(null);

  // Handle calculating state changes
  const handleCalculatingStateChange = useCallback((isCalculating: boolean) => {
    setIsCalculatingScores(isCalculating);
  }, []);

  // Wrapper for bulk score calculation to match AssessmentHeader interface
  const handleBulkScoreCalculationWrapper = useCallback(() => {
    if (excelTableRef.current) {
      excelTableRef.current.triggerBulkCalculation();
    }
  }, []);

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

  // Function to collect manual entries from the Excel table
  const collectManualEntries = (): Record<number, Record<string, number | null>> => {
    const manualEntries: Record<number, Record<string, number | null>> = {};
    
    if (state.assessmentData && state.assessmentData.length > 0) {
      state.assessmentData[0].objectives.forEach((objective: any) => {
        objective.indicators.forEach((indicator: any) => {
          if (indicator.data_values) {
            Object.entries(indicator.data_values).forEach(([period, dataValue]: [string, any]) => {
              // Check if this is a manual entry (has manual_override and it's not null)
              if (dataValue && dataValue.manual_override !== undefined && dataValue.manual_override !== null) {
                if (!manualEntries[indicator.id]) {
                  manualEntries[indicator.id] = {};
                }
                // Use the period as the key (this could be period name or code)
                manualEntries[indicator.id][period] = dataValue.manual_override;
              }
            });
          }
        });
      });
    }
    
    return manualEntries;
  };

    const handleExportExcel = async () => {
    if (!state.assessmentData) {
      setState(prev => ({ ...prev, error: 'No assessment data to export' }));
          return;
        }

      setIsExporting(true);
      setExportProgress('Preparing export...');

    try {
      const orgUnitNames = state.selectedOrgUnits.map(orgUnitId => {
        const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
        return orgUnit ? (orgUnit.displayName || orgUnit.name || orgUnitId) : orgUnitId;
      });

        setExportProgress('Generating Excel file...');

        // Collect manual entries from the assessment data
        const manualEntries = collectManualEntries();

      const exportResult = await assessmentService.exportHolisticExcelWithFilename({
          org_unit_ids: state.selectedOrgUnits,
        org_unit_names: orgUnitNames,
        periods: state.selectedPeriods,
        include_scores: true,
          manual_entries: manualEntries,
        pre_calculated_scores: preCalculatedScores,
      });

        setExportProgress('Preparing download...');

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

      } catch (error: any) {
      console.error('Error exporting assessment to Excel:', error);
      setState(prev => ({ ...prev, error: 'Failed to export assessment to Excel' }));
      toast.error('Failed to export Excel file. Please try again.');
      } finally {
        setIsExporting(false);
        setExportProgress('');
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
      // Recursive function to search for org unit in nested structure
      const findOrgUnitRecursively = (units: any[], targetId: string): any | undefined => {
        for (const unit of units) {
          if (unit.id === targetId) {
            return unit;
          }
          if (unit.children && unit.children.length > 0) {
            const found = findOrgUnitRecursively(unit.children, targetId);
            if (found) return found;
          }
        }
        return undefined;
      };

      const orgUnit = findOrgUnitRecursively(state.dhis2OrgUnitsFlat, id);
      
      // Debug: Log the org unit structure
      if (orgUnit) {
        console.log('Org unit found:', { id, orgUnit });
        console.log('Available properties:', Object.keys(orgUnit));
        console.log('displayName:', orgUnit.displayName);
        console.log('name:', orgUnit.name);
        console.log('display_name:', orgUnit.display_name);
      } else {
        console.log('Org unit not found for ID:', id);
        console.log('Available org units:', state.dhis2OrgUnitsFlat);
      }
      
      // Try different possible property names for the display name
      return orgUnit ? (
        orgUnit.displayName || 
        orgUnit.name || 
        orgUnit.display_name || 
        orgUnit.org_unit_name ||
        `Org Unit ${id.slice(-4)}` // Fallback: show last 4 chars of ID
      ) : `Org Unit ${id.slice(-4)}`;
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
        <AssessmentSidebar
          sidebarExpanded={state.sidebarExpanded}
          onToggleSidebar={() => setState(prev => ({ ...prev, sidebarExpanded: !prev.sidebarExpanded }))}
          selectedOrgUnits={state.selectedOrgUnits}
          selectedPeriods={state.selectedPeriods}
          dhis2OrgUnitsFlat={state.dhis2OrgUnitsFlat}
          isLoadingOrgUnits={isLoadingOrgUnits}
          isGenerating={state.isGenerating}
          isDataLoaded={state.isDataLoaded}
          isExporting={isExporting}
          exportProgress={exportProgress}
          indicatorSourceFilter={indicatorSourceFilter}
          onIndicatorSourceFilterChange={setIndicatorSourceFilter}
          onOrgUnitModalOpen={() => setIsOrgUnitModalOpen(true)}
          onPeriodModalOpen={() => setIsPeriodModalOpen(true)}
          onSaveModalOpen={() => setIsSaveModalOpen(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onOpenAssessmentModal={() => setIsOpenAssessmentModalOpen(true)}
          onGenerateReport={handleGenerateReport}
          getOrgUnitDisplayNames={getOrgUnitDisplayNames}
          getPeriodDisplayNames={getPeriodDisplayNames}
        />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Configuration Bar */}
        <AssessmentHeader
          selectedOrgUnits={state.selectedOrgUnits}
          selectedPeriods={state.selectedPeriods}
          indicatorSourceFilter={indicatorSourceFilter}
          isCalculatingScores={isCalculatingScores}
          onBulkScoreCalculation={handleBulkScoreCalculationWrapper}
        />

        {/* Main Content */}
        <AssessmentMainContent
          isLoadingSavedAssessment={isLoadingSavedAssessment}
          isGenerating={state.isGenerating}
          isDataLoaded={state.isDataLoaded}
          assessmentData={state.assessmentData}
            selectedPeriods={state.selectedPeriods}
          loadingProgress={state.loadingProgress}
          loadingMessage={state.loadingMessage}
          error={state.error}
          indicatorSourceFilter={indicatorSourceFilter}
          isExporting={isExporting}
                onBulkScoreCalculation={handleBulkScoreCalculation}
                onCalculatingStateChange={handleCalculatingStateChange}
                excelTableRef={excelTableRef}
              />
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
        dhis2OrgUnitsFlat={state.dhis2OrgUnitsFlat}
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