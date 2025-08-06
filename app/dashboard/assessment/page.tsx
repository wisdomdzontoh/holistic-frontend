'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PeriodSelectionModal from '@/components/modals/period-selection-modal';
import { OrgUnitSelectionModal } from '@/components/modals/org-unit-selection-modal';
import { assessmentService, AssessmentData, AssessmentPeriod, OrgUnit, Period, DHIS2OrgUnit } from '@/lib/assessment-service';
import ExcelTable from '@/components/assessment/excel-table';
import { 
  Calendar, 
  Download, 
  Save, 
  RefreshCw, 
  FileSpreadsheet,
  FileText,
  Play,
  Settings,
  Building2,
  Target,
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronDown,
  Clock
} from 'lucide-react';

interface AssessmentState {
  loading: boolean;
  error: string | null;
  data: AssessmentData | null;
  multiPeriodData: AssessmentData[] | null;
  assessmentPeriods: AssessmentPeriod[];
  selectedPeriods: Period[];
  selectedOrgUnits: string[];
  dhis2OrgUnits: DHIS2OrgUnit[]; // Hierarchical for modal
  dhis2OrgUnitsFlat: DHIS2OrgUnit[]; // Flat list for searching
  isGenerating: boolean;
  isSyncing: boolean;
  syncProgress: {
    current: number;
    total: number;
    message: string;
  } | null;
}

export default function AssessmentPage() {
  const [state, setState] = useState<AssessmentState>({
    loading: false,
    error: null,
    data: null,
    multiPeriodData: null,
    assessmentPeriods: [],
    selectedPeriods: [],
    selectedOrgUnits: [],
    dhis2OrgUnits: [],
    dhis2OrgUnitsFlat: [],
    isGenerating: false,
    isSyncing: false,
    syncProgress: null,
  });
  
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isOrgUnitModalOpen, setIsOrgUnitModalOpen] = useState(false);

  // Load assessment data on component mount
  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Load local assessment periods and DHIS2 org units (both hierarchical and flat)
      const [localPeriods, dhis2OrgUnits, dhis2OrgUnitsFlat] = await Promise.all([
        assessmentService.getAssessmentPeriods(),
        assessmentService.getDHIS2OrgUnitHierarchy(), // Get hierarchical org units for tree view
        assessmentService.getDHIS2OrgUnits() // Get flat list for easy searching
      ]);
      
      setState(prev => ({ 
        ...prev, 
        assessmentPeriods: localPeriods || [],
        dhis2OrgUnits: dhis2OrgUnits || [],
        dhis2OrgUnitsFlat: dhis2OrgUnitsFlat || [],
        loading: false 
      }));
    } catch (error) {
      console.error('Error loading assessment data:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load assessment data',
        loading: false 
      }));
    }
  };

  const loadAssessmentReport = async () => {
    if (state.selectedPeriods.length === 0) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      // For now, use the first selected period for the report
      // In the future, this could be enhanced to show multi-period data
      const data = await assessmentService.getHolisticAssessmentData(parseInt(state.selectedPeriods[0].id));
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load assessment data',
        loading: false 
      }));
    }
  };

  const handleGenerateReport = async () => {
    if (state.selectedPeriods.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one assessment period' }));
      return;
    }

    if (state.selectedOrgUnits.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one organization unit' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null,
        syncProgress: { current: 0, total: state.selectedPeriods.length + 1, message: 'Initializing data sync...' }
      }));
      
      // Step 1: Trigger data sync for all selected periods
      const syncPromises = state.selectedPeriods.map(async (period, index) => {
        setState(prev => ({
          ...prev,
          syncProgress: { 
            current: index, 
            total: state.selectedPeriods.length + 1, 
            message: `Syncing data for ${period.displayName}...` 
          }
        }));

        try {
          return await assessmentService.triggerDataSync({
            sync_type: 'period',
            org_unit_ids: state.selectedOrgUnits,
            period_start: period.startDate,
            period_end: period.endDate,
            calculate_scores: true,
          });
        } catch (error) {
          console.error(`Failed to sync period ${period.displayName}:`, error);
          throw error;
        }
      });

      await Promise.all(syncPromises);

      setState(prev => ({
        ...prev,
        syncProgress: { 
          current: state.selectedPeriods.length, 
          total: state.selectedPeriods.length + 1, 
          message: 'Loading assessment data...' 
        }
      }));

      // Step 2: Load multi-period assessment data
      const assessmentData = await assessmentService.getMultiPeriodAssessmentData({
        org_unit_ids: state.selectedOrgUnits,
        periods: state.selectedPeriods,
        include_scores: true,
      });

      setState(prev => ({ 
        ...prev, 
        multiPeriodData: assessmentData,
        isGenerating: false,
        syncProgress: null
      }));

    } catch (error) {
      console.error('Error generating report:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate report',
        isGenerating: false,
        syncProgress: null
      }));
    }
  };

  const handleCellEdit = (indicatorId: number, period: string, value: string) => {
    // Update the multiPeriodData with the new cell value
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedData = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(objective => ({
          ...objective,
          indicators: objective.indicators.map(indicator => {
            if (indicator.id === indicatorId) {
              return {
                ...indicator,
                data_values: {
                  ...indicator.data_values,
                  [period]: {
                    value: parseFloat(value) || 0,
                    calculated_value: parseFloat(value) || 0,
                    created_at: new Date().toISOString()
                  }
                }
              };
            }
            return indicator;
          })
        }))
      })) as AssessmentData[];
      
      return { ...prev, multiPeriodData: updatedData };
    });
  };

  const handleMilestoneScoreChange = (indicatorId: number, score: string) => {
    // Update the multiPeriodData with the new score
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedData = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(objective => ({
          ...objective,
          indicators: objective.indicators.map(indicator => {
            if (indicator.id === indicatorId) {
              const numScore = parseFloat(score);
              const scoreColor = getScoreColor(numScore);
              const scoreLabel = getScoreLabel(numScore);
              
              return {
                ...indicator,
                score: {
                  ...indicator.score,
                  score: numScore,
                  score_color: scoreColor,
                  score_label: scoreLabel,
                  is_manual_override: true
                }
              };
            }
            return indicator;
          })
        }))
      })) as AssessmentData[];
      
      return { ...prev, multiPeriodData: updatedData };
    });
  };

  const getScoreLabel = (score: number) => {
    if (score >= 1) return 'Highly Performing';
    if (score >= 0) return 'Sustained';
    if (score >= -1) return 'Underperforming';
    return 'Severely Underperforming';
  };

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return '';
    if (score >= 1) return 'bg-green-100 text-green-800';
    if (score === 0) return 'bg-yellow-100 text-yellow-800';
    if (score === -1) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRowBackground = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-yellow-50';
      case 'objective': return 'bg-orange-50';
      default: return 'bg-white';
    }
  };

  const handlePeriodSelection = (periods: Period[]) => {
    setState(prev => ({ ...prev, selectedPeriods: periods }));
  };

  const handleOrgUnitSelection = (orgUnits: string[]) => {
    setState(prev => ({ ...prev, selectedOrgUnits: orgUnits }));
  };

  const handleCreateAssessmentWithPeriods = async () => {
    if (state.selectedPeriods.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one assessment period' }));
      return;
    }

    if (state.selectedOrgUnits.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one organization unit' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isSyncing: true, 
        error: null,
        syncProgress: { current: 0, total: 3, message: 'Creating assessment...' }
      }));
      
      // Step 1: Create assessment with selected periods and org units
      const assessmentResult = await assessmentService.createAssessmentWithPeriods({
        selected_periods: state.selectedPeriods,
        org_unit_ids: state.selectedOrgUnits,
        assessment_name: `Assessment - ${new Date().toLocaleDateString()}`
      });

      setState(prev => ({
        ...prev,
        syncProgress: { current: 1, total: 3, message: 'Assessment created, syncing data...' }
      }));

      // Step 2: Trigger data sync for all periods
      const syncPromises = state.selectedPeriods.map(async (period, index) => {
        setState(prev => ({
          ...prev,
          syncProgress: { 
            current: 1 + (index / state.selectedPeriods.length), 
            total: 3, 
            message: `Syncing data for ${period.displayName}...` 
          }
        }));

        return assessmentService.triggerDataSync({
          sync_type: 'period',
          org_unit_ids: state.selectedOrgUnits,
          period_start: period.startDate,
          period_end: period.endDate,
          calculate_scores: true,
        });
      });

      await Promise.all(syncPromises);

      setState(prev => ({
        ...prev,
        syncProgress: { current: 2, total: 3, message: 'Loading assessment data...' }
      }));

      // Step 3: Load multi-period assessment data
      const assessmentData = await assessmentService.getMultiPeriodAssessmentData({
        org_unit_ids: state.selectedOrgUnits,
        periods: state.selectedPeriods,
        include_scores: true,
      });

      setState(prev => ({ 
        ...prev, 
        multiPeriodData: assessmentData,
        isSyncing: false,
        syncProgress: null
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create assessment',
        isSyncing: false,
        syncProgress: null
      }));
    }
  };

  const testDHIS2Connection = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await assessmentService.testDHIS2Connection();
      console.log('DHIS2 connection test result:', result);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'DHIS2 connection test failed',
        loading: false 
      }));
    }
  };

  // Get selected periods display information
  const getSelectedPeriodsDisplay = () => {
    if (state.selectedPeriods.length === 0) return 'None';
    if (state.selectedPeriods.length === 1) return state.selectedPeriods[0].displayName;
    return `${state.selectedPeriods.length} periods selected`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">


        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{state.error}</span>
            </div>
          </div>
        )}

        {/* Progress Display */}
        {state.syncProgress && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
                <span className="text-blue-700 font-medium">{state.syncProgress.message}</span>
              </div>
              <span className="text-blue-600 text-sm">
                {state.syncProgress.current} / {state.syncProgress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(state.syncProgress.current / state.syncProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Data Dimension Configuration - Grouped Layout */}
        <div className="mb-6">
          {/* Top Action Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleCreateAssessmentWithPeriods}
                disabled={state.isSyncing || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                size="sm"
                className="text-white hover:opacity-90"
                style={{ backgroundColor: '#265380' }}
                title="Update assessment with selected periods and org units"
              >
                {state.isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Assessment...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Update
                  </>
                )}
              </Button>
              
              <div className="relative group">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  File
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      New Assessment
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Open Assessment
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Save Assessment
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Export to Excel
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Export to PDF
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Options
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Data Configuration
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Scoring Rules
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Display Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      DHIS2 Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      User Preferences
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Table Layout
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Excel (.xlsx)
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      CSV (.csv)
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      PDF Report
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Raw Data (JSON)
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Assessment Summary
                    </button>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateReport}
                disabled={state.isGenerating || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Fetch DHIS2 data and calculate scores for selected periods and org units"
              >
                {state.isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Fetching Data...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Fetch DHIS2 Data
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={loadAssessmentReport}
                disabled={state.selectedPeriods.length === 0}
                title="Reload assessment data for the selected period"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Assessment
              </Button>
            </div>
            
          </div>

          {/* Data Selection Area */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Data Selection</h3>
              <div className="text-xs text-gray-500">
                {state.loading && <span className="flex items-center"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Loading...</span>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Units */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Organization Units
                    {state.loading && <RefreshCw className="h-3 w-3 ml-2 animate-spin" />}
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsOrgUnitModalOpen(true)}
                    disabled={state.loading}
                    className="text-xs"
                  >
                    Select Units
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {state.selectedOrgUnits.length > 0 ? (
                    state.selectedOrgUnits.map((orgUnitId, index) => {
                      const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
                      return (
                        <Badge 
                          key={orgUnitId} 
                          variant="secondary" 
                          className="bg-blue-50 text-blue-700 border-blue-200 h-6 text-xs"
                        >
                          {orgUnit?.displayName || orgUnitId}
                          <button
                            onClick={() => setState(prev => ({ 
                              ...prev, 
                              selectedOrgUnits: prev.selectedOrgUnits.filter((_, i) => i !== index) 
                            }))}
                            className="ml-1 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-sm text-gray-500 italic">No organization units selected</span>
                  )}
                </div>
              </div>

              {/* Periods */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Assessment Periods
                    {state.loading && <RefreshCw className="h-3 w-3 ml-2 animate-spin" />}
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPeriodModalOpen(true)}
                    disabled={state.loading}
                    className="text-xs"
                  >
                    Select Periods
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {state.selectedPeriods.length > 0 ? (
                    state.selectedPeriods.map((period, index) => (
                      <Badge 
                        key={period.id}
                        variant="secondary" 
                        className="bg-green-50 text-green-700 border-green-200 h-6 text-xs"
                      >
                        {period.displayName}
                        <button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            selectedPeriods: prev.selectedPeriods.filter((_, i) => i !== index) 
                          }))}
                          className="ml-1 hover:text-green-800"
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No periods selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Excel-like Assessment Table */}
        <Card className="bg-white shadow-md border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-800">Assessment Report</CardTitle>
                <CardDescription className="text-gray-600">
                  Performance indicators with trend analysis and scoring
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white p-0">
            {state.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading assessment data...</span>
              </div>
            ) : state.isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <div>
                  <div>Generating assessment report...</div>
                  {state.syncProgress && (
                    <div className="text-sm text-gray-500 mt-1">
                      {state.syncProgress.message} ({state.syncProgress.current}/{state.syncProgress.total})
                    </div>
                  )}
                </div>
              </div>
            ) : state.multiPeriodData ? (
              <div className="p-4">
                <ExcelTable
                  multiPeriodData={state.multiPeriodData}
                  selectedPeriods={state.selectedPeriods}
                  onCellEdit={handleCellEdit}
                  onScoreChange={handleMilestoneScoreChange}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No assessment data available. Generate a report to view data.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
                  <PeriodSelectionModal
            isOpen={isPeriodModalOpen}
            onClose={() => setIsPeriodModalOpen(false)}
            onPeriodsSelected={handlePeriodSelection}
            selectedPeriods={state.selectedPeriods}
          />

        <OrgUnitSelectionModal
          isOpen={isOrgUnitModalOpen}
          onClose={() => setIsOrgUnitModalOpen(false)}
          onUpdate={handleOrgUnitSelection}
          selectedOrgUnits={state.selectedOrgUnits}
          dhis2OrgUnits={state.dhis2OrgUnits}
        />
      </div>
    </DashboardLayout>
  );
} 