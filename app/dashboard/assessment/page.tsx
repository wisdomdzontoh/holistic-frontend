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

  const handleCellEdit = (indicatorId: number, period: string, value: string) => {
    // Update the multiPeriodData with the new cell value
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
      
      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });
  };

  const handleScoreChange = (indicatorId: number, score: string) => {
    // Update the multiPeriodData with the new score
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
      
      const updatedData = withRollups(updatedDataRaw);
      return { ...prev, multiPeriodData: updatedData };
    });
  };

  const handleMilestoneScoreChange = (objectiveId: number, score: string) => {
    // Update the multiPeriodData with the new milestone score
    setState(prev => {
      if (!prev.multiPeriodData) return prev;
      
      const updatedDataRaw = prev.multiPeriodData.map(periodData => ({
        ...periodData,
        objectives: periodData.objectives.map(objective => {
          if (objective.id === objectiveId && objective.milestone) {
            const numScore = parseFloat(score);
            const scoreColor = getScoreColor(numScore);
            const scoreLabel = getScoreLabel(numScore);
            
            return {
              ...objective,
              milestone: {
                ...objective.milestone,
                score: numScore,
                score_color: scoreColor,
                score_label: scoreLabel
              }
            };
          }
          return objective;
        })
      })) as AssessmentData[];

      const updatedData = withRollups(updatedDataRaw);
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
    if (indicator?.score?.is_manual_override) return indicator; // respect manual override
    const last = periods[periods.length - 1]?.name;
    if (!last) return indicator;
    const currVal = indicator?.data_values?.[last]?.value;
    const target = indicator?.target_value;
    if (currVal === undefined || currVal === null) return indicator;

    // Compute change % and gap % for table/export
    const prevName = periods.length > 1 ? periods[periods.length - 2]?.name : undefined;
    const prevVal = prevName ? indicator?.data_values?.[prevName]?.value : undefined;
    const changePct = (function(){
      if (prevVal === undefined || prevVal === null || Number(prevVal) === 0) return undefined as unknown as number;
      const change = ((Number(currVal) - Number(prevVal)) / Math.abs(Number(prevVal))) * 100;
      return isFinite(change) ? Number(change.toFixed(1)) : undefined as unknown as number;
    })();
    const gapPct = (function(){
      if (target === null || target === undefined || Number(target) === 0) return undefined as unknown as number;
      const targetType = (indicator?.target_type || 'increase').toLowerCase();
      const ratio = Number(currVal) / Number(target);
      const gap = targetType === 'increase' ? (ratio - 1) * 100 : (1 - ratio) * 100;
      return isFinite(gap) ? Number(gap.toFixed(1)) : undefined as unknown as number;
    })();

    const findRuleScore = () => {
      if (!scoringRules || !Array.isArray(scoringRules) || scoringRules.length === 0) return undefined as unknown as number;
      const prevName = periods.length > 1 ? periods[periods.length - 2]?.name : undefined;
      const prevVal = prevName ? indicator?.data_values?.[prevName]?.value : undefined;
      const targetType = (indicator?.target_type || 'increase').toLowerCase();

      const calcGap = () => {
        if (target === null || target === undefined || Number(target) === 0) return undefined as unknown as number;
        const ratio = Number(currVal) / Number(target);
        return targetType === 'increase' ? (ratio - 1) * 100 : (1 - ratio) * 100;
      };
      const calcChange = () => {
        if (prevVal === undefined || prevVal === null || Number(prevVal) === 0) return undefined as unknown as number;
        return ((Number(currVal) - Number(prevVal)) / Math.abs(Number(prevVal))) * 100;
      };

      const absoluteValue = Number(currVal);
      const gapPct = calcGap();
      const changePct = calcChange();

      const pick = (perfType: string, metric: number | undefined) => {
        if (metric === undefined || isNaN(metric as number)) return undefined as unknown as number;
        const pool = scoringRules.filter((r: any) => (r.performance_type || r.performanceType) === perfType);
        if (pool.length === 0) return undefined as unknown as number;
        pool.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
        const matched = pool.find((r: any) => {
          const min = r.min_value ?? r.minValue; const max = r.max_value ?? r.maxValue;
          const minOk = min === null || min === undefined || metric >= Number(min);
          const maxOk = max === null || max === undefined || metric <= Number(max);
          return minOk && maxOk;
        });
        return matched ? Number(matched.score) : undefined;
      };

      return (
        pick('gap', gapPct) ?? pick('change', changePct) ?? pick('absolute', absoluteValue)
      ) as number;
    };

    let derivedScore = findRuleScore();
    if (derivedScore === undefined || isNaN(derivedScore as number)) {
      if (target === null || target === undefined) return indicator;
      const type = (indicator?.target_type || 'increase').toLowerCase();
      if (type === 'increase') {
        const ratio = Number(target) === 0 ? 0 : Number(currVal) / Number(target);
        derivedScore = ratio >= 1.05 ? 2 : ratio >= 1.0 ? 1 : ratio >= 0.9 ? 0 : ratio >= 0.7 ? -1 : -2;
      } else {
        const ratio = Number(target) === 0 ? 0 : Number(currVal) / Number(target);
        derivedScore = ratio <= 0.95 ? 2 : ratio <= 1.0 ? 1 : ratio <= 1.1 ? 0 : ratio <= 1.3 ? -1 : -2;
      }
    }
    const scoreColor = getScoreColor(derivedScore as number);
    const scoreLabel = getScoreLabel(derivedScore as number);
    return {
      ...indicator,
      score: {
        ...(indicator.score || {}),
        score: derivedScore as number,
        score_color: scoreColor,
        score_label: scoreLabel,
        is_manual_override: false,
        percent_change: changePct,
        target_gap: gapPct,
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
      
      // Extract indicator data
      const indicatorData: Record<string, any> = {};
      state.multiPeriodData.forEach(periodData => {
        periodData.objectives.forEach(objective => {
          objective.indicators.forEach(indicator => {
            const key = `${indicator.id}`;
            indicatorData[key] = {
              name: indicator.name,
              dhis2_uid: indicator.dhis2_uid,
              target_value: indicator.target_value,
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
              score: objective.milestone.score ?? -2
            };
          }
        });
      });

      const saveData = {
        name: assessmentName,
        org_unit_id: orgUnitId,
        org_unit_name: orgUnitName,
        periods: periods,
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
          sector_score: state.multiPeriodData[0]?.sector_score
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

      const loadedPeriods: Period[] = (saved?.periods || []).map((name: string, idx: number) => ({
        id: String(idx + 1),
        name,
        displayName: name,
        startDate: '',
        endDate: '',
        periodType: 'yearly',
        code: name,
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
        indicatorsByObjective[objId].push({
          id: Number(key),
          name: ind.name,
          dhis2_uid: ind.dhis2_uid,
          description: '',
          indicator_number: ind.indicator_number || '',
          display_order: ind.display_order || 0,
          target_value: ind.target_value ?? null,
          target_type: ind.target_type || 'increase',
          weight: 1,
          score: ind.score,
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

      setState((prev) => ({
        ...prev,
        selectedOrgUnits: saved?.org_unit_id ? [saved.org_unit_id] : prev.selectedOrgUnits,
        selectedPeriods: loadedPeriods.length ? loadedPeriods : prev.selectedPeriods,
        multiPeriodData: multi,
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
    if (!state.multiPeriodData || state.multiPeriodData.length === 0) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const org = state.dhis2OrgUnitsFlat.find(ou=>ou.id===state.selectedOrgUnits[0])?.displayName || 'Org Unit';
    const periods = state.selectedPeriods.map(p=>p.displayName).join(', ');
    const style = `
      <style>
        body{font-family: Arial, sans-serif; padding:16px;}
        h2{margin:0 0 6px 0}
        .meta{color:#555;margin-bottom:12px}
        table{border-collapse:collapse;width:100%; font-size:12px}
        th,td{border:1px solid #ddd;padding:4px 6px}
        th{background:#f5f5f5;text-align:left}
        .obj{background:#fff3e0;font-weight:bold}
        .ms{background:#fff8e1;font-weight:bold}
        .score{-webkit-print-color-adjust: exact; print-color-adjust: exact; color:#fff; font-weight:bold; text-align:center}
        .score.g{background:#28a745}
        .score.y{background:#ffc107}
        .score.o{background:#fd7e14}
        .score.r{background:#dc3545}
        .legend{margin-top:12px}
        .chip{display:inline-block;padding:2px 6px;border-radius:4px;color:#fff;margin-right:6px;font-size:11px}
        .chip.g{background:#28a745}
        .chip.y{background:#ffc107;color:#333}
        .chip.o{background:#fd7e14}
        .chip.r{background:#dc3545}
        @media print {
          .score{color:#fff !important}
        }
      </style>`;
    let html = `<h2>Assessment Report</h2><div class="meta">${org} &middot; Periods: ${periods} &middot; Generated: ${new Date().toLocaleString()}</div>`;
    html += '<table><thead><tr><th>#</th><th>Indicator</th>' + state.selectedPeriods.map(p=>`<th>${p.displayName}</th>`).join('') + '<th>Change</th><th>P-T Gap</th><th>Target</th><th>Score</th></tr></thead><tbody>';
    state.multiPeriodData[0].objectives.forEach((obj, oi) => {
      html += `<tr class=\"obj\"><td colspan=\"${2 + state.selectedPeriods.length + 4}\">Objective ${oi+1}: ${obj.name}</td></tr>`;
      obj.indicators.forEach((ind: any, ii:number)=>{
        html += '<tr>';
        html += `<td>${oi+1}.${ii+1}</td><td>${ind.name}</td>`;
        state.selectedPeriods.forEach(p=>{
          const v = ind?.data_values?.[p.name]?.value ?? '';
          html += `<td>${v}</td>`;
        });
        const chCalc = (function(){
          const lastName = state.selectedPeriods[state.selectedPeriods.length-1].name;
          const prevName = state.selectedPeriods.length>1 ? state.selectedPeriods[state.selectedPeriods.length-2].name : undefined;
          const currVal = Number(ind?.data_values?.[lastName]?.value ?? NaN);
          const prevVal = prevName ? Number(ind?.data_values?.[prevName]?.value ?? NaN) : NaN;
          if (!isFinite(currVal) || !isFinite(prevVal) || prevVal === 0) return '';
          const change = ((currVal - prevVal)/Math.abs(prevVal))*100;
          return isFinite(change) ? change.toFixed(1)+'%' : '';
        })();
        const gapCalc = (function(){
          const lastName = state.selectedPeriods[state.selectedPeriods.length-1].name;
          const currVal = Number(ind?.data_values?.[lastName]?.value ?? NaN);
          const target = Number(ind?.target_value ?? NaN);
          if (!isFinite(currVal) || !isFinite(target) || target === 0) return '';
          const targetType=(ind?.target_type||'increase').toLowerCase();
          const ratio = currVal/target;
          const gap = targetType==='increase' ? (ratio-1)*100 : (1-ratio)*100;
          return isFinite(gap) ? gap.toFixed(1)+'%' : '';
        })();
        const s = Number(ind?.score?.score);
        const cls = isNaN(s) ? '' : (s>=1?'g':(s>=0?'y':(s>=-1?'o':'r')));
        html += `<td>${chCalc}</td><td>${gapCalc}</td><td>${ind.target_value ?? ''}</td><td class="score ${cls}">${ind?.score?.score ?? ''}</td>`;
        html += '</tr>';
      });
      if ((obj as any).milestone?.name){
        const ms = (obj as any).milestone;
        html += `<tr class="ms"><td>MS</td><td>Milestone for ${obj.name}</td>`;
        html += state.selectedPeriods.map(()=>'<td></td>').join('');
        html += `<td></td><td></td><td></td><td>${ms.score ?? ''}</td></tr>`;
      }
    });
    html += '</tbody></table>';
    html += '<div class="legend">'
      + '<div><span class="chip g">>= +1</span> Highly Performing</div>'
      + '<div><span class="chip y">0..&lt;+1</span> Sustained</div>'
      + '<div><span class="chip o">-1..&lt;0</span> Underperforming</div>'
      + '<div><span class="chip r">&lt; -1</span> Severely Underperforming</div>'
      + '</div>';
    w.document.write('<!doctype html><html><head><meta charset="utf-8">'+style+'</head><body>'+html+'</body></html>');
    w.document.close();
    w.focus();
    w.print();
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
            <div className="flex items-center space-x-3">
              
              {/* Sector score badge */}
              {state.multiPeriodData && state.multiPeriodData.length>0 && state.multiPeriodData[0].sector_score && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: state.multiPeriodData[0].sector_score.score_color || '#6c757d' }}
                    >
                      Sector: {typeof state.multiPeriodData[0].sector_score.overall_score === 'number' ? state.multiPeriodData[0].sector_score.overall_score.toFixed(2) : '-'}
                    </span>
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
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={exportToCSV}>
                      Export to CSV
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={exportToPDF}>
                      Export to PDF (print)
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={async ()=>{
                        if (!state.selectedOrgUnits.length || !state.selectedPeriods.length) return;
                        try{
                          const res = await assessmentService.exportHolisticExcel({
                            org_unit_ids: state.selectedOrgUnits,
                            periods: state.selectedPeriods,
                            include_scores: true,
                          });
                          const url = res?.file_url || res?.file_path;
                          if (url) {
                            // ensure absolute URL for direct download
                            const href = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
                            const a = document.createElement('a');
                            a.href = href;
                            a.setAttribute('download', href.split('/').pop() || 'assessment.xlsx');
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success('Excel export generated');
                          }
                        }catch(e){
                          console.error('Export Excel error', e);
                          toast.error('Failed to export Excel');
                        }
                      }}
                    >
                      Export to Excel (.xlsx)
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Options menu removed to simplify UI */}
              
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
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={async ()=>{
                        if (!state.selectedOrgUnits.length || !state.selectedPeriods.length) return;
                        try{
                          const res = await assessmentService.exportHolisticExcel({
                            org_unit_ids: state.selectedOrgUnits,
                            periods: state.selectedPeriods,
                            include_scores: true,
                          });
                          const url = res?.file_url || res?.file_path;
                          if (url) {
                            const href = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
                            const a = document.createElement('a');
                            a.href = href;
                            a.setAttribute('download', href.split('/').pop() || 'assessment.xlsx');
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success('Excel export generated');
                          }
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
              
              {/* Reload button removed to reduce clutter */}
            </div>
            
          </div>

          {/* Pivot-style selection toolbar */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filters: Org Units */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex items-center"><Building2 className="h-4 w-4 mr-1" /> Filter:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOrgUnitModalOpen(true)}
                  disabled={state.loading}
                  className="text-xs"
                >
                  Select Units
                </Button>
                <div className="flex flex-wrap items-center gap-1 max-w-[32rem]">
                  {state.selectedOrgUnits.length ? (
                    state.selectedOrgUnits.map((orgUnitId, index) => {
                      const orgUnit = state.dhis2OrgUnitsFlat.find(ou => ou.id === orgUnitId);
                      return (
                        <Badge key={orgUnitId} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 h-6 text-[10px]">
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
                    <span className="text-xs text-gray-400 italic">None</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <span className="hidden md:inline-block h-6 border-l border-gray-200 mx-1" />

              {/* Columns: Periods */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex items-center"><Clock className="h-4 w-4 mr-1" /> Columns:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPeriodModalOpen(true)}
                  disabled={state.loading}
                  className="text-xs"
                >
                  Select Periods
                </Button>
                <div className="flex flex-wrap items-center gap-1 max-w-[28rem]">
                  {state.selectedPeriods.length ? (
                    state.selectedPeriods.map((period, index) => (
                      <Badge key={period.id} variant="secondary" className="bg-green-50 text-green-700 border-green-200 h-6 text-[10px]">
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
                    <span className="text-xs text-gray-400 italic">None</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <span className="hidden md:inline-block h-6 border-l border-gray-200 mx-1" />

              {/* Source filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Source:</span>
                <Button size="sm" variant={indicatorSourceFilter==='all'?'default':'outline'}
                  className={indicatorSourceFilter==='all'? 'bg-blue-600 text-white':'border-gray-300 text-gray-700'}
                  onClick={()=>setIndicatorSourceFilter('all')}>All</Button>
                <Button size="sm" variant={indicatorSourceFilter==='dhis2'?'default':'outline'}
                  className={indicatorSourceFilter==='dhis2'? 'bg-blue-600 text-white':'border-gray-300 text-gray-700'}
                  onClick={()=>setIndicatorSourceFilter('dhis2')}>DHIS2</Button>
                <Button size="sm" variant={indicatorSourceFilter==='manual'?'default':'outline'}
                  className={indicatorSourceFilter==='manual'? 'bg-blue-600 text-white':'border-gray-300 text-gray-700'}
                  onClick={()=>setIndicatorSourceFilter('manual')}>Manual</Button>
              </div>

              {/* Right side: status */}
              <div className="ml-auto text-xs text-gray-500 flex items-center gap-2">
                {state.loading && (
                  <span className="flex items-center"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Loading…</span>
                )}
                {state.multiPeriodData && state.multiPeriodData.length>0 && state.multiPeriodData[0].sector_score && (
                  <span className="flex items-center gap-1">
                    <span>Sector:</span>
                    <span
                      className="px-2 py-1 rounded text-white"
                      style={{ backgroundColor: state.multiPeriodData[0].sector_score.score_color || '#6c757d' }}
                    >
                      {typeof state.multiPeriodData[0].sector_score.overall_score === 'number' ? state.multiPeriodData[0].sector_score.overall_score.toFixed(2) : '-'}
                    </span>
                  </span>
                )}
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
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Org unit:</span>
                  {state.selectedOrgUnits.length ? (
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {state.dhis2OrgUnitsFlat.find(ou=>ou.id===state.selectedOrgUnits[0])?.displayName || state.selectedOrgUnits[0]}
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Periods:</span>
                  {state.selectedPeriods.length ? (
                    <div className="flex items-center gap-1 flex-wrap max-w-[380px]">
                      {state.selectedPeriods.slice(0,3).map(p=> (
                        <span key={p.id} className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">{p.displayName}</span>
                      ))}
                      {state.selectedPeriods.length > 3 && (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">+{state.selectedPeriods.length-3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
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
                      onCellEdit={handleCellEdit}
                      onScoreChange={handleScoreChange}
                      onMilestoneScoreChange={handleMilestoneScoreChange}
                    />
                  );
                })()}
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
      </div>
    </DashboardLayout>
  );
} 