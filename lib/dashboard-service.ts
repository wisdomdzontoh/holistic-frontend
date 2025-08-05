export interface DashboardSummary {
  totalFacilities: number;
  activeAssessments: number;
  averageScore: number;
  completionRate: number;
  performanceCategories: {
    excellent: number;
    good: number;
    needsImprovement: number;
    poor: number;
  };
  recentActivity: Array<{
    facility: string;
    action: string;
    time: string;
    status: 'success' | 'pending' | 'error' | 'info';
  }>;
}

export interface Assessment {
  id: string;
  facility: string;
  period: string;
  score: number;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  lastUpdated: string;
  indicators: number;
}

export interface Indicator {
  id: string;
  name: string;
  dhis2Uid: string;
  category: string;
  target: number;
  currentValue: number;
  performance: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  lastUpdated: string;
}

class DashboardService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Dashboard Overview
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const data = await this.makeRequest<DashboardSummary>('/assessments/dashboard/summary/');
      return data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      // Return mock data for now
      return {
        totalFacilities: 156,
        activeAssessments: 89,
        averageScore: 4.2,
        completionRate: 78,
        performanceCategories: {
          excellent: 45,
          good: 32,
          needsImprovement: 23,
          poor: 0
        },
        recentActivity: [
          { facility: 'Korle Bu Teaching Hospital', action: 'Assessment completed', time: '2 hours ago', status: 'success' },
          { facility: 'Ridge Hospital', action: 'Assessment started', time: '4 hours ago', status: 'pending' },
          { facility: '37 Military Hospital', action: 'Data updated', time: '6 hours ago', status: 'info' },
          { facility: 'La General Hospital', action: 'Assessment failed', time: '8 hours ago', status: 'error' }
        ]
      };
    }
  }

  // Assessments
  async getAssessments(): Promise<Assessment[]> {
    try {
      const data = await this.makeRequest<Assessment[]>('/assessments/indicator-scores/');
      return data;
    } catch (error) {
      console.error('Error fetching assessments:', error);
      // Return mock data for now
      return [
        {
          id: '1',
          facility: 'Korle Bu Teaching Hospital',
          period: 'Q4-2024',
          score: 4.5,
          status: 'completed',
          lastUpdated: '2024-01-15',
          indicators: 156
        },
        {
          id: '2',
          facility: 'Ridge Hospital',
          period: 'Q4-2024',
          score: 3.8,
          status: 'in_progress',
          lastUpdated: '2024-01-14',
          indicators: 142
        },
        {
          id: '3',
          facility: '37 Military Hospital',
          period: 'Q4-2024',
          score: 4.2,
          status: 'completed',
          lastUpdated: '2024-01-13',
          indicators: 134
        },
        {
          id: '4',
          facility: 'La General Hospital',
          period: 'Q4-2024',
          score: 0,
          status: 'failed',
          lastUpdated: '2024-01-12',
          indicators: 0
        }
      ];
    }
  }

  // Indicators
  async getIndicators(): Promise<Indicator[]> {
    try {
      const data = await this.makeRequest<Indicator[]>('/indicators/');
      return data;
    } catch (error) {
      console.error('Error fetching indicators:', error);
      // Return mock data for now
      return [
        {
          id: '1',
          name: 'EPI - BCG Coverage (%)',
          dhis2Uid: 'abc123',
          category: 'Immunization',
          target: 90,
          currentValue: 85,
          performance: 94.4,
          status: 'good',
          lastUpdated: '2024-01-15'
        },
        {
          id: '2',
          name: 'EPI - Penta 1 Coverage (%)',
          dhis2Uid: 'def456',
          category: 'Immunization',
          target: 90,
          currentValue: 92,
          performance: 102.2,
          status: 'excellent',
          lastUpdated: '2024-01-15'
        },
        {
          id: '3',
          name: 'Maternal Health - ANC Attendance',
          dhis2Uid: 'ghi789',
          category: 'Maternal Health',
          target: 80,
          currentValue: 75,
          performance: 93.8,
          status: 'good',
          lastUpdated: '2024-01-14'
        },
        {
          id: '4',
          name: 'Child Health - Growth Monitoring',
          dhis2Uid: 'jkl012',
          category: 'Child Health',
          target: 70,
          currentValue: 65,
          performance: 92.9,
          status: 'good',
          lastUpdated: '2024-01-13'
        },
        {
          id: '5',
          name: 'Staff Availability - Nurses',
          dhis2Uid: 'mno345',
          category: 'Human Resources',
          target: 100,
          currentValue: 45,
          performance: 45.0,
          status: 'poor',
          lastUpdated: '2024-01-12'
        }
      ];
    }
  }

  // Calculate Scores
  async calculateScores(params: {
    orgUnitIds?: string[];
    assessmentPeriodId?: number;
    objectiveIds?: number[];
    indicatorIds?: number[];
    forceRecalculate?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest<{ success: boolean; message: string }>(
        '/assessments/management/calculate-scores/',
        {
          method: 'POST',
          body: JSON.stringify(params),
        }
      );
      return response;
    } catch (error) {
      console.error('Error calculating scores:', error);
      return { success: false, message: 'Failed to calculate scores' };
    }
  }

  // Sync Data
  async syncData(params: {
    syncType?: string;
    dhis2InstanceUrl?: string;
    periodStart?: string;
    periodEnd?: string;
    orgUnitIds?: string[];
    indicatorUids?: string[];
    calculateScores?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest<{ success: boolean; message: string }>(
        '/assessments/sync-logs/trigger_sync/',
        {
          method: 'POST',
          body: JSON.stringify(params),
        }
      );
      return response;
    } catch (error) {
      console.error('Error syncing data:', error);
      return { success: false, message: 'Failed to sync data' };
    }
  }

  // Export Data
  async exportData(params: {
    format: 'excel' | 'csv' | 'pdf';
    filters: any;
    includeCharts?: boolean;
    includeDetails?: boolean;
  }): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/exports/export/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService(); 