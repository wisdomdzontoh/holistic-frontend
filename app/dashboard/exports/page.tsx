'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  Plus, 
  Filter, 
  Search, 
  Eye, 
  Download, 
  FileText,
  FileSpreadsheet,
  FileDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Trash2,
  Share2
} from 'lucide-react';

interface ExportJob {
  id: string;
  name: string;
  type: 'assessment' | 'indicator' | 'trend' | 'period' | 'custom';
  format: 'excel' | 'pdf' | 'csv' | 'json';
  status: 'completed' | 'in_progress' | 'failed' | 'queued';
  size: string;
  createdAt: string;
  completedAt?: string;
  requestedBy: string;
  description: string;
  filters: string[];
  downloadCount: number;
  lastDownloaded?: string;
}

const mockExports: ExportJob[] = [
  {
    id: '1',
    name: 'Q4-2024 Assessment Summary',
    type: 'assessment',
    format: 'excel',
    status: 'completed',
    size: '2.4 MB',
    createdAt: '2024-01-15 10:30',
    completedAt: '2024-01-15 10:32',
    requestedBy: 'John Doe',
    description: 'Comprehensive assessment summary for Q4 2024',
    filters: ['Q4-2024', 'All Regions', 'All Objectives'],
    downloadCount: 5,
    lastDownloaded: '2024-01-16 14:20'
  },
  {
    id: '2',
    name: 'Immunization Indicators Report',
    type: 'indicator',
    format: 'pdf',
    status: 'completed',
    size: '1.8 MB',
    createdAt: '2024-01-14 14:20',
    completedAt: '2024-01-14 14:22',
    requestedBy: 'Jane Smith',
    description: 'Detailed immunization indicators analysis',
    filters: ['Q4-2024', 'Immunization', 'All Facilities'],
    downloadCount: 3,
    lastDownloaded: '2024-01-15 09:15'
  },
  {
    id: '3',
    name: 'Performance Trends Analysis',
    type: 'trend',
    format: 'csv',
    status: 'completed',
    size: '3.2 MB',
    createdAt: '2024-01-13 09:15',
    completedAt: '2024-01-13 09:18',
    requestedBy: 'Mike Johnson',
    description: 'Performance trends over the last 4 quarters',
    filters: ['2024', 'All Metrics', 'Trend Analysis'],
    downloadCount: 8,
    lastDownloaded: '2024-01-14 16:45'
  },
  {
    id: '4',
    name: 'Annual Assessment Report 2024',
    type: 'assessment',
    format: 'pdf',
    status: 'in_progress',
    size: '0 MB',
    createdAt: '2024-01-15 11:00',
    requestedBy: 'Sarah Wilson',
    description: 'Annual assessment report for 2024',
    filters: ['2024', 'All Regions', 'All Objectives'],
    downloadCount: 0
  },
  {
    id: '5',
    name: 'Facility Performance Data',
    type: 'custom',
    format: 'excel',
    status: 'completed',
    size: '4.1 MB',
    createdAt: '2024-01-12 16:45',
    completedAt: '2024-01-12 16:48',
    requestedBy: 'David Brown',
    description: 'Custom facility performance data export',
    filters: ['Q4-2024', 'Selected Facilities', 'Custom Metrics'],
    downloadCount: 2,
    lastDownloaded: '2024-01-13 11:30'
  },
  {
    id: '6',
    name: 'Infrastructure Assessment Data',
    type: 'assessment',
    format: 'csv',
    status: 'failed',
    size: '0 MB',
    createdAt: '2024-01-11 13:30',
    requestedBy: 'Lisa Chen',
    description: 'Infrastructure assessment data export',
    filters: ['Q4-2024', 'Infrastructure', 'All Facilities'],
    downloadCount: 0
  }
];

export default function ExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'queued':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'csv':
        return <FileDown className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assessment':
        return 'bg-blue-100 text-blue-800';
      case 'indicator':
        return 'bg-green-100 text-green-800';
      case 'trend':
        return 'bg-purple-100 text-purple-800';
      case 'period':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExports = mockExports.filter(exportJob => {
    const matchesSearch = exportJob.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exportJob.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || exportJob.type === filterType;
    const matchesStatus = filterStatus === 'all' || exportJob.status === filterStatus;
    const matchesFormat = filterFormat === 'all' || exportJob.format === filterFormat;
    return matchesSearch && matchesType && matchesStatus && matchesFormat;
  });

  const stats = {
    total: mockExports.length,
    completed: mockExports.filter(e => e.status === 'completed').length,
    inProgress: mockExports.filter(e => e.status === 'in_progress').length,
    failed: mockExports.filter(e => e.status === 'failed').length,
    totalSize: mockExports.filter(e => e.status === 'completed').reduce((acc, e) => {
      const size = parseFloat(e.size.split(' ')[0]);
      return acc + size;
    }, 0),
    totalDownloads: mockExports.reduce((acc, e) => acc + e.downloadCount, 0)
  };

  const exportTypes = [...new Set(mockExports.map(e => e.type))];
  const exportFormats = [...new Set(mockExports.map(e => e.format))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>
          <p className="text-gray-600">Manage data exports and downloads</p>
        </div>
        <Button className="text-white" style={{ backgroundColor: '#265380' }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#f0f8ff' }}>
                <FileText className="h-5 w-5" style={{ color: '#265380' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exports</p>
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSize.toFixed(1)} MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Export Templates</CardTitle>
          <CardDescription>
            Pre-configured export templates for quick generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Assessment Summary</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Comprehensive assessment summary with key metrics
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline">Excel</Badge>
                <Button size="sm">Use Template</Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-5 w-5 text-red-600" />
                <h3 className="font-medium">Detailed Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Detailed analysis with charts and visualizations
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline">PDF</Badge>
                <Button size="sm">Use Template</Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <FileDown className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Raw Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Raw data export for further analysis
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline">CSV</Badge>
                <Button size="sm">Use Template</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Export Jobs</CardTitle>
              <CardDescription>
                View and manage export jobs
              </CardDescription>
            </div>
            <Button className="text-white" style={{ backgroundColor: '#265380' }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search exports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {exportTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Formats</option>
              {exportFormats.map(format => (
                <option key={format} value={format}>{format.toUpperCase()}</option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Exports Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Export Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExports.map((exportJob) => (
                  <TableRow key={exportJob.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exportJob.name}</div>
                        <div className="text-sm text-gray-500">{exportJob.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(exportJob.type)}>
                        {exportJob.type.charAt(0).toUpperCase() + exportJob.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getFormatIcon(exportJob.format)}
                        <span className="text-sm font-medium">{exportJob.format.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(exportJob.status)}>
                        {getStatusIcon(exportJob.status)} {exportJob.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{exportJob.size}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{exportJob.downloadCount}</div>
                        {exportJob.lastDownloaded && (
                          <div className="text-xs text-gray-500">Last: {exportJob.lastDownloaded}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{exportJob.createdAt}</div>
                      {exportJob.completedAt && (
                        <div className="text-xs text-gray-500">Completed: {exportJob.completedAt}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {exportJob.status === 'completed' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
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
            Common export actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileSpreadsheet className="h-6 w-6" />
              <span className="text-sm">Excel Export</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">PDF Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileDown className="h-6 w-6" />
              <span className="text-sm">CSV Data</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">Custom Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
} 