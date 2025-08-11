export interface Indicator {
  id: number;
  name: string;
  dhis2_uid: string;
  indicator_type: 'indicator' | 'dataElement' | 'calculated';
  indicator_type_display: string;
  indicator_number: string;
  display_order: number;
  formula: string;
  numerator: string;
  denominator: string;
  source_of_data: string;
  target_value: number | null;
  target_display: string;
  target_type: 'increase' | 'decrease';
  target_type_display: string;
  min_score: number;
  max_score: number;
  is_active: boolean;
  description: string;
  dhis2_name: string;
  dhis2_description: string;
  created_at: string;
  updated_at: string;
  last_sync: string | null;
  thresholds: IndicatorThreshold[];
  category_mappings: IndicatorCategoryMapping[];
  objective_weights: Array<{
    id: number;
    objective: number;
    weight: number;
  }>;
}

export interface IndicatorThreshold {
  id: number;
  min_value: number;
  max_value: number;
  score: number;
  color: string;
  label: string;
}

export interface IndicatorCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  order: number;
  is_active: boolean;
}

export interface IndicatorCategoryMapping {
  id: number;
  category: IndicatorCategory;
  weight: number;
}

export interface IndicatorListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Indicator[];
}

export interface IndicatorFilters {
  search?: string;
  indicator_type?: string;
  is_active?: boolean;
  target_type?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

class IndicatorService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getIndicators(filters: IndicatorFilters = {}): Promise<IndicatorListResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.indicator_type) queryParams.append('indicator_type', filters.indicator_type);
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    if (filters.target_type) queryParams.append('target_type', filters.target_type);
    if (filters.ordering) queryParams.append('ordering', filters.ordering);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.page_size) queryParams.append('page_size', filters.page_size.toString());

    const endpoint = `/indicators/indicators/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getIndicator(id: number): Promise<Indicator> {
    return this.makeRequest(`/indicators/indicators/${id}/`);
  }

  async createIndicator(data: Partial<Indicator>): Promise<Indicator> {
    return this.makeRequest('/indicators/indicators/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIndicator(id: number, data: Partial<Indicator>): Promise<Indicator> {
    return this.makeRequest(`/indicators/indicators/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIndicator(id: number): Promise<void> {
    return this.makeRequest(`/indicators/indicators/${id}/`, {
      method: 'DELETE',
    });
  }

  async toggleIndicatorActive(id: number): Promise<Indicator> {
    return this.makeRequest(`/indicators/indicators/${id}/toggle_active/`, {
      method: 'POST',
    });
  }

  async syncIndicatorFromDHIS2(id: number, syncData: any): Promise<any> {
    return this.makeRequest(`/indicators/indicators/${id}/sync_from_dhis2/`, {
      method: 'POST',
      body: JSON.stringify(syncData),
    });
  }

  async getCategories(): Promise<IndicatorCategory[]> {
    return this.makeRequest('/indicators/categories/');
  }

  async getThresholds(indicatorId?: number): Promise<IndicatorThreshold[]> {
    const endpoint = indicatorId 
      ? `/indicators/thresholds/?indicator=${indicatorId}`
      : '/indicators/thresholds/';
    return this.makeRequest(endpoint);
  }

  // Helper method to get indicators grouped by objective (for the table display)
  async getIndicatorsForDefinitions(): Promise<{
    objectives: Array<{
      id: number;
      name: string;
      indicators: Indicator[];
    }>;
  }> {
    // Use the new dedicated indicators definitions endpoint
    const response = await this.makeRequest('/configurations/indicators-definitions/');
    
    return {
      objectives: response.objectives || []
    };
  }
}

export const indicatorService = new IndicatorService();
