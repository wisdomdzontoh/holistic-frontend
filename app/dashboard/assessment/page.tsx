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
  Plus
} from 'lucide-react';

interface AssessmentState {
  loading: boolean;
  error: string | null;
  data: AssessmentData | null;
  assessmentPeriods: AssessmentPeriod[];
  selectedPeriods: Period[];
  selectedOrgUnits: string[];
  dhis2OrgUnits: DHIS2OrgUnit[];
  isGenerating: boolean;
  isSyncing: boolean;
}

export default function AssessmentPage() {
  const [state, setState] = useState<AssessmentState>({
    loading: false,
    error: null,
    data: null,
    assessmentPeriods: [],
    selectedPeriods: [],
    selectedOrgUnits: [],
    dhis2OrgUnits: [],
    isGenerating: false,
    isSyncing: false,
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
      
      // Load local assessment periods and DHIS2 org units with hierarchy
      const [localPeriods, dhis2OrgUnits] = await Promise.all([
        assessmentService.getAssessmentPeriods(),
        assessmentService.getDHIS2OrgUnitHierarchy() // Get hierarchical org units for tree view
      ]);
      
      setState(prev => ({ 
        ...prev, 
        assessmentPeriods: localPeriods || [],
        dhis2OrgUnits: dhis2OrgUnits || [],
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
      setState(prev => ({ ...prev, isGenerating: true, error: null }));
      
      // Trigger data sync
      await assessmentService.triggerDataSync({
        sync_type: 'full',
        org_unit_ids: state.selectedOrgUnits,
        calculate_scores: true,
      });
      
      // Load assessment data
      await loadAssessmentReport();
      
      setState(prev => ({ ...prev, isGenerating: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate report',
        isGenerating: false 
      }));
    }
  };

  const handleCellEdit = (indicatorId: number, period: string, value: string) => {
    // This would be implemented to update indicator data values
    console.log('Cell edit:', { indicatorId, period, value });
  };

  const handleMilestoneScoreChange = (indicatorId: number, score: string) => {
    // This would be implemented to update milestone scores
    console.log('Milestone score change:', { indicatorId, score });
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
      setState(prev => ({ ...prev, isSyncing: true, error: null }));
      
      // Create assessment with selected periods and org units
      await assessmentService.createAssessmentWithPeriods({
        selected_periods: state.selectedPeriods,
        org_unit_ids: state.selectedOrgUnits,
        assessment_name: `Assessment - ${new Date().toLocaleDateString()}`
      });
      
      // Trigger data sync and score calculation
      await assessmentService.triggerDataSync({
        sync_type: 'full',
        org_unit_ids: state.selectedOrgUnits,
        calculate_scores: true,
      });
      
      // Load assessment data
      await loadAssessmentReport();
      
      setState(prev => ({ ...prev, isSyncing: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create assessment',
        isSyncing: false 
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Holistic Assessment</h1>
          <p className="text-gray-600 mt-2">Generate and manage assessment reports with DHIS2 integration</p>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{state.error}</span>
            </div>
          </div>
        )}

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Period Selection */}
          <Card className="bg-white shadow-md border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center text-gray-800">
                <Calendar className="h-5 w-5 mr-2" style={{ color: '#265380' }} />
                Period Selection
              </CardTitle>
              <CardDescription className="text-gray-600">
                Select assessment periods for your analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Selected Periods: {getSelectedPeriodsDisplay()}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPeriodModalOpen(true)}
                    className="hover:bg-blue-50"
                    style={{ borderColor: '#265380', color: '#265380' }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Select Periods
                  </Button>
                </div>
                
                {state.selectedPeriods.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {state.selectedPeriods.map((period, index) => (
                      <Badge 
                        key={period.id}
                        variant="secondary" 
                        style={{ backgroundColor: '#e6f3ff', color: '#265380', borderColor: '#265380' }}
                      >
                        {period.displayName}
                        <button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            selectedPeriods: prev.selectedPeriods.filter((_, i) => i !== index) 
                          }))}
                          className="ml-1 hover:text-blue-800"
                          style={{ color: '#265380' }}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {state.selectedPeriods.length === 0 && (
                  <p className="text-sm text-red-600">
                    Please select at least one assessment period
                  </p>
                )}

                {/* Period Info */}
                <div className="text-xs text-gray-500">
                  <p>Selected periods: {state.selectedPeriods.length}</p>
                  <p>Local assessment periods: {state.assessmentPeriods.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Org Unit Selection */}
          <Card className="bg-white shadow-md border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center text-gray-800">
                <Building2 className="h-5 w-5 mr-2" style={{ color: '#265380' }} />
                Organization Units (DHIS2)
              </CardTitle>
              <CardDescription className="text-gray-600">
                Select the organization units from DHIS2
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Selected Units ({state.selectedOrgUnits.length})</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsOrgUnitModalOpen(true)}
                    className="hover:bg-blue-50"
                    style={{ borderColor: '#265380', color: '#265380' }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Select Units
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {state.selectedOrgUnits.map((orgUnitId, index) => {
                    const orgUnit = state.dhis2OrgUnits.find(ou => ou.id === orgUnitId);
                    return (
                      <Badge key={orgUnitId} variant="secondary" style={{ backgroundColor: '#e6f3ff', color: '#265380', borderColor: '#265380' }}>
                        {orgUnit?.display_name || orgUnitId}
                        <button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            selectedOrgUnits: prev.selectedOrgUnits.filter((_, i) => i !== index) 
                          }))}
                          className="ml-1 hover:text-blue-800"
                          style={{ color: '#265380' }}
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>

                {state.selectedOrgUnits.length === 0 && (
                  <p className="text-sm text-red-600">
                    Please select at least one organization unit
                  </p>
                )}

                {/* DHIS2 Org Units Info */}
                <div className="text-xs text-gray-500">
                  <p>Available org units: {state.dhis2OrgUnits.length} from DHIS2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mb-6 bg-white shadow-md border-gray-200">
          <CardContent className="pt-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleCreateAssessmentWithPeriods}
                  disabled={state.isSyncing || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                  size="lg"
                  className="text-white"
                  style={{ backgroundColor: '#265380' }}
                >
                  {state.isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Assessment...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Multi-Period Assessment
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleGenerateReport}
                  disabled={state.isGenerating || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {state.isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={loadAssessmentReport}
                  disabled={state.selectedPeriods.length === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={testDHIS2Connection}
                  disabled={state.loading}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Test DHIS2
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Table */}
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
          <CardContent className="bg-white">
            {state.loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading assessment data...</span>
              </div>
            ) : state.data ? (
              <div className="space-y-6">
                {/* Sector Score Summary */}
                {state.data.sector_score && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800">Sector Performance</h3>
                        <p className="text-blue-600">
                          {state.data.org_unit_name} - {state.data.assessment_period.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: state.data.sector_score.score_color }}>
                          {state.data.sector_score.overall_score?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">{state.data.sector_score.score_label}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Objectives and Indicators */}
                {state.data.objectives.map((objective) => (
                  <div key={objective.id} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{objective.name}</h4>
                          <p className="text-sm text-gray-600">{objective.description}</p>
                        </div>
                        {objective.score && (
                          <div className="text-right">
                            <div className="text-lg font-bold" style={{ color: objective.score.score_color }}>
                              {objective.score.final_score?.toFixed(2) || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">{objective.score.score_label}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Indicator</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Current Value</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Target</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Score</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {objective.indicators.map((indicator) => (
                              <tr key={indicator.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-sm">
                                  <div>
                                    <div className="font-medium">{indicator.name}</div>
                                    <div className="text-xs text-gray-500">{indicator.description}</div>
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                                  {indicator.score?.current_value?.toFixed(2) || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                                  {indicator.target_value?.toFixed(2) || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-center">
                                  {indicator.score ? (
                                    <Badge 
                                      className="text-xs"
                                      style={{ 
                                        backgroundColor: indicator.score.score_color + '20',
                                        color: indicator.score.score_color,
                                        borderColor: indicator.score.score_color
                                      }}
                                    >
                                      {indicator.score.score}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                                  {indicator.score?.score_label || 'Not Assessed'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
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