'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Filter, 
  Search, 
  Eye, 
  Edit, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  Stop,
  Download
} from 'lucide-react';

interface AssessmentPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending' | 'draft';
  type: 'quarterly' | 'annual' | 'custom';
  facilities: number;
  assessments: number;
  completionRate: number;
  averageScore: number;
  createdBy: string;
  createdAt: string;
  description: string;
}

const mockPeriods: AssessmentPeriod[] = [
  {
    id: '1',
    name: 'Q4-2024',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    status: 'active',
    type: 'quarterly',
    facilities: 156,
    assessments: 142,
    completionRate: 91.0,
    averageScore: 4.2,
    createdBy: 'John Doe',
    createdAt: '2024-09-15',
    description: 'Fourth quarter assessment for 2024'
  },
  {
    id: '2',
    name: 'Q3-2024',
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    status: 'completed',
    type: 'quarterly',
    facilities: 152,
    assessments: 152,
    completionRate: 100.0,
    averageScore: 4.0,
    createdBy: 'Jane Smith',
    createdAt: '2024-06-15',
    description: 'Third quarter assessment for 2024'
  },
  {
    id: '3',
    name: 'Q2-2024',
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    status: 'completed',
    type: 'quarterly',
    facilities: 148,
    assessments: 148,
    completionRate: 100.0,
    averageScore: 3.8,
    createdBy: 'Mike Johnson',
    createdAt: '2024-03-15',
    description: 'Second quarter assessment for 2024'
  },
  {
    id: '4',
    name: 'Q1-2024',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'completed',
    type: 'quarterly',
    facilities: 144,
    assessments: 144,
    completionRate: 100.0,
    averageScore: 3.9,
    createdBy: 'Sarah Wilson',
    createdAt: '2023-12-15',
    description: 'First quarter assessment for 2024'
  },
  {
    id: '5',
    name: 'Annual-2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    type: 'annual',
    facilities: 160,
    assessments: 120,
    completionRate: 75.0,
    averageScore: 4.1,
    createdBy: 'David Brown',
    createdAt: '2023-12-01',
    description: 'Annual assessment for 2024'
  },
  {
    id: '6',
    name: 'Q1-2025',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    status: 'pending',
    type: 'quarterly',
    facilities: 0,
    assessments: 0,
    completionRate: 0,
    averageScore: 0,
    createdBy: 'Lisa Chen',
    createdAt: '2024-12-15',
    description: 'First quarter assessment for 2025'
  }
];

export default function PeriodsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'draft':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quarterly':
        return 'bg-purple-100 text-purple-800';
      case 'annual':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPeriods = mockPeriods.filter(period => {
    const matchesSearch = period.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         period.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || period.status === filterStatus;
    const matchesType = filterType === 'all' || period.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: mockPeriods.length,
    active: mockPeriods.filter(p => p.status === 'active').length,
    completed: mockPeriods.filter(p => p.status === 'completed').length,
    pending: mockPeriods.filter(p => p.status === 'pending').length,
    totalFacilities: mockPeriods.reduce((acc, p) => acc + p.facilities, 0),
    totalAssessments: mockPeriods.reduce((acc, p) => acc + p.assessments, 0),
    averageCompletionRate: mockPeriods.reduce((acc, p) => acc + p.completionRate, 0) / mockPeriods.length,
    averageScore: mockPeriods.filter(p => p.averageScore > 0).reduce((acc, p) => acc + p.averageScore, 0) / mockPeriods.filter(p => p.averageScore > 0).length
  };

  const periodTypes = [...new Set(mockPeriods.map(p => p.type))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Periods</h1>
          <p className="text-gray-600">Manage assessment periods and scheduling</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Period
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Periods</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
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
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Period Status</CardTitle>
            <CardDescription>
              Distribution of periods by status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Play className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-600">
                    {stats.active} ({((stats.active / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-600">
                    {stats.completed} ({((stats.completed / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-yellow-600">
                    {stats.pending} ({((stats.pending / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Overall performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Facilities</span>
                <span className="text-sm font-medium text-gray-600">{stats.totalFacilities}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Assessments</span>
                <span className="text-sm font-medium text-gray-600">{stats.totalAssessments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Completion Rate</span>
                <span className="text-sm font-medium text-gray-600">{stats.averageCompletionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Score</span>
                <span className="text-sm font-medium text-gray-600">{stats.averageScore.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessment Periods</CardTitle>
              <CardDescription>
                View and manage assessment periods
              </CardDescription>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Period
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search periods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {periodTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Periods Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Facilities</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{period.name}</div>
                        <div className="text-sm text-gray-500">{period.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(period.type)}>
                        {period.type.charAt(0).toUpperCase() + period.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{period.startDate}</div>
                        <div className="text-gray-500">to {period.endDate}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(period.status)}>
                        {getStatusIcon(period.status)} {period.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{period.facilities}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{period.assessments}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${period.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{period.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{period.averageScore.toFixed(1)}</span>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common period management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">Create Period</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Schedule Assessment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">Configure Periods</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Download className="h-6 w-6" />
              <span className="text-sm">Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 