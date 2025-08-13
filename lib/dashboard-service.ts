import { authService } from './auth-service';

export interface DashboardStats {
  total_assessments: number;
  total_facilities: number;
  total_indicators: number;
  total_objectives: number;
  recent_assessments: number;
  average_sector_score: number;
  assessment_growth?: number;
  indicator_growth?: number;
  monthly_assessments?: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
    sep: number;
    oct: number;
    nov: number;
    dec: number;
  };
  chart_stats?: {
    peak_month: string | null;
    peak_count: number;
    average_per_month: number;
    months_with_data: number;
    total_months: number;
  };
  top_performing_facilities: Array<{
    id: string;
    name: string;
    score: number;
    score_color: string;
    score_label: string;
  }>;
  recent_activity: Array<{
  id: string;
    type: 'assessment_created' | 'assessment_updated' | 'data_synced' | 'score_calculated';
    title: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
  performance_summary: {
    excellent: number;
    satisfactory: number;
    needs_improvement: number;
    underperforming: number;
  };
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export class DashboardService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

  async getDashboardStats(): Promise<DashboardStats> {
    return this.makeRequest('/assessments/dashboard/stats/', {
      method: 'GET',
    });
  }

  async getQuickActions(): Promise<QuickAction[]> {
    return this.makeRequest('/assessments/dashboard/quick-actions/', {
      method: 'GET',
    });
  }

  async getRecentAssessments(limit: number = 5): Promise<any[]> {
    return this.makeRequest(`/assessments/dashboard/recent-assessments/?limit=${limit}`, {
      method: 'GET',
    });
  }

  async getPerformanceTrends(periods: number = 4): Promise<any> {
    return this.makeRequest(`/assessments/dashboard/performance-trends/?periods=${periods}`, {
      method: 'GET',
    });
  }
} 