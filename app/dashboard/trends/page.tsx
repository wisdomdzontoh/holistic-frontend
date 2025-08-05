'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Target,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Download,
  Eye,
  Activity
} from 'lucide-react';

interface TrendData {
  id: string;
  metric: string;
  category: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  facility?: string;
  region?: string;
  status: 'improving' | 'declining' | 'stable';
}

const mockTrendData: TrendData[] = [
  {
    id: '1',
    metric: 'EPI - BCG Coverage',
    category: 'Immunization',
    currentValue: 85,
    previousValue: 78,
    change: 7,
    changePercent: 9.0,
    trend: 'up',
    period: 'Q4-2024',
    facility: 'Korle Bu Teaching Hospital',
    region: 'Greater Accra',
    status: 'improving'
  },
  {
    id: '2',
    metric: 'Maternal Health - ANC Attendance',
    category: 'Maternal Health',
    currentValue: 75,
    previousValue: 82,
    change: -7,
    changePercent: -8.5,
    trend: 'down',
    period: 'Q4-2024',
    facility: 'Ridge Hospital',
    region: 'Greater Accra',
    status: 'declining'
  },
  {
    id: '3',
    metric: 'Staff Availability - Nurses',
    category: 'Human Resources',
    currentValue: 45,
    previousValue: 42,
    change: 3,
    changePercent: 7.1,
    trend: 'up',
    period: 'Q4-2024',
    facility: '37 Military Hospital',
    region: 'Greater Accra',
    status: 'improving'
  },
  {
    id: '4',
    metric: 'Infrastructure - Clean Water Access',
    category: 'Infrastructure',
    currentValue: 88,
    previousValue: 88,
    change: 0,
    changePercent: 0,
    trend: 'stable',
    period: 'Q4-2024',
    facility: 'La General Hospital',
    region: 'Greater Accra',
    status: 'stable'
  },
  {
    id: '5',
    metric: 'Quality - Patient Satisfaction',
    category: 'Quality of Care',
    currentValue: 82,
    previousValue: 79,
    change: 3,
    changePercent: 3.8,
    trend: 'up',
    period: 'Q4-2024',
    facility: 'Tema General Hospital',
    region: 'Greater Accra',
    status: 'improving'
  },
  {
    id: '6',
    metric: 'Financial - Budget Utilization',
    category: 'Financial Management',
    currentValue: 78,
    previousValue: 85,
    change: -7,
    changePercent: -8.2,
    trend: 'down',
    period: 'Q4-2024',
    facility: 'Koforidua Regional Hospital',
    region: 'Eastern',
    status: 'declining'
  }
];

export default function TrendsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTrend, setFilterTrend] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'improving':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      case 'stable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'improving':
        return <CheckCircle className="h-4 w-4" />;
      case 'declining':
        return <AlertTriangle className="h-4 w-4" />;
      case 'stable':
        return <Minus className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const filteredTrends = mockTrendData.filter(trend => {
    const matchesSearch = trend.metric.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trend.facility?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || trend.category === filterCategory;
    const matchesTrend = filterTrend === 'all' || trend.trend === filterTrend;
    const matchesRegion = filterRegion === 'all' || trend.region === filterRegion;
    return matchesSearch && matchesCategory && matchesTrend && matchesRegion;
  });

  const categories = [...new Set(mockTrendData.map(t => t.category))];
  const regions = [...new Set(mockTrendData.map(t => t.region))];

  const stats = {
    total: mockTrendData.length,
    improving: mockTrendData.filter(t => t.status === 'improving').length,
    declining: mockTrendData.filter(t => t.status === 'declining').length,
    stable: mockTrendData.filter(t => t.status === 'stable').length,
    averageChange: mockTrendData.reduce((acc, t) => acc + t.changePercent, 0) / mockTrendData.length,
    positiveChange: mockTrendData.filter(t => t.changePercent > 0).length,
    negativeChange: mockTrendData.filter(t => t.changePercent < 0).length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trend Analysis</h1>
            <p className="text-gray-600">Performance trends and comparative analytics</p>
          </div>
          <Button className="text-white" style={{ backgroundColor: '#265380' }}>
            <Download className="h-4 w-4 mr-2" />
            Export Trends
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#f0f8ff' }}>
                  <Activity className="h-5 w-5" style={{ color: '#265380' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Metrics</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Improving</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.improving}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Declining</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.declining}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Change</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageChange.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Distribution</CardTitle>
              <CardDescription>
                Distribution of metrics by trend direction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Improving</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={(stats.improving / stats.total) * 100} className="w-20" />
                    <span className="text-sm font-medium text-green-600">
                      {stats.improving} ({((stats.improving / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Declining</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={(stats.declining / stats.total) * 100} className="w-20" />
                    <span className="text-sm font-medium text-red-600">
                      {stats.declining} ({((stats.declining / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Minus className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Stable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={(stats.stable / stats.total) * 100} className="w-20" />
                    <span className="text-sm font-medium text-gray-600">
                      {stats.stable} ({((stats.stable / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Average change by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map(category => {
                  const categoryTrends = mockTrendData.filter(t => t.category === category);
                  const avgChange = categoryTrends.reduce((acc, t) => acc + t.changePercent, 0) / categoryTrends.length;
                  const count = categoryTrends.length;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${avgChange > 0 ? 'bg-green-600' : avgChange < 0 ? 'bg-red-600' : 'bg-gray-600'}`}
                            style={{ width: `${Math.abs(avgChange)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${avgChange > 0 ? 'text-green-600' : avgChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {avgChange.toFixed(1)}% ({count})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Detailed trend analysis for all metrics
                </CardDescription>
              </div>
              <Button className="text-white" style={{ backgroundColor: '#265380' }}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search metrics..."
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
                value={filterTrend}
                onChange={(e) => setFilterTrend(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Trends</option>
                <option value="up">Improving</option>
                <option value="down">Declining</option>
                <option value="stable">Stable</option>
              </select>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Trends Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrends.map((trend) => (
                    <TableRow key={trend.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trend.metric}</div>
                          <div className="text-sm text-gray-500">{trend.period}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trend.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trend.facility}</div>
                          <div className="text-sm text-gray-500">{trend.region}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{trend.currentValue}%</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{trend.previousValue}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${trend.changePercent > 0 ? 'text-green-600' : trend.changePercent < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                          </span>
                          {getTrendIcon(trend.trend)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTrendIcon(trend.trend)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(trend.status)}>
                          {getStatusIcon(trend.status)} {trend.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
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

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>
              Key findings from trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-800">Top Performer</h3>
                </div>
                <p className="text-sm text-green-700">
                  EPI - BCG Coverage shows the highest improvement at +9.0%
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-800">Needs Attention</h3>
                </div>
                <p className="text-sm text-red-700">
                  Maternal Health - ANC Attendance declined by -8.5%
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Overall Trend</h3>
                </div>
                <p className="text-sm text-blue-700">
                  {stats.improving} metrics improving, {stats.declining} declining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 