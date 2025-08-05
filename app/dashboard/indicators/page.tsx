'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Filter, 
  Search, 
  Eye, 
  Edit, 
  Download, 
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

interface Indicator {
  id: string;
  name: string;
  dhis2Uid: string;
  category: string;
  objective: string;
  target: number;
  currentValue: number;
  performance: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  lastUpdated: string;
  weight: number;
  trend: 'up' | 'down' | 'stable';
  facilities: number;
  active: boolean;
}

const mockIndicators: Indicator[] = [
  {
    id: '1',
    name: 'EPI - BCG Coverage (%)',
    dhis2Uid: 'abc123',
    category: 'Immunization',
    objective: 'Objective 1: Maternal and Child Health',
    target: 90,
    currentValue: 85,
    performance: 94.4,
    status: 'good',
    lastUpdated: '2024-01-15',
    weight: 1.0,
    trend: 'up',
    facilities: 156,
    active: true
  },
  {
    id: '2',
    name: 'EPI - Penta 1 Coverage (%)',
    dhis2Uid: 'def456',
    category: 'Immunization',
    objective: 'Objective 1: Maternal and Child Health',
    target: 90,
    currentValue: 92,
    performance: 102.2,
    status: 'excellent',
    lastUpdated: '2024-01-15',
    weight: 1.0,
    trend: 'up',
    facilities: 152,
    active: true
  },
  {
    id: '3',
    name: 'Maternal Health - ANC Attendance',
    dhis2Uid: 'ghi789',
    category: 'Maternal Health',
    objective: 'Objective 1: Maternal and Child Health',
    target: 80,
    currentValue: 75,
    performance: 93.8,
    status: 'good',
    lastUpdated: '2024-01-14',
    weight: 1.2,
    trend: 'stable',
    facilities: 148,
    active: true
  },
  {
    id: '4',
    name: 'Child Health - Growth Monitoring',
    dhis2Uid: 'jkl012',
    category: 'Child Health',
    objective: 'Objective 1: Maternal and Child Health',
    target: 70,
    currentValue: 65,
    performance: 92.9,
    status: 'good',
    lastUpdated: '2024-01-13',
    weight: 0.8,
    trend: 'up',
    facilities: 142,
    active: true
  },
  {
    id: '5',
    name: 'Staff Availability - Nurses',
    dhis2Uid: 'mno345',
    category: 'Human Resources',
    objective: 'Objective 2: Health Workforce',
    target: 100,
    currentValue: 45,
    performance: 45.0,
    status: 'poor',
    lastUpdated: '2024-01-12',
    weight: 1.5,
    trend: 'down',
    facilities: 134,
    active: true
  },
  {
    id: '6',
    name: 'Infrastructure - Clean Water Access',
    dhis2Uid: 'pqr678',
    category: 'Infrastructure',
    objective: 'Objective 3: Health Infrastructure',
    target: 95,
    currentValue: 88,
    performance: 92.6,
    status: 'good',
    lastUpdated: '2024-01-11',
    weight: 1.0,
    trend: 'up',
    facilities: 138,
    active: true
  },
  {
    id: '7',
    name: 'Quality - Patient Satisfaction',
    dhis2Uid: 'stu901',
    category: 'Quality of Care',
    objective: 'Objective 4: Quality Improvement',
    target: 85,
    currentValue: 82,
    performance: 96.5,
    status: 'excellent',
    lastUpdated: '2024-01-10',
    weight: 1.3,
    trend: 'up',
    facilities: 144,
    active: true
  },
  {
    id: '8',
    name: 'Financial - Budget Utilization',
    dhis2Uid: 'vwx234',
    category: 'Financial Management',
    objective: 'Objective 5: Financial Sustainability',
    target: 90,
    currentValue: 78,
    performance: 86.7,
    status: 'needs_improvement',
    lastUpdated: '2024-01-09',
    weight: 1.1,
    trend: 'down',
    facilities: 126,
    active: false
  }
];

export default function IndicatorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterObjective, setFilterObjective] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'needs_improvement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4" />;
      case 'good':
        return <Clock className="h-4 w-4" />;
      case 'needs_improvement':
        return <AlertTriangle className="h-4 w-4" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredIndicators = mockIndicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.dhis2Uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || indicator.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || indicator.status === filterStatus;
    const matchesObjective = filterObjective === 'all' || indicator.objective === filterObjective;
    const matchesActive = !showActiveOnly || indicator.active;
    return matchesSearch && matchesCategory && matchesStatus && matchesObjective && matchesActive;
  });

  const categories = [...new Set(mockIndicators.map(i => i.category))];
  const objectives = [...new Set(mockIndicators.map(i => i.objective))];
  
  const stats = {
    total: mockIndicators.length,
    active: mockIndicators.filter(i => i.active).length,
    excellent: mockIndicators.filter(i => i.status === 'excellent').length,
    good: mockIndicators.filter(i => i.status === 'good').length,
    needsImprovement: mockIndicators.filter(i => i.status === 'needs_improvement').length,
    poor: mockIndicators.filter(i => i.status === 'poor').length,
    averagePerformance: mockIndicators.reduce((acc, i) => acc + i.performance, 0) / mockIndicators.length,
    totalFacilities: mockIndicators.reduce((acc, i) => acc + i.facilities, 0)
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicator Management</h1>
          <p className="text-gray-600">Manage health indicators and their performance thresholds</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Indicator
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Indicators</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averagePerformance.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFacilities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>
              Distribution of indicators by performance status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Excellent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(stats.excellent / stats.total) * 100} className="w-20" />
                  <span className="text-sm font-medium text-green-600">
                    {stats.excellent} ({((stats.excellent / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Good</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(stats.good / stats.total) * 100} className="w-20" />
                  <span className="text-sm font-medium text-blue-600">
                    {stats.good} ({((stats.good / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Needs Improvement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(stats.needsImprovement / stats.total) * 100} className="w-20" />
                  <span className="text-sm font-medium text-orange-600">
                    {stats.needsImprovement} ({((stats.needsImprovement / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Poor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(stats.poor / stats.total) * 100} className="w-20" />
                  <span className="text-sm font-medium text-red-600">
                    {stats.poor} ({((stats.poor / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Indicators by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map(category => {
                const count = mockIndicators.filter(i => i.category === category).length;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {count} ({((count / stats.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicator Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Indicator Management</CardTitle>
              <CardDescription>
                View and manage health indicators and their performance
              </CardDescription>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Indicator
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="needs_improvement">Needs Improvement</option>
              <option value="poor">Poor</option>
            </select>
            <select
              value={filterObjective}
              onChange={(e) => setFilterObjective(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Objectives</option>
              {objectives.map(objective => (
                <option key={objective} value={objective}>{objective}</option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Active/Inactive Toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="activeOnly"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="activeOnly" className="text-sm text-gray-600">
              Show active indicators only
            </label>
          </div>

          {/* Indicator Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Objective</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Facilities</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicators.map((indicator) => (
                  <TableRow key={indicator.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{indicator.name}</div>
                        <div className="text-sm text-gray-500">{indicator.dhis2Uid}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{indicator.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{indicator.objective}</div>
                    </TableCell>
                    <TableCell>{indicator.target}%</TableCell>
                    <TableCell>{indicator.currentValue}%</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(indicator.trend)}
                        <span className="font-medium">{indicator.performance.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(indicator.status)}>
                        {getStatusIcon(indicator.status)} {indicator.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getTrendIcon(indicator.trend)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{indicator.weight}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{indicator.facilities}</div>
                        <div className="text-xs text-gray-500">
                          {indicator.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 