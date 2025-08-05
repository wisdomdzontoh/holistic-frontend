export interface AssessmentData {
  org_unit_id: string;
  org_unit_name: string;
  assessment_period: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  };
  objectives: ObjectiveData[];
  sector_score?: SectorScoreData;
}

export interface ObjectiveData {
  id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  order: number;
  indicators: IndicatorData[];
  score?: ObjectiveScoreData;
}

export interface IndicatorData {
  id: number;
  name: string;
  dhis2_uid: string;
  description: string;
  target_value: number | null;
  target_type: string;
  weight: number;
  score?: IndicatorScoreData;
  data_values: Record<string, DataValue>;
}

export interface IndicatorScoreData {
  score: number;
  score_color: string;
  score_label: string;
  current_value: number | null;
  previous_value: number | null;
  target_gap: number | null;
  percent_change: number | null;
  is_manual_override: boolean;
}

export interface ObjectiveScoreData {
  final_score: number;
  score_color: string;
  score_label: string;
  total_indicators: number;
  scored_indicators: number;
}

export interface SectorScoreData {
  overall_score: number;
  score_color: string;
  score_label: string;
  total_objectives: number;
  scored_objectives: number;
}

export interface DataValue {
  value: number | null;
  calculated_value: number | null;
  created_at: string;
}

export interface AssessmentPeriod {
  id: number;
  name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current: boolean;
}

export interface Period {
  id: string;
  name: string;
  displayName: string;
  startDate: string;
  endDate: string;
  periodType: string;
  code: string;
}

export interface DHIS2RelativePeriod {
  id: string;
  name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  display_name: string;
  source: string;
}

export interface OrgUnit {
  id: string;
  name: string;
  level: number;
  parent_id?: string;
}

export interface DHIS2OrgUnit {
  id: string;
  name: string;
  level: number;
  displayName: string;
  parent?: {
    id: string;
    name: string;
    displayName: string;
  };
  path?: string;
  source?: string;
  children?: DHIS2OrgUnit[];
}

class AssessmentService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getHolisticAssessmentData(assessmentPeriodId?: number): Promise<AssessmentData> {
    const params = new URLSearchParams();
    if (assessmentPeriodId) {
      params.append('assessment_period_id', assessmentPeriodId.toString());
    }
    
    return this.makeRequest(`/assessments/management/holistic-assessment-data/?${params}`);
  }

  async getMultiPeriodAssessmentData(params: {
    org_unit_ids: string[];
    periods: Period[];
    include_scores?: boolean;
  }): Promise<AssessmentData[]> {
    const formattedPeriods = params.periods.map(period => ({
      name: period.name,
      period_type: period.periodType,
      start_date: period.startDate,
      end_date: period.endDate,
      code: period.code
    }));

    return this.makeRequest('/assessments/management/multi-period-assessment-data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_unit_ids: params.org_unit_ids,
        periods: formattedPeriods,
        include_scores: params.include_scores ?? true,
      }),
    });
  }

  async getAssessmentPeriods(): Promise<AssessmentPeriod[]> {
    const response = await this.makeRequest('/configurations/assessment-periods/');
    // Handle different response structures
    if (response && Array.isArray(response)) {
      return response;
    } else if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response && response.results && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  }

  async getDHIS2RelativePeriods(): Promise<DHIS2RelativePeriod[]> {
    const response = await this.makeRequest('/assessments/management/dhis2-relative-periods/');
    
    // Handle different response structures
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response && response.relative_periods && Array.isArray(response.relative_periods)) {
      return response.relative_periods;
    } else if (response && Array.isArray(response)) {
      return response;
    }
    return [];
  }

  async getDHIS2PeriodTypes(): Promise<any[]> {
    const response = await this.makeRequest('/assessments/management/dhis2-period-types/');
    
    // Handle different response structures
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response && response.period_types && Array.isArray(response.period_types)) {
      return response.period_types;
    } else if (response && Array.isArray(response)) {
      return response;
    }
    return [];
  }





  async createAssessmentWithPeriods(params: {
    selected_periods: Period[];
    org_unit_ids: string[];
    assessment_name?: string;
  }): Promise<any> {
    // Convert Period objects to the format expected by the backend
    const formattedPeriods = params.selected_periods.map(period => ({
      name: period.name,
      period_type: period.periodType,
      start_date: period.startDate,
      end_date: period.endDate,
      code: period.code
    }));

    return this.makeRequest('/assessments/management/create_assessment_with_periods/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        selected_periods: formattedPeriods,
      }),
    });
  }

  async testDHIS2Connection(): Promise<any> {
    return this.makeRequest('/assessments/management/test-dhis2-connection/');
  }

  async getOrgUnits(): Promise<OrgUnit[]> {
    return this.makeRequest('/organisation/org-units/');
  }

  async getDHIS2OrgUnits(level?: number, parentId?: string, userOnly: boolean = false): Promise<DHIS2OrgUnit[]> {
    const params = new URLSearchParams();
    if (level !== undefined) {
      params.append('level', level.toString());
    }
    if (parentId) {
      params.append('parent_id', parentId);
    }
    if (userOnly) {
      params.append('user_only', 'true');
    }
    
    const response = await this.makeRequest(`/assessments/management/dhis2-org-units/?${params}`);
    return response.org_units || [];
  }

  async getDHIS2OrgUnitHierarchy(rootId?: string, maxDepth: number = 3): Promise<DHIS2OrgUnit[]> {
    const params = new URLSearchParams();
    params.append('hierarchy', 'true');
    if (rootId) {
      params.append('root_id', rootId);
    }
    params.append('max_depth', maxDepth.toString());
    
    const response = await this.makeRequest(`/assessments/management/dhis2-org-units/?${params}`);
    return response.org_units || [];
  }

  async getDHIS2OrgUnitDescendants(orgUnitId: string): Promise<DHIS2OrgUnit[]> {
    try {
      const response = await this.makeRequest(`/dhis2-auth/org-units/${orgUnitId}/descendants/`);
      return response.descendants || [];
    } catch (error) {
      console.error('Error fetching DHIS2 org unit descendants:', error);
      return [];
    }
  }

  async getDHIS2OrgUnitChildren(orgUnitId: string): Promise<DHIS2OrgUnit[]> {
    try {
      const response = await this.makeRequest(`/dhis2-auth/org-units/${orgUnitId}/children/`);
      return response.children || [];
    } catch (error) {
      console.error('Error fetching DHIS2 org unit children:', error);
      return [];
    }
  }

  async triggerDataSync(syncParams: {
    sync_type?: string;
    period_start?: string;
    period_end?: string;
    org_unit_ids?: string[];
    indicator_uids?: string[];
    calculate_scores?: boolean;
  }): Promise<any> {
    return this.makeRequest('/assessments/sync-logs/trigger_sync/', {
      method: 'POST',
      body: JSON.stringify(syncParams),
    });
  }

  async calculateScores(params: {
    org_unit_ids?: string[];
    assessment_period_id?: number;
    objective_ids?: number[];
    indicator_ids?: number[];
    force_recalculate?: boolean;
  }): Promise<any> {
    return this.makeRequest('/assessments/management/calculate-scores/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async overrideIndicatorScore(
    indicatorScoreId: number,
    overrideData: {
      score: number;
      reason: string;
      score_color?: string;
      score_label?: string;
    }
  ): Promise<any> {
    return this.makeRequest(`/assessments/indicator-scores/${indicatorScoreId}/override_score/`, {
      method: 'POST',
      body: JSON.stringify(overrideData),
    });
  }

  async recalculateIndicatorScore(indicatorScoreId: number): Promise<any> {
    return this.makeRequest(`/assessments/indicator-scores/${indicatorScoreId}/recalculate/`, {
      method: 'POST',
    });
  }

  async exportAssessmentReport(params: {
    org_unit_id: string;
    assessment_period_id?: number;
    format?: 'excel' | 'csv' | 'pdf';
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('org_unit_id', params.org_unit_id);
    if (params.assessment_period_id) {
      queryParams.append('assessment_period_id', params.assessment_period_id.toString());
    }
    if (params.format) {
      queryParams.append('format', params.format);
    }
    
    return this.makeRequest(`/assessments/management/assessment-report/?${queryParams}`);
  }

  async getDashboardSummary(assessmentPeriodId?: number): Promise<any> {
    const params = new URLSearchParams();
    if (assessmentPeriodId) {
      params.append('assessment_period_id', assessmentPeriodId.toString());
    }
    
    return this.makeRequest(`/assessments/dashboard/summary/?${params}`);
  }

  async getObjectiveDashboard(assessmentPeriodId?: number): Promise<any> {
    const params = new URLSearchParams();
    if (assessmentPeriodId) {
      params.append('assessment_period_id', assessmentPeriodId.toString());
    }
    
    return this.makeRequest(`/assessments/dashboard/objectives/?${params}`);
  }

  async getIndicatorDashboard(assessmentPeriodId?: number): Promise<any> {
    const params = new URLSearchParams();
    if (assessmentPeriodId) {
      params.append('assessment_period_id', assessmentPeriodId.toString());
    }
    
    return this.makeRequest(`/assessments/dashboard/indicators/?${params}`);
  }
}

export const assessmentService = new AssessmentService();

/**
 * Generate periods locally for DHIS2 queries
 */
export const generatePeriods = (type: string, baseYear: number): Period[] => {
  const periods: Period[] = [];
  
  switch (type) {
    case 'Yearly':
      // Generate years from 2020 to current year + 5
      for (let y = 2020; y <= baseYear + 5; y++) {
        periods.push({
          id: y.toString(),
          name: y.toString(),
          displayName: y.toString(),
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          periodType: 'Yearly',
          code: y.toString()
        });
      }
      break;

    case 'Quarterly':
      // Generate quarters for the specific year only
      const quarters = [
        { id: 'Q1', name: 'Q1', startMonth: 1, endMonth: 3 },
        { id: 'Q2', name: 'Q2', startMonth: 4, endMonth: 6 },
        { id: 'Q3', name: 'Q3', startMonth: 7, endMonth: 9 },
        { id: 'Q4', name: 'Q4', startMonth: 10, endMonth: 12 }
      ];
      
      quarters.forEach(q => {
        const startDate = `${baseYear}-${q.startMonth.toString().padStart(2, '0')}-01`;
        const endDate = `${baseYear}-${q.endMonth.toString().padStart(2, '0')}-${new Date(baseYear, q.endMonth, 0).getDate()}`;
        
        periods.push({
          id: `${baseYear}${q.id}`,
          name: `${baseYear} ${q.name}`,
          displayName: `${baseYear} ${q.name}`,
          startDate,
          endDate,
          periodType: 'Quarterly',
          code: `${baseYear}${q.id}`
        });
      });
      break;

    case 'SixMonthly':
      // Generate six-monthly periods (Jan-Jun, Jul-Dec) for the specific year only
      const sixMonthlies = [
        { id: 'S1', name: 'SixMonthly 1', startMonth: 1, endMonth: 6 },
        { id: 'S2', name: 'SixMonthly 2', startMonth: 7, endMonth: 12 }
      ];
      
      sixMonthlies.forEach(s => {
        const startDate = `${baseYear}-${s.startMonth.toString().padStart(2, '0')}-01`;
        const endDate = `${baseYear}-${s.endMonth.toString().padStart(2, '0')}-${new Date(baseYear, s.endMonth, 0).getDate()}`;
        
        periods.push({
          id: `${baseYear}${s.id}`,
          name: `${baseYear} ${s.name}`,
          displayName: `${baseYear} ${s.name}`,
          startDate,
          endDate,
          periodType: 'SixMonthly',
          code: `${baseYear}${s.id}`
        });
      });
      break;

    case 'SixMonthlyApril':
      // Generate six-monthly periods starting from April (Apr-Sep, Oct-Mar) for the specific year only
      const sixMonthlyAprils = [
        { id: 'S1', name: 'SixMonthlyApril 1', startMonth: 4, endMonth: 9 },
        { id: 'S2', name: 'SixMonthlyApril 2', startMonth: 10, endMonth: 3, nextYear: true }
      ];
      
      sixMonthlyAprils.forEach(s => {
        const startDate = `${baseYear}-${s.startMonth.toString().padStart(2, '0')}-01`;
        const endYear = s.nextYear ? baseYear + 1 : baseYear;
        const endDate = `${endYear}-${s.endMonth.toString().padStart(2, '0')}-${new Date(endYear, s.endMonth, 0).getDate()}`;
        
        periods.push({
          id: `${baseYear}${s.id}`,
          name: `${baseYear} ${s.name}`,
          displayName: `${baseYear} ${s.name}`,
          startDate,
          endDate,
          periodType: 'SixMonthlyApril',
          code: `${baseYear}${s.id}`
        });
      });
      break;

    case 'SixMonthlyNov':
      // Generate six-monthly periods starting from November (Nov-Apr, May-Oct) for the specific year only
      const sixMonthlyNovs = [
        { id: 'S1', name: 'SixMonthlyNov 1', startMonth: 11, endMonth: 4, nextYear: true },
        { id: 'S2', name: 'SixMonthlyNov 2', startMonth: 5, endMonth: 10 }
      ];
      
      sixMonthlyNovs.forEach(s => {
        const startDate = `${baseYear}-${s.startMonth.toString().padStart(2, '0')}-01`;
        const endYear = s.nextYear ? baseYear + 1 : baseYear;
        const endDate = `${endYear}-${s.endMonth.toString().padStart(2, '0')}-${new Date(endYear, s.endMonth, 0).getDate()}`;
        
        periods.push({
          id: `${baseYear}${s.id}`,
          name: `${baseYear} ${s.name}`,
          displayName: `${baseYear} ${s.name}`,
          startDate,
          endDate,
          periodType: 'SixMonthlyNov',
          code: `${baseYear}${s.id}`
        });
      });
      break;

    case 'BiMonthly':
      // Generate bi-monthly periods (every 2 months) for the specific year only
      for (let i = 1; i <= 6; i++) {
        const startMonth = (i - 1) * 2 + 1;
        const endMonth = startMonth + 1;
        const startDate = `${baseYear}-${startMonth.toString().padStart(2, '0')}-01`;
        const endDate = `${baseYear}-${endMonth.toString().padStart(2, '0')}-${new Date(baseYear, endMonth, 0).getDate()}`;
        
        periods.push({
          id: `${baseYear}${i.toString().padStart(2, '0')}`,
          name: `${baseYear} BiMonthly ${i}`,
          displayName: `${baseYear} BiMonthly ${i}`,
          startDate,
          endDate,
          periodType: 'BiMonthly',
          code: `${baseYear}${i.toString().padStart(2, '0')}`
        });
      }
      break;

    case 'Monthly':
      // Generate monthly periods for the specific year only
      for (let month = 1; month <= 12; month++) {
        const startDate = `${baseYear}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${baseYear}-${month.toString().padStart(2, '0')}-${new Date(baseYear, month, 0).getDate()}`;
        
        periods.push({
          id: `${baseYear}${month.toString().padStart(2, '0')}`,
          name: `${baseYear} Monthly ${month}`,
          displayName: `${baseYear} Monthly ${month}`,
          startDate,
          endDate,
          periodType: 'Monthly',
          code: `${baseYear}${month.toString().padStart(2, '0')}`
        });
      }
      break;
  }
  
  return periods;
};

/**
 * Convert periods to DHIS2 format for API queries
 */
export const periodsToDHIS2Format = (periods: Period[]): string[] => {
  return periods.map(period => period.code);
}; 