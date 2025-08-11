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

  // Assessment data for bar chart
  const assessmentData = [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 18 },
    { month: 'Mar', count: 15 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 28 },
    { month: 'Jun', count: 25 },
    { month: 'Jul', count: 32 },
    { month: 'Aug', count: 35 },
    { month: 'Sep', count: 30 },
    { month: 'Oct', count: 38 },
    { month: 'Nov', count: 42 },
    { month: 'Dec', count: 45 }
  ]

  const total = assessmentData.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(...assessmentData.map(d => d.count))

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="text-3xl font-bold">{total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 font-medium">+15% from last year</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">54%</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <Progress value={54} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Facilities</p>
                  <p className="text-3xl font-bold">127</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">12 new this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: '#154360' }} />
              Assessment Distribution (2024)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{total}</div>
                  <div className="text-sm text-gray-600">Total assessments conducted</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+15% from last year</span>
                  </div>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="h-48 flex items-end justify-between space-x-2 pt-4">
                {assessmentData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="relative w-full">
                      <div 
                        className="rounded-t w-full transition-all duration-300 hover:opacity-80"
                        style={{ 
                          backgroundColor: '#154360',
                          height: `${(data.count / maxCount) * 120}px` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                    <span className="text-xs text-gray-500">{data.count}</span>
                  </div>
                ))}
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
