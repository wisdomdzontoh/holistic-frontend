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
  milestone?: {
    id: number;
    name: string;
    code: string;
    color: string;
    score: number;
    score_color?: string;
    score_label?: string;
    notes?: string;
  };
  indicators: IndicatorData[];
  score?: ObjectiveScoreData;
}

export interface IndicatorData {
  id: number;
  name: string;
  dhis2_uid: string;
  description: string;
  indicator_number: string;
  display_order: number;
  target_value: number | null;
  target_display?: string;
  target_lower_limit?: number | null;
  target_upper_limit?: number | null;
  target_format?: string;
  target_type: string;
  target_operator?: string;
  target_measurement_type?: string;
  weight: number;
  score?: IndicatorScoreData;
  data_values: Record<string, DataValue>;
}

export interface IndicatorScoreData {
  score: number | null;
  score_color: string;
  score_label: string;
  current_value: number | null;
  previous_value: number | null;
  target_gap: number | null;
  percent_change: number | null;
  change_category?: string | null;
  gap_category?: string | null;
  current_meets_target?: boolean | null;
  previous_meets_target?: boolean | null;
  is_manual_override: boolean;
  remarks?: string;
  isLoading?: boolean;
  is_first_year?: string | boolean;
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
  manual_override?: number | null;
  dhis2_value?: number | null;
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

import type { Period, PeriodType } from './dhis2/periods';
export type { Period, PeriodType } from './dhis2/periods';

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

export interface DHIS2OrgUnitGroup {
  id: string;
  name: string;
  shortName?: string;
}

export interface BulkAssessmentJobItemSummary {
  id: number;
  org_unit_id: string;
  org_unit_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  status_display: string;
  saved_assessment_id: number | null;
  error_message: string;
}

export interface BulkAssessmentJobSummary {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';
  status_display: string;
  total_facilities: number;
  processed_facilities: number;
  succeeded_facilities: number;
  failed_facilities: number;
  progress_percentage: number;
  error_message: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const BULK_ASSESSMENT_TERMINAL_STATUSES = new Set(['completed', 'completed_with_errors', 'failed', 'cancelled']);

class AssessmentService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // Session-lifetime cache for slow-changing data (e.g. the org unit hierarchy),
  // so remounting a page doesn't force a fresh round-trip to the backend/DHIS2.
  private requestCache = new Map<string, { data: unknown; expiresAt: number }>();
  private static readonly ORG_UNITS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  private getCached<T>(key: string): T | undefined {
    const entry = this.requestCache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.requestCache.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  private setCached(key: string, data: unknown, ttlMs: number): void {
    this.requestCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

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
    org_unit_names?: string[];
    periods: Period[];
    include_scores?: boolean;
    manual_entries?: Record<number, Record<string, number | null>>;
  }): Promise<AssessmentData[]> {
    const formattedPeriods = params.periods.map(period => ({
      name: period.name,
      period_type: period.periodType,
      start_date: period.startDate,
      end_date: period.endDate,
      code: period.code
    }));

    // Use the new real-time architecture
    return this.makeRequest('/assessments/holistic-assessment/fetch_data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_unit_ids: params.org_unit_ids,
        org_unit_names: params.org_unit_names || [],
        periods: formattedPeriods,
        include_scores: params.include_scores ?? true,
        manual_entries: params.manual_entries || {},
      }),
    });
  }

  async exportHolisticExcel(params: {
    org_unit_ids: string[];
    org_unit_names?: string[];
    periods: Period[];
    include_scores?: boolean;
    manual_entries?: Record<number, Record<string, number | null>>;
    pre_calculated_scores?: Record<number, any>;
  }): Promise<Blob>{
    const formattedPeriods = params.periods.map(period => ({
      name: period.name,
      period_type: period.periodType,
      start_date: period.startDate,
      end_date: period.endDate,
      code: period.code
    }));
    
    const response = await fetch(`${this.baseUrl}/assessments/holistic-assessment/export_excel/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session management
      body: JSON.stringify({
        org_unit_ids: params.org_unit_ids,
        org_unit_names: params.org_unit_names || [],
        periods: formattedPeriods,
        include_scores: params.include_scores ?? true,
        manual_entries: params.manual_entries || {},
        pre_calculated_scores: params.pre_calculated_scores || {},
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  }

  async exportHolisticExcelWithFilename(params: {
    org_unit_ids: string[];
    org_unit_names?: string[];
    periods: Period[];
    include_scores?: boolean;
    manual_entries?: Record<number, Record<string, number | null>>;
    pre_calculated_scores?: Record<number, any>;
  }): Promise<{blob: Blob, filename: string}>{
    const formattedPeriods = params.periods.map(period => ({
      name: period.name,
      period_type: period.periodType,
      start_date: period.startDate,
      end_date: period.endDate,
      code: period.code
    }));
    
    const response = await fetch(`${this.baseUrl}/assessments/holistic-assessment/export_excel/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session management
      body: JSON.stringify({
        org_unit_ids: params.org_unit_ids,
        org_unit_names: params.org_unit_names || [],
        periods: formattedPeriods,
        include_scores: params.include_scores ?? true,
        manual_entries: params.manual_entries || {},
        pre_calculated_scores: params.pre_calculated_scores || {},
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `holistic-assessment-${new Date().toISOString().slice(0, 10)}.xlsx`; // fallback
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    const blob = await response.blob();
    return { blob, filename };
  }

  /**
   * Same export as exportHolisticExcelWithFilename, but kicks off an async job on
   * the backend (returns immediately) and polls for completion, reporting real
   * progress instead of a single opaque wait. Falls back cleanly if the job fails.
   */
  async exportHolisticExcelAsync(
    params: {
      org_unit_ids: string[];
      org_unit_names?: string[];
      periods: Period[];
      include_scores?: boolean;
      manual_entries?: Record<number, Record<string, number | null>>;
      pre_calculated_scores?: Record<number, any>;
    },
    onProgress?: (percent: number, statusLabel: string) => void
  ): Promise<{ blob: Blob; filename: string }> {
    const formattedPeriods = params.periods.map(period => ({
      name: period.name,
      period_type: period.periodType,
      start_date: period.startDate,
      end_date: period.endDate,
      code: period.code,
    }));

    const startResponse = await fetch(`${this.baseUrl}/assessments/holistic-assessment/export_excel_async/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        org_unit_ids: params.org_unit_ids,
        org_unit_names: params.org_unit_names || [],
        periods: formattedPeriods,
        include_scores: params.include_scores ?? true,
        manual_entries: params.manual_entries || {},
        pre_calculated_scores: params.pre_calculated_scores || {},
      }),
    });

    if (!startResponse.ok) {
      throw new Error(`Failed to start export: ${startResponse.statusText}`);
    }

    const { job_id: jobId } = await startResponse.json();
    onProgress?.(0, 'Export started...');

    const pollIntervalMs = 1200;
    const maxAttempts = 150; // ~3 minutes ceiling
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const statusResponse = await fetch(`${this.baseUrl.replace(/\/api$/, '')}/api/exports/jobs/${jobId}/status/`, {
        credentials: 'include',
      });
      if (!statusResponse.ok) {
        continue; // transient error - keep polling until maxAttempts
      }
      const statusData = await statusResponse.json();
      onProgress?.(statusData.progress_percentage ?? 0, statusData.status_display ?? statusData.status);

      if (statusData.status === 'completed') {
        const downloadResponse = await fetch(
          `${this.baseUrl}/assessments/holistic-assessment/download_export_result/?job_id=${jobId}`,
          { credentials: 'include' }
        );
        if (!downloadResponse.ok) {
          throw new Error(`Export completed but download failed: ${downloadResponse.statusText}`);
        }
        const contentDisposition = downloadResponse.headers.get('Content-Disposition');
        let filename = `holistic-assessment-${new Date().toISOString().slice(0, 10)}.xlsx`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
        }
        const blob = await downloadResponse.blob();
        return { blob, filename };
      }

      if (statusData.status === 'failed') {
        throw new Error(statusData.error_message || 'Export job failed');
      }
    }

    throw new Error('Export timed out - please try again');
  }

  async getDHIS2OrgUnitGroups(): Promise<DHIS2OrgUnitGroup[]> {
    const cacheKey = 'dhis2_org_unit_groups';
    const cached = this.getCached<DHIS2OrgUnitGroup[]>(cacheKey);
    if (Array.isArray(cached)) return cached;

    const response = await this.makeRequest('/assessments/management/dhis2-org-unit-groups/');
    const groups = Array.isArray(response.groups) ? response.groups : [];
    this.setCached(cacheKey, groups, AssessmentService.ORG_UNITS_CACHE_TTL_MS);
    return groups;
  }

  /**
   * Start a bulk assessment generation job - the backend resolves target
   * facilities from the group/level (scoped to the current user's own DHIS2
   * org unit access) and processes them sequentially in the background.
   */
  async startBulkAssessmentJob(params: {
    org_unit_group_id: string;
    org_unit_group_name?: string;
    org_unit_level?: number;
    org_unit_level_name?: string;
    periods: Period[];
  }): Promise<{ job_id: number; total_facilities: number }> {
    const formattedPeriods = params.periods.map(period => ({
      code: period.code,
      name: period.name,
    }));

    const response = await fetch(`${this.baseUrl}/assessments/bulk-assessment-jobs/start/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        org_unit_group_id: params.org_unit_group_id,
        org_unit_group_name: params.org_unit_group_name || '',
        org_unit_level: params.org_unit_level ?? null,
        org_unit_level_name: params.org_unit_level_name || '',
        periods: formattedPeriods,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || `Failed to start bulk generation: ${response.statusText}`);
    }
    return response.json();
  }

  async getBulkAssessmentJobStatus(jobId: number): Promise<{ job: BulkAssessmentJobSummary; items: BulkAssessmentJobItemSummary[] }> {
    const response = await this.makeRequest(`/assessments/bulk-assessment-jobs/${jobId}/status/`);
    return { job: response.job, items: response.items };
  }

  async cancelBulkAssessmentJob(jobId: number): Promise<void> {
    await fetch(`${this.baseUrl}/assessments/bulk-assessment-jobs/${jobId}/cancel/`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  async getMyBulkAssessmentJobs(): Promise<BulkAssessmentJobSummary[]> {
    const response = await this.makeRequest('/assessments/bulk-assessment-jobs/my_jobs/');
    return Array.isArray(response.jobs) ? response.jobs : [];
  }

  /**
   * Poll a bulk assessment job until it reaches a terminal status, calling
   * onUpdate on every tick (not just at the end) so a checklist UI can
   * re-render live. Unlike exportHolisticExcelAsync's ~3 minute ceiling, a
   * multi-facility batch can legitimately run much longer, so this uses a
   * longer interval and a much higher attempt ceiling (~30 minutes). Returns
   * a stop function the caller should invoke on unmount to end polling early.
   */
  pollBulkAssessmentJob(
    jobId: number,
    onUpdate: (job: BulkAssessmentJobSummary, items: BulkAssessmentJobItemSummary[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const pollIntervalMs = 2000;
    const maxAttempts = 900; // ~30 minutes
    let stopped = false;
    let attempt = 0;

    const poll = async () => {
      if (stopped) return;
      attempt += 1;
      try {
        const { job, items } = await this.getBulkAssessmentJobStatus(jobId);
        if (stopped) return;
        onUpdate(job, items);
        if (BULK_ASSESSMENT_TERMINAL_STATUSES.has(job.status)) {
          return;
        }
      } catch (error) {
        // Transient network errors shouldn't stop the whole poll loop - keep
        // trying until maxAttempts, same tolerance exportHolisticExcelAsync uses.
        if (attempt >= maxAttempts) {
          onError?.(error instanceof Error ? error : new Error('Polling failed'));
          return;
        }
      }
      if (!stopped && attempt < maxAttempts) {
        setTimeout(poll, pollIntervalMs);
      } else if (!stopped) {
        onError?.(new Error('Stopped polling - this is taking longer than expected. The job is still running in the background.'));
      }
    };

    poll();
    return () => { stopped = true; };
  }

  /** Download an already-generated SavedAssessment (e.g. a bulk-job result) without re-fetching DHIS2. */
  async exportSavedAssessmentExcel(assessmentId: number): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(
      `${this.baseUrl}/assessments/holistic-assessment/export_saved_excel/?assessment_id=${assessmentId}`,
      { credentials: 'include' }
    );
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `assessment-${assessmentId}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
    }
    const blob = await response.blob();
    return { blob, filename };
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

  async getOrgUnits(forceRefresh: boolean = false): Promise<OrgUnit[]> {
    const cacheKey = 'org_units_hierarchy';
    if (!forceRefresh) {
      const cached = this.getCached<OrgUnit[]>(cacheKey);
      // Guard against a previously-cached malformed (non-array) response -
      // `{}` is truthy in JS, so a plain `if (cached)` would trust it.
      if (Array.isArray(cached) && cached.length > 0) return cached;
    }

    // max_depth=5 covers this DHIS2 instance's full hierarchy (National through
    // Facility) so a regional/district-level user's tree isn't cut off before
    // reaching facilities.
    const response = await this.makeRequest('/assessments/management/dhis2-org-units/?hierarchy=true&max_depth=5');
    // response.org_units || [] doesn't catch a non-array truthy value like {} -
    // validate the shape explicitly instead of trusting the backend response.
    const orgUnits = Array.isArray(response.org_units) ? response.org_units : [];
    this.setCached(cacheKey, orgUnits, AssessmentService.ORG_UNITS_CACHE_TTL_MS);
    return orgUnits;
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
    return Array.isArray(response.org_units) ? response.org_units : [];
  }

  async getDHIS2OrgUnitHierarchy(rootId?: string, maxDepth: number = 5): Promise<DHIS2OrgUnit[]> {
    const params = new URLSearchParams();
    params.append('hierarchy', 'true');
    if (rootId) {
      params.append('root_id', rootId);
    }
    params.append('max_depth', maxDepth.toString());

    const response = await this.makeRequest(`/assessments/management/dhis2-org-units/?${params}`);
    return Array.isArray(response.org_units) ? response.org_units : [];
  }

  async getDHIS2OrgUnitDescendants(orgUnitId: string): Promise<DHIS2OrgUnit[]> {
    try {
      const response = await this.makeRequest(`/dhis2-auth/org-units/${orgUnitId}/descendants/`);
      return Array.isArray(response.descendants) ? response.descendants : [];
    } catch (error) {
      console.error('Error fetching DHIS2 org unit descendants:', error);
      return [];
    }
  }

  async getDHIS2OrgUnitChildren(orgUnitId: string): Promise<DHIS2OrgUnit[]> {
    try {
      const response = await this.makeRequest(`/dhis2-auth/org-units/${orgUnitId}/children/`);
      return Array.isArray(response.children) ? response.children : [];
    } catch (error) {
      console.error('Error fetching DHIS2 org unit children:', error);
      return [];
    }
  }

  async getDHIS2OrgUnitById(orgUnitId: string): Promise<DHIS2OrgUnit | null> {
    try {
      const response = await this.makeRequest(`/dhis2-auth/org-units/${orgUnitId}/`);
      return response.org_unit || null;
    } catch (error) {
      console.error('Error fetching DHIS2 org unit by ID:', error);
      return null;
    }
  }

  async triggerDataSync(syncParams: {
    sync_type?: string;
    period_start?: string;
    period_end?: string;
    org_unit_ids?: string[];
    indicator_uids?: string[];
    calculate_scores?: boolean;
    periods?: Period[]; // Add periods parameter for proper period codes
  }): Promise<any> {
    // Use the new real-time architecture instead of the old sync service
    let periods: Array<{
      name: string;
      period_type: string;
      start_date: string;
      end_date: string;
      code: string;
    }> = [];
    
    if (syncParams.periods && syncParams.periods.length > 0) {
      // Use the actual period codes from the periods array
      periods = syncParams.periods.map(period => ({
        name: period.name,
        period_type: period.periodType,
        start_date: period.startDate,
        end_date: period.endDate,
        code: period.code
      }));
    } else if (syncParams.period_start && syncParams.period_end) {
      // Fallback: generate period code from start date (year only)
      const year = new Date(syncParams.period_start).getFullYear();
      periods = [{
        name: `${syncParams.period_start} to ${syncParams.period_end}`,
        period_type: 'custom',
        start_date: syncParams.period_start,
        end_date: syncParams.period_end,
        code: year.toString()
      }];
    }
    
    return this.makeRequest('/assessments/holistic-assessment/fetch_data/', {
      method: 'POST',
      body: JSON.stringify({
        org_unit_ids: syncParams.org_unit_ids || [],
        periods: periods,
        indicator_uids: syncParams.indicator_uids || [],
        include_scores: syncParams.calculate_scores || false
      }),
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



  async saveAssessment(params: {
    name: string;
    org_unit_id: string;
    org_unit_name: string;
    periods: string[];
    indicator_data: Record<string, any>;
    calculated_scores?: Record<string, any>;
    user_notes?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await this.makeRequest('/assessments/holistic/save_assessment/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return response;
  }

  async updateAssessment(params: {
    assessment_id: string;
    name: string;
    org_unit_id: string;
    org_unit_name: string;
    periods: string[];
    indicator_data: Record<string, any>;
    calculated_scores?: Record<string, any>;
    user_notes?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await this.makeRequest(`/assessments/holistic/update_assessment/${params.assessment_id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: params.name,
        org_unit_id: params.org_unit_id,
        org_unit_name: params.org_unit_name,
        periods: params.periods,
        indicator_data: params.indicator_data,
        calculated_scores: params.calculated_scores,
        user_notes: params.user_notes,
        metadata: params.metadata,
      }),
    });
    return response;
  }

  async getSavedAssessments(params: {
    org_unit_id?: string;
    page?: number;
    size?: number;
    search?: string;
    ordering?: 'name'|'-name'|'created_at'|'-created_at';
    owner?: 'mine'; // Users can only access their own assessments for security
  }, signal?: AbortSignal): Promise<{ results: any[]; count: number; page: number; size: number }> {
    const queryParams = new URLSearchParams();
    if (params.org_unit_id) queryParams.append('org_unit_id', params.org_unit_id);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.size) queryParams.append('size', String(params.size));
    if (params.search) queryParams.append('search', params.search);
    if (params.ordering) queryParams.append('ordering', params.ordering);
    // Always send 'mine' for security - users can only see their own assessments
    queryParams.append('owner', 'mine');
    const response = await this.makeRequest(`/assessments/holistic/get_saved_assessments/?${queryParams}`, { signal });
    if (response && typeof response === 'object' && Array.isArray(response.results)) {
      return { results: response.results, count: response.count || response.results.length, page: response.page || 1, size: response.size || response.results.length };
    }
    const list = response?.assessments || response?.results || [];
    return { results: Array.isArray(list) ? list : [], count: Array.isArray(list) ? list.length : 0, page: 1, size: Array.isArray(list) ? list.length : 0 };
  }

  async loadAssessment(params: {
    assessment_id: string;
  }): Promise<any> {
    const response = await this.makeRequest(`/assessments/holistic/get_assessment/${params.assessment_id}/`);
    return response;
  }

  async deleteAssessment(params: { assessment_id: string }): Promise<any> {
    const response = await this.makeRequest(`/assessments/holistic/delete_assessment/${params.assessment_id}/`, {
      method: 'DELETE'
    });
    return response;
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

  async getScoringRules(): Promise<any[]> {
    const response = await this.makeRequest('/configurations/scoring-rules/');
    if (Array.isArray(response)) return response;
    if (response?.results && Array.isArray(response.results)) return response.results;
    return [];
  }

  async updateMilestoneScore(milestoneId: number, score: number, orgUnitId: string, assessmentPeriodId: number, orgUnitName?: string): Promise<any> {
    return this.makeRequest(`/configurations/milestones/${milestoneId}/update_score/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        score,
        org_unit_id: orgUnitId,
        assessment_period_id: assessmentPeriodId,
        org_unit_name: orgUnitName || ''
      }),
    });
  }

  async updateManualIndicatorData(params: {
    indicator_id: number;
    org_unit_id: string;
    assessment_period_id: number;
    data_updates: {
      current_value?: number | null;
      previous_value?: number | null;
      target_value?: number | null;
      percent_change?: number | null;
      target_gap?: number | null;
      score?: number | null;
    };
  }): Promise<any> {
    return this.makeRequest('/assessments/manual-data/update-indicator/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  }

  async bulkUpdateManualData(params: {
    updates: Array<{
      indicator_id: number;
      org_unit_id: string;
      assessment_period_id: number;
      data_updates: {
        current_value?: number | null;
        previous_value?: number | null;
        target_value?: number | null;
        percent_change?: number | null;
        target_gap?: number | null;
        score?: number | null;
      };
    }>;
  }): Promise<any> {
    return this.makeRequest('/assessments/manual-data/bulk-update/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  }

  async overrideIndicatorScore(params: {
    indicator_id: number;
    org_unit_id: string;
    assessment_period_id: number;
    score: number;
    reason?: string;
  }): Promise<any> {
    return this.makeRequest('/assessments/manual-data/override-score/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  }

  async saveManualEntries(params: {
    org_unit_id: string;
    entries: Array<{
      indicator_id: number;
      period: string;
      value: number | null;
    }>;
  }): Promise<any> {
    // For now, we'll just return success since the manual entries are already
    // saved in local state and the real-time scoring is working
    // The actual saving to backend will happen when the user saves the entire assessment
    return Promise.resolve({
      success: true,
      message: 'Manual entries saved locally'
    });
  }

  async calculateScoresForIndicators(params: {
    indicator_ids: number[];
    org_unit_id: string;
    assessment_period_id: number;
  }): Promise<any> {
    return this.makeRequest('/assessments/manual-data/calculate-scores/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
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

  async getAnalysisData(assessmentId: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('assessment_id', assessmentId);
    return this.makeRequest(`/assessments/dashboard/analysis-data/?${params}`);
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
          periodType: 'yearly',
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
          periodType: 'quarterly',
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
          periodType: 'sixmonthly',
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
          periodType: 'sixmonthly',
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
          periodType: 'sixmonthly',
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
          periodType: 'bimonthly',
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
          periodType: 'monthly',
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

/**
 * Calculate real-time score using backend HolisticScoringService
 */
export const calculateRealTimeScore = async (
  indicatorId: number,
  currentValue: number | null,
  previousValue: number | null,
  signal?: AbortSignal
): Promise<{
  success: boolean;
  score_result?: {
    score: number;
    data_provided: string;
    is_first_year: string;
    target_achieved: string;
    change_category: string | null;
    gap_category: string | null;
    percent_change: number | null;
    target_gap: number | null;
    current_value: number | null;
    previous_value: number | null;
    target_value: number | null;
  };
  error?: string;
}> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${baseUrl}/assessments/manual-data-entry/calculate_real_time_score/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '',
      },
      credentials: 'include', // Include cookies for session management
      body: JSON.stringify({
        indicator_id: indicatorId,
        current_value: currentValue,
        previous_value: previousValue
      }),
      signal
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to calculate score'
      };
    }

    return {
      success: true,
      score_result: data.score_result
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error; // let callers distinguish "superseded" from a real failure
    }
    console.error('Error calculating real-time score:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}; 