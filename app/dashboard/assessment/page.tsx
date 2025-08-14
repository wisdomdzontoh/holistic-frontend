'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PeriodSelectionModal from '@/components/modals/period-selection-modal';
import { OpenAssessmentModal, NameAssessmentModal, ConfirmModal } from '@/components/modals/open-assessment-modal';
import { OrgUnitSelectionModal } from '@/components/modals/org-unit-selection-modal';
import { assessmentService, AssessmentData, AssessmentPeriod, OrgUnit, Period, DHIS2OrgUnit } from '@/lib/assessment-service';
import ExcelTable from '@/components/assessment/excel-table';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calendar, 
  Database,
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
  Clock,
  AlertTriangle
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
  currentAssessmentId?: string; // Track if we're editing an existing assessment
  currentAssessmentName?: string; // Track the current assessment name
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
  const [indicatorSourceFilter, setIndicatorSourceFilter] = useState<'all'|'dhis2'|'manual'>('all');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isNameModal, setIsNameModal] = useState(false);
  const [pendingSaveName, setPendingSaveName] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{open:boolean,title:string,message:string,confirmText?:string,onConfirm?:()=>void}>({open:false,title:'',message:''});
  const [scoringRules, setScoringRules] = useState<any[]>([]);
  const [manualEntries, setManualEntries] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Load assessment data on component mount
  useEffect(() => {
    loadAssessmentData();
    // prefetch scoring rules for advanced logic (will be used in a follow-up step)
    (async () => {
      try {
        const rules = await assessmentService.getScoringRules();
        setScoringRules(rules || []);
      } catch {}
    })();
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
      toast.success('App context loaded');
    } catch (error) {
      console.error('Error loading assessment data:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load assessment data',
        loading: false 
      }));
      toast.error('Failed to load app context');
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
        currentAssessmentId: undefined, // Clear current assessment when starting new
        currentAssessmentName: undefined, // Clear current assessment name when starting new
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
      let assessmentData = await assessmentService.getMultiPeriodAssessmentData({
        org_unit_ids: state.selectedOrgUnits,
        periods: state.selectedPeriods,
        include_scores: true,
      });

      // Compute indicator scores client-side for instant feedback then roll up
      assessmentData = withRollups(computeAllIndicatorScores(assessmentData, state.selectedPeriods));

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

  const handleCellEdit = async (indicatorId: number, period: string, value: string) => {
    // Update the multiPeriodData with the new cell value immediately for responsiveness
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(objective => ({
          ...objective,
          indicators: objective.indicators.map(indicator => {
            if (indicator.id === indicatorId) {
              // Handle different types of updates
              if (period === 'percent_change' || period === 'target_gap') {
                // Manual entry of derived metrics - update the score object
                const numValue = parseFloat(value) || 0;
                return {
                  ...indicator,
                  score: {
                    ...(indicator.score || {}),
                    [period]: numValue,
                    is_manual_override: true
                  }
                };
              } else {
                // Regular period data update
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
            }
            return indicator;
          })
        }))
      })) as AssessmentData[];
      
      // Recompute scores after updating data
      const updatedDataWithScores = computeAllIndicatorScores(updatedDataRaw, prev.selectedPeriods);
      const updatedData = withRollups(updatedDataWithScores);
      return { ...prev, multiPeriodData: updatedData };
    });

    // Only send update to backend if assessment is saved (has an ID)
    if (state.currentAssessmentId) {
      try {
        const orgUnitId = state.multiPeriodData?.[0]?.org_unit_id;
        const assessmentPeriodId = state.multiPeriodData?.[0]?.assessment_period?.id;
        
        if (!orgUnitId || !assessmentPeriodId) {
          console.warn('Missing org unit or assessment period info for backend update');
          return;
        }

        // Prepare data updates for backend
        const dataUpdates: any = {};
        
        if (period === 'percent_change') {
          dataUpdates.percent_change = parseFloat(value) || 0;
        } else if (period === 'target_gap') {
          dataUpdates.target_gap = parseFloat(value) || 0;
        } else {
          // For period data updates, we need to determine if this is current_value or previous_value
          const periods = state.selectedPeriods;
          if (periods.length > 0) {
            const lastPeriod = periods[periods.length - 1];
            const secondLastPeriod = periods.length > 1 ? periods[periods.length - 2] : null;
            
            if (period === lastPeriod.name || period === lastPeriod.code) {
              dataUpdates.current_value = parseFloat(value) || 0;
            } else if (secondLastPeriod && (period === secondLastPeriod.name || period === secondLastPeriod.code)) {
              dataUpdates.previous_value = parseFloat(value) || 0;
            }
          }
        }

        // Call backend API
        if (Object.keys(dataUpdates).length > 0) {
          const response = await assessmentService.updateManualIndicatorData({
            indicator_id: indicatorId,
            org_unit_id: orgUnitId,
            assessment_period_id: assessmentPeriodId,
            data_updates: dataUpdates
          });

          // Update local state with backend response if successful
          if (response.success) {
            setState(prev => {
              if (!prev.multiPeriodData) return prev;
              
              const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
                ...periodData,
                objectives: periodData.objectives.map(objective => ({
                  ...objective,
                  indicators: objective.indicators.map(indicator => {
                    if (indicator.id === indicatorId) {
                      return {
                        ...indicator,
                        score: {
                                                  ...(indicator.score || {}),
                        score: response.indicator_score.score,
                        score_color: response.indicator_score.score_color,
                        score_label: response.indicator_score.score_label,
                        percent_change: response.indicator_score.percent_change,
                        target_gap: response.indicator_score.target_gap,
                        is_manual_override: response.indicator_score.is_manual_override || false
                }
              };
            }
            return indicator;
          })
        }))
      })) as AssessmentData[];
      
      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });
          }
        }
      } catch (error) {
        console.error('Error updating backend data:', error);
        toast.error('Failed to save changes to backend');
      }
    } else {
      // If assessment is not saved, show a helpful message
      console.log('Assessment not saved yet. Changes are stored locally only.');
      toast.info('Changes saved locally. Save the assessment to persist changes to the backend.');
    }
  };

  const handleScoreChange = async (indicatorId: number, score: string) => {
    // Update the multiPeriodData with the new score immediately for responsiveness
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
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
      
      // Recompute scores to ensure consistency
      const updatedDataWithScores = computeAllIndicatorScores(updatedDataRaw, prev.selectedPeriods);
      const updatedData = withRollups(updatedDataWithScores);
      return { ...prev, multiPeriodData: updatedData };
    });

    // Only send update to backend if assessment is saved (has an ID)
    if (state.currentAssessmentId) {
      try {
        const orgUnitId = state.multiPeriodData?.[0]?.org_unit_id;
        const assessmentPeriodId = state.multiPeriodData?.[0]?.assessment_period?.id;
        
        if (!orgUnitId || !assessmentPeriodId) {
          console.warn('Missing org unit or assessment period info for backend update');
          return;
        }

        const response = await assessmentService.updateManualIndicatorData({
          indicator_id: indicatorId,
          org_unit_id: orgUnitId,
          assessment_period_id: assessmentPeriodId,
          data_updates: {
            score: parseInt(score)
          }
        });

        // Update local state with backend response if successful
        if (response.success) {
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
        ...periodData,
              objectives: periodData.objectives.map(objective => ({
                ...objective,
                indicators: objective.indicators.map(indicator => {
                  if (indicator.id === indicatorId) {
                    return {
                      ...indicator,
                      score: {
                        ...(indicator.score || {}),
                        score: response.indicator_score.score,
                        score_color: response.indicator_score.score_color,
                        score_label: response.indicator_score.score_label,
                        is_manual_override: response.indicator_score.is_manual_override || false
                }
              };
            }
            return indicator;
          })
        }))
      })) as AssessmentData[];
      
      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });
        }
      } catch (error) {
        console.error('Error updating backend score:', error);
        toast.error('Failed to save score to backend');
      }
    } else {
      // If assessment is not saved, show a helpful message
      console.log('Assessment not saved yet. Score changes are stored locally only.');
      toast.info('Score changes saved locally. Save the assessment to persist changes to the backend.');
    }
  };

  const handleMilestoneScoreChange = async (objectiveId: number, score: string) => {
    // Find the objective and its milestone
    const objective = state.multiPeriodData?.[0]?.objectives.find(obj => obj.id === objectiveId);
    if (!objective?.milestone) {
      toast.error('Milestone not found for this objective');
      return;
    }

            const numScore = parseFloat(score);
            const scoreColor = getScoreColor(numScore);
            const scoreLabel = getScoreLabel(numScore);
            
    // Update the local state immediately for responsiveness
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(obj => {
          if (obj.id === objectiveId && obj.milestone) {
            return {
              ...obj,
              milestone: {
                ...obj.milestone,
                score: numScore,
                score_color: scoreColor,
                score_label: scoreLabel
              }
            };
          }
          return obj;
        })
      })) as AssessmentData[];

      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });

    // Set unsaved changes flag
    setHasUnsavedChanges(true);
    
    toast.success(`Milestone score updated to ${score} (saved locally)`);
  };

  const handleRemarksChange = (indicatorId: number, remarks: string) => {
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(obj => ({
          ...obj,
          indicators: obj.indicators.map(ind => {
            if (ind.id === indicatorId && ind.score) {
              return {
                ...ind,
                score: {
                  ...ind.score,
                  remarks: remarks
                }
              };
            }
            return ind;
          })
        }))
      })) as AssessmentData[];
      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });
    setHasUnsavedChanges(true);
  };

  const handleMilestoneRemarksChange = (objectiveId: number, remarks: string) => {
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(obj => {
          if (obj.id === objectiveId && obj.milestone) {
            return {
              ...obj,
              milestone: {
                ...obj.milestone,
                notes: remarks
              }
            };
          }
          return obj;
        })
      })) as AssessmentData[];
      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });
    setHasUnsavedChanges(true);
  };

  const getScoreLabel = (score: number) => {
    if (score >= 1) return 'Highly Performing';
    if (score >= 0) return 'Sustained';
    if (score >= -1) return 'Underperforming';
    return 'Severely Underperforming';
  };

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return '';
    if (score >= 2) return 'bg-[#548235] text-white';
    if (score >= 1) return 'bg-[#A9D08E] text-black';
    if (score === 0) return 'bg-[#FFFF00] text-black';
    if (score === -1) return 'bg-[#FFC7CE] text-black';
    return 'bg-[#FF0000] text-white';
  };

  const getScoreHex = (score: number | undefined) => {
    if (score === undefined) return '#6c757d';
    if (score >= 1) return '#28a745'; // green
    if (score === 0) return '#ffc107'; // yellow
    if (score === -1) return '#fd7e14'; // orange
    return '#dc3545'; // red
  };

  const median = (values: number[]) => {
    if (!values.length) return undefined as unknown as number;
    const sorted = [...values].sort((a,b)=>a-b);
    const mid = Math.floor(sorted.length/2);
    if (sorted.length % 2) return sorted[mid];
    return (sorted[mid-1] + sorted[mid]) / 2;
  };

  const withRollups = (data: AssessmentData[]): AssessmentData[] => {
    return data.map(periodData => {
      const newObjectives = periodData.objectives.map(obj => {
        const scoredPairs = obj.indicators
          .map(ind => ({ s: (ind as any).score?.score as number | undefined, w: Number((ind as any).weight || 1) }))
          .filter(p => typeof p.s === 'number');
        const total = obj.indicators.length;
        const scored = scoredPairs.length;
        const sumW = scoredPairs.reduce((a, b) => a + (isNaN(b.w) ? 0 : b.w), 0);
        const final = scored && sumW > 0 ? (scoredPairs.reduce((a, b) => a + (b.s as number) * (isNaN(b.w) ? 0 : b.w), 0) / sumW) : undefined;
        const color = final === undefined ? '#6c757d' : getScoreHex(final);
        const label = final === undefined ? 'Unknown' : getScoreLabel(final);
        return {
          ...obj,
          score: final === undefined ? undefined : {
            final_score: final,
            score_color: color,
            score_label: label,
            total_indicators: total,
            scored_indicators: scored,
          }
        };
      });
      const objectivePairs = newObjectives.map(o => ({ s: (o as any).score?.final_score as number | undefined, w: 1 }));
      const validPairs = objectivePairs.filter(p => typeof p.s === 'number');
      const overall = validPairs.length ? (validPairs.reduce((a,b)=> a + (b.s as number) * b.w, 0) / validPairs.reduce((a,b)=> a + b.w, 0)) : undefined;
      return {
        ...periodData,
        objectives: newObjectives,
        sector_score: overall === undefined ? undefined : {
          overall_score: overall,
          score_color: getScoreHex(overall),
          score_label: getScoreLabel(overall),
          total_objectives: newObjectives.length,
          scored_objectives: validPairs.length
        }
      } as AssessmentData;
    });
  };

  const computeIndicatorScore = (indicator: any, periods: Period[]) => {
    const hasManualOverride = indicator.score?.is_manual_override || false;
    const manualScore = indicator.score?.score;

    // If manual override exists, return as-is
    if (hasManualOverride && manualScore !== undefined && manualScore !== null) {
      return indicator;
    }

    // Use the score from the API response (backend calculation)
    // The backend now provides the correct Excel-based scoring
    const apiScore = indicator.score?.score;
    const apiScoreColor = indicator.score?.score_color;
    const apiScoreLabel = indicator.score?.score_label;
    const apiPercentChange = indicator.score?.percent_change;
    const apiTargetGap = indicator.score?.target_gap;

    // If the API provided a score, use it
    if (apiScore !== undefined && apiScore !== null) {
      return {
        ...indicator,
        score: {
          ...(indicator.score || {}),
          score: apiScore,
          score_color: apiScoreColor,
          score_label: apiScoreLabel,
          is_manual_override: false,
          percent_change: apiPercentChange,
          target_gap: apiTargetGap,
        }
      };
    }

    // Fallback: if no API score, use default -2 (no data)
    return {
      ...indicator,
      score: {
        ...(indicator.score || {}),
        score: -2,
        score_color: '#dc3545',
        score_label: 'Severely Underperforming',
        is_manual_override: false,
        percent_change: indicator.score?.percent_change,
        target_gap: indicator.score?.target_gap,
      }
    };
  };

  const computeAllIndicatorScores = (data: AssessmentData[], periods: Period[]) => {
    return data.map(pd => ({
      ...pd,
      objectives: pd.objectives.map(obj => ({
        ...obj,
        indicators: obj.indicators.map(ind => computeIndicatorScore(ind, periods))
      }))
    })) as AssessmentData[];
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

  const performSave = async (finalName: string) => {
    if (!state.multiPeriodData || state.multiPeriodData.length === 0) {
      setState(prev => ({ ...prev, error: 'No assessment data to save' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Prepare assessment data for saving
      const assessmentName = finalName || `Assessment_${new Date().toISOString().split('T')[0]}`;
      const orgUnitId = state.selectedOrgUnits[0] || '';
      const orgUnitName = state.multiPeriodData[0]?.org_unit_name || '';
      const periods = state.selectedPeriods.map(p => p.name);
      const periodCodes = state.selectedPeriods.map(p => p.code);
      
      // Extract indicator data
      const indicatorData: Record<string, any> = {};
      state.multiPeriodData.forEach(periodData => {
        periodData.objectives.forEach(objective => {
          objective.indicators.forEach(indicator => {
            const key = `${indicator.id}`;
            
            // Debug: Log the data_values structure
            console.log(`Saving indicator ${indicator.id} (${indicator.name}) data_values:`, indicator.data_values);
            
            indicatorData[key] = {
              name: indicator.name,
              dhis2_uid: indicator.dhis2_uid,
              target_value: indicator.target_value,
              target_display: indicator.target_display,
              target_lower_limit: indicator.target_lower_limit,
              target_upper_limit: indicator.target_upper_limit,
              target_format: indicator.target_format,
              target_type: indicator.target_type,
              target_operator: indicator.target_operator,
              target_measurement_type: indicator.target_measurement_type,
              data_values: indicator.data_values,
              score: indicator.score,
              // persist structure to reconstruct on open
              objective_id: objective.id,
              objective_name: objective.name,
              indicator_number: indicator.indicator_number,
              display_order: indicator.display_order
            };
          });
        });
      });

      // Extract milestone scores
      const milestoneScores: Record<string, any> = {};
      state.multiPeriodData.forEach(periodData => {
        periodData.objectives.forEach(objective => {
          if (objective.milestone) {
            milestoneScores[objective.id] = {
              name: objective.milestone.name,
              score: objective.milestone.score ?? -2,
              notes: objective.milestone.notes || ''
            };
          }
        });
      });

      // Extract complete indicator scores for analysis
      const indicatorScores: Record<string, any> = {};
      state.multiPeriodData.forEach(periodData => {
        periodData.objectives.forEach(objective => {
          objective.indicators.forEach(indicator => {
            const indicatorId = indicator.id.toString();
            indicatorScores[indicatorId] = {
              score: indicator.score?.score || 0,
              current_value: indicator.score?.current_value,
              previous_value: indicator.score?.previous_value,
              percent_change: indicator.score?.percent_change,
              target_gap: indicator.score?.target_gap,
              change_category: indicator.score?.change_category,
              gap_category: indicator.score?.gap_category,
              current_meets_target: indicator.score?.current_meets_target,
              previous_meets_target: indicator.score?.previous_meets_target,
              score_color: indicator.score?.score_color || '#6c757d',
              score_label: indicator.score?.score_label || 'No Data',
              remarks: indicator.score?.remarks || ''
            };
          });
        });
      });

      const saveData = {
        name: assessmentName,
        org_unit_id: orgUnitId,
        org_unit_name: orgUnitName,
        periods: periods,
        period_codes: periodCodes, // Save period codes for proper reconstruction
        indicator_data: indicatorData,
        calculated_scores: {
          milestones: milestoneScores,
          objectives: state.multiPeriodData[0]?.objectives.map(obj => ({
            id: obj.id,
            name: obj.name,
            code: (obj as any).code || '',
            color: (obj as any).color || '',
            order: (obj as any).order || 0,
            score: obj.score
          })) || [],
          indicators: indicatorScores, // Add complete indicator scores
          sector: {
            overall_score: state.multiPeriodData[0]?.sector_score?.overall_score || 0
          }
        },
        user_notes: '',
        metadata: {
          total_indicators: state.multiPeriodData[0]?.objectives.reduce((sum, obj) => sum + obj.indicators.length, 0) || 0,
          total_objectives: state.multiPeriodData[0]?.objectives.length || 0,
          assessment_type: 'holistic'
        }
      };

      let result: any;
      if (state.currentAssessmentId) {
        // Update existing assessment
        result = await assessmentService.updateAssessment({
          assessment_id: state.currentAssessmentId,
          ...saveData
        });
        toast.success('Assessment updated successfully');
      } else {
        // Save new assessment
        result = await assessmentService.saveAssessment(saveData);
        toast.success('Assessment saved successfully');
        
        // Set the current assessment ID and name after successful save
        if (result?.assessment_id) {
          setState(prev => ({ 
            ...prev, 
            currentAssessmentId: result.assessment_id,
            currentAssessmentName: finalName,
            loading: false,
            error: null
          }));
          return; // Exit early since we already updated state
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: null
      }));
      
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: 'Failed to save assessment'
      }));
      if (typeof window !== 'undefined') window?.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to save assessment' } }));
    }
  };

  const handleSaveAssessment = () => {
    let defaultName;
    if (state.currentAssessmentId && state.currentAssessmentName) {
      // For updates, use the stored assessment name
      defaultName = state.currentAssessmentName;
    } else {
      defaultName = `Assessment_${new Date().toISOString().split('T')[0]}`;
    }
    setPendingSaveName(defaultName);
    setIsNameModal(true);
  };

  const handleLoadAssessment = async (assessmentId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const res = await assessmentService.loadAssessment({ assessment_id: assessmentId });
      const saved = res?.assessment || res;

      // Use saved period codes if available, otherwise fallback to names
      const savedPeriodCodes = saved?.metadata?.period_codes || saved?.period_codes || [];
      const loadedPeriods: Period[] = (saved?.periods || []).map((name: string, idx: number) => ({
        id: String(idx + 1),
        name,
        displayName: name,
        startDate: '',
        endDate: '',
        periodType: 'yearly',
        code: savedPeriodCodes[idx] || name, // Use saved period code if available, otherwise fallback to name
      }));

      const multi: AssessmentData[] = [
        {
          org_unit_id: saved.org_unit_id,
          org_unit_name: saved.org_unit_name,
          assessment_period: { id: 0, name: loadedPeriods[0]?.name || '', start_date: '', end_date: '' },
          objectives: [],
          sector_score: saved?.calculated_scores?.sector_score,
        } as any,
      ];

      const objectiveMap: Record<string, any> = {};
      if (saved?.calculated_scores?.objectives) {
        // sort objectives by order if present
        const sortedObjs = [...saved.calculated_scores.objectives].sort((a:any,b:any)=> (a.order||0)-(b.order||0));
        sortedObjs.forEach((obj: any) => {
          // Normalize saved objective score which might be a number or an object
          const rawScore = obj.score;
          const finalScore = typeof rawScore === 'number'
            ? rawScore
            : (rawScore && typeof rawScore === 'object' ? (rawScore.final_score ?? rawScore.score ?? undefined) : undefined);
          const scoreColor = (rawScore && typeof rawScore === 'object') ? (rawScore.score_color || '') : '';
          const scoreLabel = (rawScore && typeof rawScore === 'object') ? (rawScore.score_label || '') : '';
          const totalIndicators = (rawScore && typeof rawScore === 'object') ? (rawScore.total_indicators || 0) : 0;
          const scoredIndicators = (rawScore && typeof rawScore === 'object') ? (rawScore.scored_indicators || 0) : 0;
          const changeCategory = (rawScore && typeof rawScore === 'object') ? rawScore.change_category : undefined;
          const gapCategory = (rawScore && typeof rawScore === 'object') ? rawScore.gap_category : undefined;

          objectiveMap[String(obj.id)] = {
            id: obj.id,
            name: obj.name,
            code: obj.code || '',
            description: '',
            color: '#fd7e14',
            order: obj.order || 0,
            milestone: saved?.calculated_scores?.milestones?.[obj.id]
              ? {
                  id: obj.id,
                  name: saved.calculated_scores.milestones[obj.id].name,
                  code: '',
                  color: '#ffc107',
                  score: saved.calculated_scores.milestones[obj.id].score,
                  notes: saved.calculated_scores.milestones[obj.id].notes || '',
                }
              : undefined,
            indicators: [],
            score: finalScore === undefined ? undefined : {
              final_score: finalScore,
              score_color: scoreColor,
              score_label: scoreLabel,
              total_indicators: totalIndicators,
              scored_indicators: scoredIndicators,
              change_category: changeCategory,
              gap_category: gapCategory,
            },
          };
        });
      }

      const indicatorsByObjective: Record<string, any[]> = {};
      Object.keys(saved?.indicator_data || {}).forEach((key) => {
        const ind = saved.indicator_data[key];
        const objId = ind.objective_id ? String(ind.objective_id) : 'default';
        if (!indicatorsByObjective[objId]) indicatorsByObjective[objId] = [];
        // Get saved indicator score data
        const savedScore = saved?.calculated_scores?.indicators?.[key];
        
        // Debug: Log the loaded data_values structure
        console.log(`Loading indicator ${key} (${ind.name}) data_values:`, ind.data_values);
        
        indicatorsByObjective[objId].push({
          id: Number(key),
          name: ind.name,
          dhis2_uid: ind.dhis2_uid,
          description: '',
          indicator_number: ind.indicator_number || '',
          display_order: ind.display_order || 0,
          target_value: ind.target_value ?? null,
          target_display: ind.target_display,
          target_lower_limit: ind.target_lower_limit,
          target_upper_limit: ind.target_upper_limit,
          target_format: ind.target_format || 'SINGLE',
          target_type: ind.target_type || 'increase',
          target_operator: ind.target_operator || '>=',
          target_measurement_type: ind.target_measurement_type || 'ABSOLUTE',
          weight: 1,
          score: savedScore ? {
            score: savedScore.score || 0,
            current_value: savedScore.current_value,
            previous_value: savedScore.previous_value,
            percent_change: savedScore.percent_change,
            target_gap: savedScore.target_gap,
            change_category: savedScore.change_category,
            gap_category: savedScore.gap_category,
            current_meets_target: savedScore.current_meets_target,
            previous_meets_target: savedScore.previous_meets_target,
            score_color: savedScore.score_color || '#6c757d',
            score_label: savedScore.score_label || 'No Data',
            remarks: savedScore.remarks || ''
          } : ind.score,
          data_values: ind.data_values || {},
        });
      });

      const objectives: any[] = [];
      Object.keys(indicatorsByObjective).forEach((objKey) => {
        if (!objectiveMap[objKey]) {
          objectiveMap[objKey] = {
            id: objKey === 'default' ? 0 : Number(objKey),
            name: objKey === 'default' ? 'Objective' : `Objective ${objKey}`,
            code: '',
            description: '',
            color: '#fd7e14',
            order: 0,
            indicators: [],
          };
        }
        const obj = { ...objectiveMap[objKey] };
        // sort indicators by display_order then indicator_number natural
        const sortedIndicators = [...indicatorsByObjective[objKey]].sort((a:any,b:any)=>{
          const od = (a.display_order||0) - (b.display_order||0);
          if (od !== 0) return od;
          return String(a.indicator_number||'').localeCompare(String(b.indicator_number||''), undefined, { numeric: true });
        });
        obj.indicators = sortedIndicators;
        objectives.push(obj);
      });

      multi[0].objectives = objectives as any;

      // Restore manual entries from saved data
      const restoredManualEntries: Record<string, any> = {};
      multi[0].objectives.forEach(objective => {
        objective.indicators.forEach(indicator => {
          if (indicator.data_values) {
            Object.keys(indicator.data_values).forEach(period => {
              const dataValue = indicator.data_values[period];
              if (dataValue && dataValue.manual_override !== undefined) {
                const entryKey = `${indicator.id}_${period}`;
                restoredManualEntries[entryKey] = dataValue.manual_override;
              }
            });
          }
        });
      });

      setState((prev) => ({
        ...prev,
        selectedOrgUnits: saved?.org_unit_id ? [saved.org_unit_id] : prev.selectedOrgUnits,
        selectedPeriods: loadedPeriods.length ? loadedPeriods : prev.selectedPeriods,
        multiPeriodData: multi,
        manualEntries: restoredManualEntries, // Restore manual entries
        hasUnsavedChanges: false, // Reset unsaved changes flag
        currentAssessmentId: assessmentId, // Set the current assessment ID for updates
        currentAssessmentName: saved?.name || '', // Store the assessment name
        loading: false,
        error: null,
      }));
      if (typeof window !== 'undefined') window?.dispatchEvent(new CustomEvent('notify', { detail: { type: 'success', message: 'Assessment loaded' } }));
    } catch (error) {
      console.error('Error loading assessment:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load assessment',
      }));
      if (typeof window !== 'undefined') window?.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Failed to load assessment' } }));
    }
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
          periods: [period], // Pass the actual period object
          calculate_scores: true,
        });
      });

      await Promise.all(syncPromises);

      setState(prev => ({
        ...prev,
        syncProgress: { current: 2, total: 3, message: 'Loading assessment data...' }
      }));

      // Step 3: Load multi-period assessment data
      let assessmentData = await assessmentService.getMultiPeriodAssessmentData({
        org_unit_ids: state.selectedOrgUnits,
        periods: state.selectedPeriods,
        include_scores: true,
      });

      assessmentData = withRollups(computeAllIndicatorScores(assessmentData, state.selectedPeriods));

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

  // Real-time scoring calculation for manual entries - matches backend HolisticScoringService
  const calculateManualScore = (indicator: any, currentValue: number, previousValue: number | null) => {
    // Step 1: Data Provided
    const dataProvided = currentValue !== null && currentValue !== undefined;
    if (!dataProvided) return { score: -2, percent_change: null, target_gap: null };
    
    // Step 2: First Year
    const isFirstYear = previousValue === null || previousValue === undefined;
    
    // Step 3: Target Achieved - use target format and operator logic
    let targetAchieved = false;
    const targetFormat = indicator.target_format || 'SINGLE';
    const targetType = indicator.target_type || 'increase';
    const targetOperator = indicator.target_operator || '>=';
    
    if (currentValue !== null) {
      if (targetFormat === 'RANGE') {
        // Range target: check if current value is within the range
        const lowerLimit = indicator.target_lower_limit;
        const upperLimit = indicator.target_upper_limit;
        if (lowerLimit !== null && upperLimit !== null) {
          targetAchieved = currentValue >= lowerLimit && currentValue <= upperLimit;
        } else {
          // Fallback to single target value
          const targetValue = Number(indicator.target_value);
          if (targetValue !== 0) {
            targetAchieved = currentValue >= targetValue;
          }
        }
      } else {
        // Single value target: use the target_operator
        const targetValue = Number(indicator.target_value);
        if (targetValue !== 0) {
          if (targetOperator === '>=') targetAchieved = currentValue >= targetValue;
          else if (targetOperator === '>') targetAchieved = currentValue > targetValue;
          else if (targetOperator === '<=') targetAchieved = currentValue <= targetValue;
          else if (targetOperator === '<') targetAchieved = currentValue < targetValue;
          else if (targetOperator === '=') targetAchieved = currentValue === targetValue;
          else {
            // Fallback to target_type logic
            targetAchieved = targetType === 'increase' ? currentValue >= targetValue : currentValue <= targetValue;
          }
        }
      }
    }
    
    // Step 4: Performance Change
    let percentChange = null;
    let changeCategory = null;
    if (currentValue !== null && previousValue !== null && previousValue !== 0) {
      const rawChange = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
      percentChange = Math.round(rawChange * 100) / 100; // Round to 2 decimal places
      
      // For negative indicators, invert the change for scoring
      const performanceChange = targetType === 'decrease' ? -rawChange : rawChange;
      
      if (performanceChange <= -10) changeCategory = "<=-10%";
      else if (performanceChange <= -5) changeCategory = "-10%<C<=-5%";
      else if (performanceChange <= 5) changeCategory = "5%<=C>-5%";
      else if (performanceChange > 5) changeCategory = ">5%";
    }
    
    // Step 5: Target Gap - use the updated formulas
    let targetGap = null;
    let gapCategory = null;
    if (currentValue !== null && currentValue !== 0) {
      if (targetFormat === 'RANGE' && indicator.target_upper_limit !== null) {
        // For range indicators: (Target upper limit - Current Value) / Current Value * 100
        targetGap = Math.round(((Number(indicator.target_upper_limit) - currentValue) / currentValue) * 100 * 100) / 100;
      } else {
        // For non-range indicators
        const targetValue = Number(indicator.target_value);
        if (targetValue !== 0) {
          if (targetType === 'increase') {
            // For increase indicators: (Current Value - Target Value) / Target Value * 100
            targetGap = Math.round(((currentValue - targetValue) / targetValue) * 100 * 100) / 100;
          } else {
            // For decrease indicators: (Target Value - Current Value) / Current Value * 100
            targetGap = Math.round(((targetValue - currentValue) / currentValue) * 100 * 100) / 100;
          }
        }
      }
      
      if (targetGap !== null) {
        if (targetGap <= 10) gapCategory = "<=10%";
        else if (targetGap <= 40) gapCategory = "10%<PT<=40%";
        else gapCategory = ">40%";
      }
    }
    
    // Step 6: Final Score Calculation - matches backend _calculate_final_score
    if (isFirstYear) {
      return { 
        score: targetAchieved ? 1 : 0, 
        percent_change: percentChange, 
        target_gap: targetGap 
      };
    }
    
    if (targetAchieved) {
      // Target WAS achieved - check performance change
      if (changeCategory === ">5%") return { score: 2, percent_change: percentChange, target_gap: targetGap };
      if (changeCategory === "5%<=C>-5%") return { score: 2, percent_change: percentChange, target_gap: targetGap };
      if (changeCategory === "-10%<C<=-5%") return { score: 2, percent_change: percentChange, target_gap: targetGap };
      if (changeCategory === "<=-10%") return { score: 0, percent_change: percentChange, target_gap: targetGap };
      return { score: 0, percent_change: percentChange, target_gap: targetGap };
    } else {
      // Target NOT achieved - check performance change
      if (changeCategory === ">5%") return { score: 1, percent_change: percentChange, target_gap: targetGap };
      if (changeCategory === "5%<=C>-5%") {
        if (gapCategory === "<=10%") return { score: 1, percent_change: percentChange, target_gap: targetGap };
        if (gapCategory === "10%<PT<=40%") return { score: 0, percent_change: percentChange, target_gap: targetGap };
        if (gapCategory === ">40%") return { score: -1, percent_change: percentChange, target_gap: targetGap };
        return { score: 0, percent_change: percentChange, target_gap: targetGap };
      }
      if (changeCategory === "-10%<C<=-5%" || changeCategory === "<=-10%") {
        return { score: -1, percent_change: percentChange, target_gap: targetGap };
      }
      return { score: 0, percent_change: percentChange, target_gap: targetGap };
    }
  };

  // Handle manual entry changes
  const handleManualEntryChange = (indicatorId: number, period: string, value: string) => {
    const entryKey = `${indicatorId}_${period}`;
    const newValue = value === '' ? null : Number(value);
    
    setManualEntries(prev => ({
      ...prev,
      [entryKey]: newValue
    }));
    
    setHasUnsavedChanges(true);
    
    // Update the indicator data with new value and recalculate scores
    if (state.multiPeriodData && state.multiPeriodData.length > 0) {
      const updatedData = state.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(obj => ({
          ...obj,
          indicators: obj.indicators.map(ind => {
            if (ind.id === indicatorId) {
              // Find the period object to get its 'code'
              const selectedPeriodObj = state.selectedPeriods.find(p => p.name === period);
              const periodCode = selectedPeriodObj?.code || period; // Fallback to name if code not found
              
              // Update data values using periodCode
              const updatedDataValues = {
                ...ind.data_values,
                [periodCode]: {
                  ...ind.data_values?.[periodCode],
                  value: newValue,
                  manual_override: newValue
                }
              };
              
              // Get current and previous values for scoring
              const periods = state.selectedPeriods;
              const currentPeriodIndex = periods.findIndex(p => p.name === period);
              const currentValue = newValue;
              
              // Get previous value using periodCode as well
              const previousPeriodObj = currentPeriodIndex > 0 ? periods[currentPeriodIndex - 1] : null;
              const previousValue = previousPeriodObj ? 
                updatedDataValues[previousPeriodObj.code]?.value : null;
              
              // Calculate new score
              const scoreResult = calculateManualScore(ind, currentValue || 0, previousValue);
              
              return {
                ...ind,
                data_values: updatedDataValues,
                score: {
                  ...ind.score,
                  score: scoreResult.score,
                  percent_change: scoreResult.percent_change,
                  target_gap: scoreResult.target_gap,
                  current_value: currentValue,
                  previous_value: previousValue,
                  score_color: ind.score?.score_color || '#6c757d',
                  score_label: ind.score?.score_label || 'No Data',
                  is_manual_override: true
                }
              };
            }
            return ind;
          })
        }))
      }));
      
      setState(prev => ({
        ...prev,
        multiPeriodData: updatedData
      }));
    }
  };

  // Save manual entries locally (they will be saved to backend when assessment is saved)
  // Handle actions that require checking for unsaved changes
  const handleActionWithUnsavedCheck = (action: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
      setShowUnsavedChangesModal(true);
    } else {
      action();
    }
  };

  const handleSaveAndContinue = async () => {
    await saveManualEntries();
    setShowUnsavedChangesModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleIgnoreAndContinue = () => {
    setShowUnsavedChangesModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const saveManualEntries = async () => {
    if (!hasUnsavedChanges) {
      toast.info('No changes to save');
      return;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Clear the unsaved changes flag
      // The manual entries and milestone scores are already saved in the multiPeriodData state
      // and will be saved to backend when the user saves the entire assessment
      setManualEntries({});
      setHasUnsavedChanges(false);
      
      toast.success('Assessment saved locally');
      
    } catch (error) {
      console.error('Error saving manual entries:', error);
      toast.error('Failed to save manual entries');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const exportToCSV = () => {
    if (!state.multiPeriodData || state.multiPeriodData.length === 0) return;
    const enc = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const periods = state.selectedPeriods.map(p=>p.name);
    const headers = ['#','Indicator', ...periods, 'Change','P-T Gap','Target','Assessed score','Remarks'];
    const rows: string[] = [];
    rows.push(headers.map(enc).join(','));

    state.multiPeriodData[0].objectives.forEach((obj, oi) => {
      // Objective header (optional in CSV)
      rows.push(enc(`Objective ${oi+1}: ${obj.name}`));
      obj.indicators.forEach((ind: any, ii: number) => {
        const row: any[] = [];
        row.push(`${oi+1}.${ii+1}`);
        row.push(ind.name);
        periods.forEach(p => row.push(ind?.data_values?.[p]?.value ?? ''));
        row.push(''); // Change placeholder
        row.push(''); // Gap placeholder
        row.push(ind.target_value ?? '');
        row.push((ind.score?.score ?? '') as any);
        row.push(''); // remarks
        rows.push(row.map(enc).join(','));
      });
      // Milestone row if exists
      if ((obj as any).milestone?.name) {
        const ms = (obj as any).milestone;
        const row = [ 'MS', `Milestone for ${obj.name}`, ...periods.map(()=>''), '', '', '', (ms.score ?? ''), '' ];
        rows.push(row.map(enc).join(','));
      }
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const org = state.dhis2OrgUnitsFlat.find(ou=>ou.id===state.selectedOrgUnits[0])?.displayName || 'OrgUnit';
    a.download = `assessment_${org}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  };

  const exportToPDF = () => {
    if (!state.multiPeriodData || state.multiPeriodData.length === 0) {
      toast.error('No assessment data available for PDF export');
      return;
    }
    
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups for this site to generate PDF.');
        return;
      }

    const org = state.dhis2OrgUnitsFlat.find(ou=>ou.id===state.selectedOrgUnits[0])?.displayName || 'Org Unit';
    const periods = state.selectedPeriods.map(p=>p.displayName).join(', ');
      
    const style = `
      <style>
        @media print {
            body { margin: 0; padding: 16px; }
            table { page-break-inside: avoid; }
            .obj { page-break-inside: avoid; }
          }
          body { font-family: Arial, sans-serif; padding: 16px; margin: 0; }
          h2 { margin: 0 0 6px 0; color: #333; }
          .meta { color: #555; margin-bottom: 12px; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; }
          th { background: #f5f5f5; text-align: left; font-weight: bold; }
          .obj { background: #fff3e0; font-weight: bold; }
          .ms { background: #fff8e1; font-weight: bold; }
          .score { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            color: white !important; 
            font-weight: bold; 
            text-align: center;
            border-radius: 3px;
          }
          .score.g2 { background: #548235 !important; }
          .score.g1 { background: #A9D08E !important; color: #000 !important; }
          .score.y { background: #FFFF00 !important; color: #000 !important; }
          .score.r1 { background: #FFC7CE !important; color: #000 !important; }
          .score.r2 { background: #FF0000 !important; }
          .legend { margin-top: 20px; font-size: 11px; }
          .chip { 
            display: inline-block; 
            padding: 2px 6px; 
            border-radius: 4px; 
            color: white; 
            margin-right: 6px; 
            font-size: 10px;
            font-weight: bold;
          }
          .chip.g2 { background: #548235; }
          .chip.g1 { background: #A9D08E; color: #000; }
          .chip.y { background: #FFFF00; color: #000; }
          .chip.r1 { background: #FFC7CE; color: #000; }
          .chip.r2 { background: #FF0000; }
          .legend-item { margin-bottom: 4px; }
        </style>
      `;

      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Assessment Report</title>
          ${style}
        </head>
        <body>
          <h2>Assessment Report</h2>
          <div class="meta">${org} • Periods: ${periods} • Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th style="width: 300px;">Indicator</th>
                ${state.selectedPeriods.map(p => `<th style="width: 80px;">${p.displayName}</th>`).join('')}
                <th style="width: 80px;">Change</th>
                <th style="width: 100px;">P-T Gap</th>
                <th style="width: 80px;">Target</th>
                <th style="width: 100px;">Score</th>
              </tr>
            </thead>
            <tbody>
      `;

    state.multiPeriodData[0].objectives.forEach((obj, oi) => {
        html += `<tr class="obj"><td colspan="${2 + state.selectedPeriods.length + 4}">Objective ${oi+1}: ${obj.name}</td></tr>`;
        
        obj.indicators.forEach((ind: any, ii: number) => {
        html += '<tr>';
          html += `<td>${oi+1}.${ii+1}</td><td style="text-align: left;">${ind.name}</td>`;
          
          // Performance trend columns
          state.selectedPeriods.forEach(p => {
          const v = ind?.data_values?.[p.name]?.value ?? '';
          html += `<td>${v}</td>`;
        });

          // Calculate change and gap
          const lastName = state.selectedPeriods[state.selectedPeriods.length-1].name;
          const prevName = state.selectedPeriods.length > 1 ? state.selectedPeriods[state.selectedPeriods.length-2].name : undefined;
          const currVal = Number(ind?.data_values?.[lastName]?.value ?? NaN);
          const prevVal = prevName ? Number(ind?.data_values?.[prevName]?.value ?? NaN) : NaN;
          
          let changeValue = '';
          if (isFinite(currVal) && isFinite(prevVal) && prevVal !== 0) {
            const change = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
            changeValue = isFinite(change) ? `${change.toFixed(1)}%` : '';
          }

          let gapValue = '';
          const target = Number(ind?.target_value ?? NaN);
          if (isFinite(currVal) && isFinite(target) && target !== 0) {
            const targetType = (ind?.target_type || 'increase').toLowerCase();
            const ratio = currVal / target;
            const gap = targetType === 'increase' ? (ratio - 1) * 100 : (1 - ratio) * 100;
            gapValue = isFinite(gap) ? `${gap.toFixed(1)}%` : '';
          }

          // Score data
          const scoreData = ind?.score;
          const scoreValue = scoreData?.score;
          
          // Determine color class
          let cls = '';
          if (scoreValue !== null && scoreValue !== undefined) {
            const s = Number(scoreValue);
            if (!isNaN(s)) {
              if (s >= 2) cls = 'g2';
              else if (s >= 1) cls = 'g1';
              else if (s === 0) cls = 'y';
              else if (s === -1) cls = 'r1';
              else cls = 'r2';
            }
          }

          // Use target_display if available
          const targetDisplay = ind.target_display || ind.target_value || '';
          
          html += `<td>${changeValue}</td><td>${gapValue}</td><td>${targetDisplay}</td><td class="score ${cls}">${scoreValue ?? ''}</td>`;
        html += '</tr>';
      });

        // Milestone row
        if ((obj as any).milestone?.name) {
        const ms = (obj as any).milestone;
          const milestoneScore = ms.score;
          
          let msCls = '';
          if (milestoneScore !== null && milestoneScore !== undefined) {
            const s = Number(milestoneScore);
            if (!isNaN(s)) {
              if (s >= 2) msCls = 'g2';
              else if (s >= 1) msCls = 'g1';
              else if (s === 0) msCls = 'y';
              else if (s === -1) msCls = 'r1';
              else msCls = 'r2';
            }
          }
          
          html += `<tr class="ms"><td>MS</td><td style="text-align: left;">${ms.name || `Milestone for ${obj.name}`}</td>`;
          html += state.selectedPeriods.map(() => '<td>-</td>').join('');
          html += `<td>-</td><td>-</td><td>-</td><td class="score ${msCls}">${milestoneScore ?? ''}</td></tr>`;
        }
      });

      html += `
            </tbody>
          </table>
          <div class="legend">
            <div class="legend-item"><span class="chip g2">Score 2</span> Highly Performing</div>
            <div class="legend-item"><span class="chip g1">Score 1</span> Moderately Performing</div>
            <div class="legend-item"><span class="chip y">Score 0</span> Sustained</div>
            <div class="legend-item"><span class="chip r1">Score -1</span> Underperforming</div>
            <div class="legend-item"><span class="chip r2">Score -2</span> Severely Underperforming</div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.print();
          printWindow.close();
        }
      }, 2000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Holistic Assessment</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Comprehensive health system performance evaluation
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time scoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


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

        {/* Enhanced Action Bar */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Left side: Status and indicators */}
            <div className="flex items-center space-x-4">
              {/* Sector score badge */}
              {state.multiPeriodData && state.multiPeriodData.length>0 && state.multiPeriodData[0].sector_score && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Sector Score:</span>
                    <span
                        className="px-3 py-1 rounded-full text-white text-sm font-semibold shadow-sm"
                      style={{ backgroundColor: state.multiPeriodData[0].sector_score.score_color || '#6c757d' }}
                    >
                        {typeof state.multiPeriodData[0].sector_score.overall_score === 'number' ? state.multiPeriodData[0].sector_score.overall_score.toFixed(2) : '-'}
                    </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {state.multiPeriodData[0].sector_score.score_label}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Edit mode indicator */}
              {state.currentAssessmentId && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Editing Assessment
                </Badge>
              )}
            </div>

            {/* Right side: Action buttons */}
            <div className="flex items-center space-x-3">
              {/* Manual Entries Save Button */}
              {hasUnsavedChanges && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div className="flex flex-col mr-3">
                      <span className="text-yellow-800 text-sm">Manual entries not saved to backend</span>
                      <span className="text-yellow-600 text-xs">Save assessment to persist all changes</span>
                    </div>
                    <button
                      onClick={saveManualEntries}
                      disabled={state.loading}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      <Save className="h-3 w-3" />
                      {state.loading ? 'Saving...' : 'Save Locally'}
                    </button>
                  </div>
                </div>
              )}

              {/* File Menu */}
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
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={()=>setIsOpenModal(true)}>
                      Open Assessment
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                       onClick={handleSaveAssessment}
                      disabled={!state.multiPeriodData || state.multiPeriodData.length === 0}
                    >
                      {state.currentAssessmentId ? 'Update Assessment' : 'Save Assessment'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Export Menu */}
              <div className="relative group">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={async ()=>{
                        if (!state.selectedOrgUnits.length || !state.selectedPeriods.length) return;
                        try{
                          const blob = await assessmentService.exportHolisticExcel({
                            org_unit_ids: state.selectedOrgUnits,
                            periods: state.selectedPeriods,
                            include_scores: true,
                          });
                          
                          // Create download link
                          const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                          a.href = url;
                          a.setAttribute('download', `holistic-assessment-${new Date().toISOString().slice(0, 10)}.xlsx`);
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                            toast.success('Excel export generated');
                        }catch(e){
                          console.error('Export Excel error', e);
                          toast.error('Failed to export Excel');
                        }
                      }}
                    >
                      Excel (.xlsx)
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={exportToCSV}
                    >
                      CSV (.csv)
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={exportToPDF}
                    >
                      PDF (print)
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Generate Report Button */}
              <Button 
                onClick={handleGenerateReport}
                disabled={state.isGenerating || state.selectedPeriods.length === 0 || state.selectedOrgUnits.length === 0}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
          </div>

          {/* Enhanced Configuration Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Assessment Configuration
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Organization Units */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Organization Units
                  </label>
                  <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOrgUnitModalOpen(true)}
                  disabled={state.loading}
                      className="w-full justify-start"
                >
                      <Plus className="h-4 w-4 mr-2" />
                      Select Organization Units
                </Button>
                    <div className="flex flex-wrap gap-2">
                  {state.selectedOrgUnits.length ? (
                    state.selectedOrgUnits.map((orgUnitId, index) => {
                      const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
                      return (
                            <Badge key={orgUnitId} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
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
                        <span className="text-sm text-gray-400 italic">No units selected</span>
                  )}
                    </div>
                </div>
              </div>

                {/* Assessment Periods */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Assessment Periods
                  </label>
                  <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPeriodModalOpen(true)}
                  disabled={state.loading}
                      className="w-full justify-start"
                >
                      <Plus className="h-4 w-4 mr-2" />
                  Select Periods
                </Button>
                    <div className="flex flex-wrap gap-2">
                  {state.selectedPeriods.length ? (
                    state.selectedPeriods.map((period, index) => (
                          <Badge key={period.id} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
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
                        <span className="text-sm text-gray-400 italic">No periods selected</span>
                  )}
                </div>
              </div>
              </div>

                {/* Data Source Filter */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Data Source Filter
                  </label>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      size="sm" 
                      variant={indicatorSourceFilter==='all'?'default':'outline'}
                      className={indicatorSourceFilter==='all'? 'bg-blue-600 text-white hover:bg-blue-700':'border-gray-300 text-gray-700 hover:bg-gray-50'}
                      onClick={()=>setIndicatorSourceFilter('all')}
                    >
                      All Sources
                    </Button>
                    <Button 
                      size="sm" 
                      variant={indicatorSourceFilter==='dhis2'?'default':'outline'}
                      className={indicatorSourceFilter==='dhis2'? 'bg-blue-600 text-white hover:bg-blue-700':'border-gray-300 text-gray-700 hover:bg-gray-50'}
                      onClick={()=>setIndicatorSourceFilter('dhis2')}
                    >
                      DHIS2 Only
                    </Button>
                    <Button 
                      size="sm" 
                      variant={indicatorSourceFilter==='manual'?'default':'outline'}
                      className={indicatorSourceFilter==='manual'? 'bg-blue-600 text-white hover:bg-blue-700':'border-gray-300 text-gray-700 hover:bg-gray-50'}
                      onClick={()=>setIndicatorSourceFilter('manual')}
                    >
                      Manual Only
                    </Button>
                  </div>
              </div>
            </div>
          </div>
        </div>



        {/* Enhanced Excel-like Assessment Table */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
                  Assessment Report
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Performance indicators with trend analysis, real-time scoring, and manual data entry
                </CardDescription>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Organization:</span>
                  {state.selectedOrgUnits.length ? (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      {state.dhis2OrgUnitsFlat.find(ou=>ou.id===state.selectedOrgUnits[0])?.displayName || state.selectedOrgUnits[0]}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">None selected</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Periods:</span>
                  {state.selectedPeriods.length ? (
                    <div className="flex items-center gap-1 flex-wrap max-w-[400px]">
                      {state.selectedPeriods.slice(0,3).map(p=> (
                        <span key={p.id} className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">{p.displayName}</span>
                      ))}
                      {state.selectedPeriods.length > 3 && (
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">+{state.selectedPeriods.length-3} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">None selected</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white p-0">
            {state.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
                  <span className="text-gray-600 font-medium">Loading assessment data...</span>
                </div>
              </div>
            ) : state.isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
                  <div className="text-gray-900 font-medium mb-2">Generating assessment report...</div>
                  {state.syncProgress && (
                    <div className="text-sm text-gray-500">
                      {state.syncProgress.message} ({state.syncProgress.current}/{state.syncProgress.total})
                    </div>
                  )}
                </div>
              </div>
            ) : state.multiPeriodData ? (
              <div className="p-6">
                {(() => {
                  const filtered = state.multiPeriodData.map(pd => ({
                    ...pd,
                    objectives: pd.objectives.map(obj => ({
                      ...obj,
                      indicators: obj.indicators.filter((ind:any) => {
                        if (indicatorSourceFilter==='all') return true;
                        const isDHIS2 = Boolean(ind.dhis2_uid);
                        return indicatorSourceFilter==='dhis2' ? isDHIS2 : !isDHIS2;
                      })
                    }))
                  }));
                  return (
                    <ExcelTable
                      multiPeriodData={filtered}
                      selectedPeriods={state.selectedPeriods}
                      onCellEdit={handleManualEntryChange}
                      onScoreChange={handleScoreChange}
                      onMilestoneScoreChange={handleMilestoneScoreChange}
                      onRemarksChange={handleRemarksChange}
                      onMilestoneRemarksChange={handleMilestoneRemarksChange}
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Data</h3>
                <p className="text-gray-600">Generate a report to view comprehensive health system performance data.</p>
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

        <OpenAssessmentModal
          isOpen={isOpenModal}
          onClose={()=>setIsOpenModal(false)}
          onOpenAssessment={async (id)=>{
            await handleLoadAssessment(id);
          }}
          orgUnitId={state.selectedOrgUnits[0]}
        />

        <NameAssessmentModal
          isOpen={isNameModal}
          onClose={()=>setIsNameModal(false)}
          defaultName={pendingSaveName || undefined}
          onConfirm={(name)=>performSave(name)}
        />

        <ConfirmModal
          isOpen={confirmState.open}
          onClose={()=>setConfirmState(prev=>({...prev,open:false}))}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          onConfirm={()=>confirmState.onConfirm?.()}
        />

        {/* Unsaved Changes Modal */}
        {showUnsavedChangesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
              </div>
              <p className="text-gray-600 mb-6">
                You have unsaved manual entries. Would you like to save them before continuing?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleIgnoreAndContinue}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Ignore
                </button>
                <button
                  onClick={handleSaveAndContinue}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
} 