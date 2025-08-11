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
  Filter
} from 'lucide-react';

export default function IndicatorsPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const mockIndicators = [
    {
      id: '1.1',
      name: 'Average revenue per OPD patient',
      definition: 'Average Cost per patient attending OPD in the Region',
      numerator: 'Total OPD revenue- IGF (OPD Revenue Category)',
      denominator: 'Total OPD attendance',
      calculation: '(N/D)',
      source: 'Financial Report/DHIMS2',
      target: '15',
      isHighlighted: false
    },
    {
      id: '1.2',
      name: 'Proportion of NHIS claims submitted on time.',
      definition: 'The total amount of internally generated funds spent on personal emolument relative to the total internally generated funds received',
      numerator: 'Total number of rejected claims from all health facilities(Public)',
      denominator: 'Total amount of NHIS claims submitted by ALL public facilities',
      calculation: '(N/D)*100',
      source: 'Regional National Health Insurance Report',
      target: '5%',
      isHighlighted: false
    },
    {
      id: '1.3',
      name: 'Percentage of budget allocated to research',
      definition: 'Proportion of health budget allocated to research activities',
      numerator: 'Total amount of budget allocated to research',
      denominator: 'Total health budget(goods and services)',
      calculation: '(N/D) X 100',
      source: 'Financial Report/PBMIS',
      target: '5%',
      isHighlighted: false
    },
    {
      id: '1.4',
      name: 'Percentage of Quarterly Internal Audits reports available (Sub Districts)',
      definition: 'Proportion of quarterly internal audit reports available for sub-districts',
      numerator: 'Total number of Quarterly Internal Audits report available (Sub Districts)',
      denominator: 'Total number of expected quarterly internal audit reports (Sub Districts)',
      calculation: '(N/D) X 100',
      source: 'Audit reports',
      target: '75.0%',
      isHighlighted: true
    },
    {
      id: '1.5',
      name: 'Percentage of internal and external audits recommendations implemented',
      definition: 'Proportion of audit recommendations that have been implemented',
      numerator: 'Total number of internal and external audit recommendations implemented',
      denominator: 'Total number of internal and external audit recommendations',
      calculation: '(N/D) X 100',
      source: 'Management Letter/internal audit/Audit committee reports',
      target: '80%',
      isHighlighted: true
    },
    {
      id: '1.6',
      name: 'Percentage of DHDs Districts with Budgets for Goods and Services captured into PBMIS',
      definition: 'Proportion of districts with budgets captured in the PBMIS system',
      numerator: 'Total number of DHDs Districts with Budgets for Goods and Services captured into PBMIS',
      denominator: 'Total number of DHDs Districts',
      calculation: '(N/D) X 100',
      source: 'PBMIS/DHIMS2',
      target: '40.0%',
      isHighlighted: true
    },
    {
      id: '1.7',
      name: 'Total estimated protection by contraceptive methods supplied (Couple Year Protection (CYP) for long term)',
      definition: 'Total contraceptive protection provided through long-term methods',
      numerator: 'SUM (CYP of all long term devices)',
      denominator: 'N/A',
      calculation: 'SUM (CYP of all long term devices)',
      source: 'DHIMS2',
      target: '350,000',
      isHighlighted: true
    }
  ];

  const filteredIndicators = mockIndicators.filter(indicator => {
    return indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           indicator.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
           indicator.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gray-200 min-h-screen">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
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
                Export
              </Button>
              <Button style={{ backgroundColor: '#154360' }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Indicator
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
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="all">All Indicators</option>
                <option value="highlighted">Highlighted</option>
                <option value="financial">Financial</option>
                <option value="health">Health</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#154360' }} className="text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '15%' }}>
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
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm" style={{ width: '15%' }}>
                    Source of Data
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-sm" style={{ width: '10%' }}>
                    Target
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Objective Header Row */}
                <tr className="bg-orange-100">
                  <td colSpan={7} className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">
                    Objective 1: Universal access to better & efficiently managed quality healthcare services
                  </td>
                </tr>
                
                {/* Indicator Rows */}
                {filteredIndicators.map((indicator, index) => (
                  <tr key={indicator.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      <div className={`font-medium ${indicator.isHighlighted ? 'text-red-600' : 'text-gray-900'}`}>
                        {indicator.id} {indicator.name}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">
                      <div className={`${indicator.isHighlighted ? 'text-red-600' : 'text-gray-700'}`}>
                        {indicator.definition}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {indicator.numerator}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {indicator.denominator}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-700">
                      {indicator.calculation}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                      {indicator.source}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                      <div className={`font-medium ${indicator.isHighlighted ? 'text-red-600' : 'text-gray-900'}`}>
                        {indicator.target}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredIndicators.length} of {mockIndicators.length} indicators
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Highlighted indicators require attention</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
