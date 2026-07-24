'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Plus, 
  Download,
  Filter, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { indicatorService, Indicator } from '@/lib/indicator-service';
import { toast } from 'sonner';

export default function IndicatorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [objectives, setObjectives] = useState<Array<{
    id: number;
    name: string;
    indicators: Indicator[];
  }>>([]);

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await indicatorService.getIndicatorsForDefinitions();
      setObjectives(data.objectives);
      
      // Flatten all indicators for search functionality
      const allIndicators = data.objectives.flatMap(obj => obj.indicators);
      setIndicators(allIndicators);
      
    } catch (err) {
      console.error('Failed to fetch indicators:', err);
      setError('Failed to load indicator definitions. Please try again.');
      toast.error('Failed to load indicator definitions');
    } finally {
      setLoading(false);
    }
  };

  // Filter indicators based on search term and filter type
  const getFilteredObjectives = () => {
    return objectives.map(objective => {
      const filteredIndicators = objective.indicators.filter(indicator => {
        const matchesSearch = searchTerm === '' || 
          indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          indicator.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          indicator.indicator_number.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterType === 'all' || 
          (filterType === 'active' && indicator.is_active) ||
          (filterType === 'inactive' && !indicator.is_active) ||
          (filterType === 'dhis2' && indicator.dhis2_uid) ||
          (filterType === 'calculated' && indicator.indicator_type === 'calculated');
        
        return matchesSearch && matchesFilter;
      });
      
      return {
        ...objective,
        indicators: filteredIndicators
      };
    }).filter(objective => objective.indicators.length > 0);
  };

  const filteredObjectives = getFilteredObjectives();
  const totalIndicators = indicators.length;
  const filteredIndicatorsCount = filteredObjectives.flatMap(obj => obj.indicators).length;

  if (loading) {
  return (
      <DashboardLayout>
        <div className="p-6 bg-gray-200 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
              <p className="text-gray-600">Loading indicator definitions...</p>
                </div>
              </div>
            </div>
      </DashboardLayout>
    );
  }

  if (error) {
                return (
      <DashboardLayout>
        <div className="p-6 bg-gray-200 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchIndicators} style={{ backgroundColor: 'var(--brand-navy)' }}>
                Try Again
              </Button>
                      </div>
                    </div>
                  </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-200 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Indicator Definitions</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive list of health indicators and their definitions
              </p>
            </div>
                        <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
            </Button>
          </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filter by:</span>
            <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Indicators</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="dhis2">DHIS2 Indicators</option>
                <option value="calculated">Calculated Indicators</option>
            </select>
            </div>
          </div>
          </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--brand-navy)' }} className="text-white">
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm" style={{ width: '8%' }}>
                    #
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '20%' }}>
                    Indicator
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '20%' }}>
                    Definition
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '15%' }}>
                    Numerator (N)
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '15%' }}>
                    Denominator (D)
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-sm" style={{ width: '10%' }}>
                    Calculation
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '12%' }}>
                    Source of Data
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-sm" style={{ width: '10%' }}>
                    Target
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredObjectives.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      {searchTerm || filterType !== 'all' 
                        ? 'No indicators match your search criteria' 
                        : 'No indicators found. Add some indicators to get started.'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredObjectives.map((objective) => (
                    <React.Fragment key={objective.id}>
                      {/* Objective Header Row */}
                      <tr className="bg-accent-gold-pale">
                        <td colSpan={8} className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">
                          {objective.name}
                        </td>
                      </tr>
                      
                      {/* Indicator Rows */}
                      {objective.indicators
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((indicator) => (
                        <tr key={indicator.id} className="hover:bg-gray-50">
                          {/* Number column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                            <div className={`font-medium ${!indicator.is_active ? 'text-red-600' : 'text-gray-900'}`}>
                              {indicator.indicator_number || `${objective.id}.${indicator.display_order || indicator.id}`}
                            </div>
                          </td>
                          {/* Indicator name column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm">
                            <div className={`font-medium ${!indicator.is_active ? 'text-red-600' : 'text-gray-900'}`}>
                              {indicator.name}
                            </div>
                            {indicator.dhis2_uid && (
                              <div className="text-xs text-brand-teal mt-1">
                                DHIS2: {indicator.dhis2_uid}
                              </div>
                            )}
                          </td>
                          {/* Definition column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm">
                            <div className={`${!indicator.is_active ? 'text-red-600' : 'text-gray-700'}`}>
                              {indicator.description || 'No definition available'}
                            </div>
                          </td>
                          {/* Numerator column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {indicator.numerator || 'N/A'}
                          </td>
                          {/* Denominator column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {indicator.denominator || 'N/A'}
                          </td>
                          {/* Calculation column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-700">
                            {indicator.formula || 'N/A'}
                          </td>
                          {/* Source of Data column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                            {indicator.source_of_data || 'N/A'}
                          </td>
                          {/* Target column */}
                          <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                            <div className={`font-medium ${!indicator.is_active ? 'text-red-600' : 'text-gray-900'}`}>
                              {indicator.target_display || (indicator.target_value ? indicator.target_value.toString() : 'N/A')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>

        {/* Table Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <div>
            Showing {filteredIndicatorsCount} of {totalIndicators} indicators
                      </div>
          <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Inactive indicators are highlighted in red</span>
                      </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-brand-teal rounded"></div>
              <span>DHIS2 indicators show UID</span>
                        </div>
                      </div>
                      </div>
          </div>
    </DashboardLayout>
  );
} 
