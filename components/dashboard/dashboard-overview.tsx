'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Building2,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function KPICard({ title, value, change, changeType, icon, color, description }: KPICardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`p-2 rounded-lg ${color}`}>
                {icon}
              </div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <div className="flex items-center space-x-1">
                {getChangeIcon()}
                <span className={`text-sm font-medium ${getChangeColor()}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const [data, setData] = useState({
    totalFacilities: 156,
    activeAssessments: 89,
    averageScore: 4.2,
    completionRate: 78,
    performanceCategories: {
      excellent: 45,
      good: 32,
      needsImprovement: 23
    }
  });

  const kpiData = [
    {
      title: 'Total Facilities',
      value: data.totalFacilities,
      change: 12,
      changeType: 'increase' as const,
      icon: <Building2 className="h-5 w-5 text-white" />,
      color: 'bg-blue-500',
      description: 'Health facilities in system'
    },
    {
      title: 'Active Assessments',
      value: data.activeAssessments,
      change: 8,
      changeType: 'increase' as const,
      icon: <Target className="h-5 w-5 text-white" />,
      color: 'bg-green-500',
      description: 'Ongoing assessments'
    },
    {
      title: 'Average Score',
      value: data.averageScore,
      change: 0.3,
      changeType: 'increase' as const,
      icon: <BarChart3 className="h-5 w-5 text-white" />,
      color: 'bg-purple-500',
      description: 'Overall performance score'
    },
    {
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      change: -2,
      changeType: 'decrease' as const,
      icon: <Users className="h-5 w-5 text-white" />,
      color: 'bg-orange-500',
      description: 'Assessment completion'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Performance Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Performance Categories</span>
            </CardTitle>
            <CardDescription>
              Distribution of facilities by performance level
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
                  <Progress value={data.performanceCategories.excellent} className="w-20" />
                  <span className="text-sm font-medium text-green-600">
                    {data.performanceCategories.excellent}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Good</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={data.performanceCategories.good} className="w-20" />
                  <span className="text-sm font-medium text-blue-600">
                    {data.performanceCategories.good}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Needs Improvement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={data.performanceCategories.needsImprovement} className="w-20" />
                  <span className="text-sm font-medium text-orange-600">
                    {data.performanceCategories.needsImprovement}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest assessment activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { facility: 'Korle Bu Teaching Hospital', action: 'Assessment completed', time: '2 hours ago', status: 'success' },
                { facility: 'Ridge Hospital', action: 'Assessment started', time: '4 hours ago', status: 'pending' },
                { facility: '37 Military Hospital', action: 'Data updated', time: '6 hours ago', status: 'info' },
                { facility: 'La General Hospital', action: 'Assessment failed', time: '8 hours ago', status: 'error' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' :
                    activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.facility}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Target className="h-4 w-4 mr-2" />
          Start New Assessment
        </Button>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          View All Reports
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </div>
  );
} 