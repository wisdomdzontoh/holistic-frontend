"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  Target,
  FileText,
  TrendingUp,
  Database,
  Users,
  CheckCircle,
  ArrowRight,
  Activity,
  Clock,
  AlertCircle,
  Zap,
} from "lucide-react"
import { DashboardService, type DashboardStats } from "@/lib/dashboard-service"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dashboardService = new DashboardService()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const statsData = await dashboardService.getDashboardStats()
      setStats(statsData)
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Assessment data for bar chart - using real data if available
  const assessmentData = [
    { month: 'Jan', count: stats?.monthly_assessments?.jan || 0, label: 'January' },
    { month: 'Feb', count: stats?.monthly_assessments?.feb || 0, label: 'February' },
    { month: 'Mar', count: stats?.monthly_assessments?.mar || 0, label: 'March' },
    { month: 'Apr', count: stats?.monthly_assessments?.apr || 0, label: 'April' },
    { month: 'May', count: stats?.monthly_assessments?.may || 0, label: 'May' },
    { month: 'Jun', count: stats?.monthly_assessments?.jun || 0, label: 'June' },
    { month: 'Jul', count: stats?.monthly_assessments?.jul || 0, label: 'July' },
    { month: 'Aug', count: stats?.monthly_assessments?.aug || 0, label: 'August' },
    { month: 'Sep', count: stats?.monthly_assessments?.sep || 0, label: 'September' },
    { month: 'Oct', count: stats?.monthly_assessments?.oct || 0, label: 'October' },
    { month: 'Nov', count: stats?.monthly_assessments?.nov || 0, label: 'November' },
    { month: 'Dec', count: stats?.monthly_assessments?.dec || 0, label: 'December' }
  ]

  const total = assessmentData.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(...assessmentData.map(d => d.count), 1) // Ensure minimum height for empty charts
  
  // Calculate current year for display
  const currentYear = new Date().getFullYear()
  
  // Get the most recent month with data
  const recentMonth = assessmentData
    .slice()
    .reverse()
    .find(data => data.count > 0)
  
  // Calculate month-over-month growth
  const getMonthGrowth = (currentMonth: number) => {
    if (currentMonth === 0) return 0
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const currentData = assessmentData.find(d => {
      const monthNum = new Date(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`).getMonth() + 1
      return d.month === new Date(0, monthNum - 1).toLocaleString('en', { month: 'short' })
    })
    const previousData = assessmentData.find(d => {
      const monthNum = new Date(`${currentYear}-${previousMonth.toString().padStart(2, '0')}-01`).getMonth() + 1
      return d.month === new Date(0, monthNum - 1).toLocaleString('en', { month: 'short' })
    })
    
    if (!previousData || previousData.count === 0) return 100
    return Math.round(((currentData?.count || 0) - previousData.count) / previousData.count * 100)
  }

  const quickActions = [
    {
      title: "New Assessment",
      description: "Start comprehensive facility evaluation",
      href: "/dashboard/assessment",
      icon: Target,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
    {
      title: "Manage Indicators",
      description: "Configure assessment criteria",
      href: "/dashboard/indicators",
      icon: FileText,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
    {
      title: "View Analysis",
      description: "Performance charts and insights",
      href: "/dashboard/analysis",
      icon: BarChart3,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
  ]

  const systemStatus = [
    {
      label: "DHIS2 Connection",
      status: "Connected",
      icon: Database,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "System Health",
      status: "Operational",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Last Sync",
      status: "Just now",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 bg-gray-200">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 bg-gray-200">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Comprehensive health facility assessment platform</p>
          </div>
          <Link href="/dashboard/assessment">
            <Button size="lg" style={{ backgroundColor: '#154360' }} className="hover:bg-blue-700">
              <Target className="h-5 w-5 mr-2" />
              Start New Assessment
            </Button>
          </Link>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="text-3xl font-bold">{stats?.total_assessments || total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 font-medium">
                  {stats?.assessment_growth ? `+${stats.assessment_growth}%` : '+15%'} from last year
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Indicators</p>
                  <p className="text-3xl font-bold">{stats?.total_indicators || 156}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 font-medium">
                  {stats?.indicator_growth ? `+${stats.indicator_growth}%` : '+8%'} from last year
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: '#154360' }} />
              Assessment Distribution ({currentYear})
            </CardTitle>
            <div className="text-sm text-gray-600">
              {recentMonth ? `Latest: ${recentMonth.label} (${recentMonth.count} assessments)` : 'No assessments yet this year'}
              {stats?.chart_stats?.peak_month && (
                <span className="ml-2 text-blue-600">
                  • Peak: {stats.chart_stats.peak_month.charAt(0).toUpperCase() + stats.chart_stats.peak_month.slice(1)} ({stats.chart_stats.peak_count})
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.total_assessments || total}</div>
                  <div className="text-sm text-gray-600">Total assessments conducted</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {stats?.assessment_growth ? `+${stats.assessment_growth}%` : '+0%'} from last year
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="h-48 flex items-end justify-between space-x-2 pt-4">
                {assessmentData.map((data, index) => {
                  const monthGrowth = getMonthGrowth(index + 1)
                  const barHeight = data.count > 0 ? (data.count / maxCount) * 120 : 4 // Minimum height for empty bars
                  const isCurrentMonth = new Date().getMonth() === index
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 flex-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        <div className="font-semibold">{data.label}</div>
                        <div>{data.count} assessment{data.count !== 1 ? 's' : ''}</div>
                        {monthGrowth !== 0 && (
                          <div className={monthGrowth > 0 ? 'text-green-400' : 'text-red-400'}>
                            {monthGrowth > 0 ? '+' : ''}{monthGrowth}% from previous month
                          </div>
                        )}
                      </div>
                      
                      {/* Bar */}
                      <div className="relative w-full">
                        <div 
                          className={`rounded-t w-full transition-all duration-300 hover:opacity-80 ${
                            isCurrentMonth ? 'ring-2 ring-blue-400' : ''
                          }`}
                          style={{ 
                            backgroundColor: data.count > 0 ? '#154360' : '#e5e7eb',
                            height: `${barHeight}px`,
                            minHeight: '4px'
                          }}
                        ></div>
                        
                        {/* Growth indicator */}
                        {monthGrowth !== 0 && data.count > 0 && (
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold ${
                            monthGrowth > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {monthGrowth > 0 ? '↑' : '↓'}
                          </div>
                        )}
                      </div>
                      
                      {/* Month label */}
                      <span className={`text-xs font-medium ${
                        isCurrentMonth ? 'text-blue-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {data.month}
                      </span>
                      
                      {/* Count */}
                      <span className={`text-xs ${
                        data.count > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}>
                        {data.count}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              {/* Chart Legend */}
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#154360' }}></div>
                  <span>Assessments</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-gray-200"></div>
                  <span>No Data</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">↑</div>
                  <span>Growth</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">↓</div>
                  <span>Decline</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: '#154360' }} />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Button variant="ghost" className="w-full h-auto p-4 justify-start hover:bg-gray-50 group">
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className={`w-12 h-12 rounded-lg ${action.color} ${action.hoverColor} flex items-center justify-center transition-colors`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" style={{ color: '#154360' }} />
                Platform Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div className="space-y-1">
                    <p className="font-semibold">Automated Data Collection</p>
                    <p className="text-sm text-muted-foreground">
                      Seamless DHIS2 integration eliminates manual entry and reduces errors
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div className="space-y-1">
                    <p className="font-semibold">Real-time Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Instant scoring and performance metrics with visual feedback
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div className="space-y-1">
                    <p className="font-semibold">Comprehensive Reporting</p>
                    <p className="text-sm text-muted-foreground">
                      Generate detailed reports for stakeholders and decision-makers
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div className="space-y-1">
                    <p className="font-semibold">Performance Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor trends and identify improvement areas across facilities
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: '#154360' }} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {systemStatus.map((status) => (
                <div key={status.label} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className={`w-12 h-12 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                    <status.icon className={`h-6 w-6 ${status.color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{status.label}</p>
                    <p className="text-sm text-muted-foreground">{status.status}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 
