'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Indicator {
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

export function IndicatorWidget() {
  const [indicators, setIndicators] = useState<Indicator[]>([
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
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const getPerformanceIcon = (performance: number) => {
    if (performance >= 100) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (performance >= 80) {
      return <Minus className="h-4 w-4 text-yellow-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.dhis2Uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || indicator.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || indicator.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(indicators.map(i => i.category))];
  const stats = {
    total: indicators.length,
    excellent: indicators.filter(i => i.status === 'excellent').length,
    good: indicators.filter(i => i.status === 'good').length,
    needsImprovement: indicators.filter(i => i.status === 'needs_improvement').length,
    poor: indicators.filter(i => i.status === 'poor').length,
    averagePerformance: indicators.reduce((acc, i) => acc + i.performance, 0) / indicators.length
  };

  return (
    <div className="space-y-6">
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
                <p className="text-sm font-medium text-gray-600">Excellent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.excellent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Good</p>
                <p className="text-2xl font-bold text-gray-900">{stats.good}</p>
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
                const count = indicators.filter(i => i.category === category).length;
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
          {/* Search and Filter */}
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
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Indicator Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
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
                    <TableCell>{indicator.target}%</TableCell>
                    <TableCell>{indicator.currentValue}%</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getPerformanceIcon(indicator.performance)}
                        <span className="font-medium">{indicator.performance.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(indicator.status)}>
                        {getStatusIcon(indicator.status)} {indicator.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{indicator.lastUpdated}</TableCell>
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