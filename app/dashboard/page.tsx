"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Gauge,
  ListChecks,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { PageContainer } from "@/components/layouts/dashboard-shell"
import { PageCard } from "@/components/layouts/page-card"
import { SectionCard } from "@/components/common/section-card"
import { StatCard } from "@/components/common/stat-card"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { CardSkeleton } from "@/components/common/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DashboardService, type DashboardStats } from "@/lib/dashboard-service"
import { cn } from "@/lib/utils"

// One instance for the module — no need to rebuild it on every render.
const dashboardService = new DashboardService()

const MONTHS = [
  ["jan", "Jan", "January"],
  ["feb", "Feb", "February"],
  ["mar", "Mar", "March"],
  ["apr", "Apr", "April"],
  ["may", "May", "May"],
  ["jun", "Jun", "June"],
  ["jul", "Jul", "July"],
  ["aug", "Aug", "August"],
  ["sep", "Sep", "September"],
  ["oct", "Oct", "October"],
  ["nov", "Nov", "November"],
  ["dec", "Dec", "December"],
] as const

const QUICK_ACTIONS = [
  {
    title: "Start an assessment",
    description: "Pick facilities and periods, then score them against targets.",
    href: "/dashboard/assessment",
    icon: ClipboardList,
    tint: "bg-tint-blue-bg text-tint-blue",
  },
  {
    title: "See performance analysis",
    description: "Objective and sector scores from a saved assessment.",
    href: "/dashboard/analysis",
    icon: BarChart3,
    tint: "bg-tint-teal-bg text-tint-teal",
  },
  {
    title: "Read indicator definitions",
    description: "What each indicator measures and how it is calculated.",
    href: "/dashboard/indicators",
    icon: BookOpen,
    tint: "bg-tint-violet-bg text-tint-violet",
  },
] as const

const BAR_AREA_PX = 140

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setFailed(false)
      setStats(await dashboardService.getDashboardStats())
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const currentYear = new Date().getFullYear()
  const currentMonthIndex = new Date().getMonth()

  const monthly = useMemo(
    () =>
      MONTHS.map(([key, short, long]) => ({
        short,
        long,
        count: stats?.monthly_assessments?.[key] ?? 0,
      })),
    [stats],
  )
  const monthlyTotal = monthly.reduce((sum, m) => sum + m.count, 0)
  const maxCount = Math.max(...monthly.map((m) => m.count), 1)
  const latestMonth = [...monthly].reverse().find((m) => m.count > 0)
  const peakMonth = stats?.chart_stats?.peak_month

  const header = (
    <PageCard
      title="Dashboard"
      description="A summary of assessments carried out across your facilities this year."
      actions={
        <Button asChild size="lg">
          <Link href="/dashboard/assessment">
            <Plus aria-hidden="true" />
            Start an assessment
          </Link>
        </Button>
      }
    />
  )

  if (loading) {
    return (
      <PageContainer>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={1} />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="mb-6 h-4 w-48" />
          <div className="flex h-[180px] items-end gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${30 + ((i * 37) % 70)}%` }} />
            ))}
          </div>
        </div>
      </PageContainer>
    )
  }

  if (failed || !stats) {
    return (
      <PageContainer>
        {header}
        <SectionCard>
          <ErrorState
            title="We couldn't load the dashboard"
            message="Check your internet connection and try again. If it keeps happening, the assessment server may be down."
            onRetry={loadDashboardData}
          />
        </SectionCard>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {header}

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assessments"
          value={formatNumber(stats.total_assessments ?? monthlyTotal)}
          icon={ClipboardList}
          tint="blue"
          hint={<GrowthHint value={stats.assessment_growth} />}
        />
        <StatCard
          label="Facilities assessed"
          value={formatNumber(stats.total_facilities)}
          icon={Building2}
          tint="teal"
          hint={stats.recent_assessments != null ? `${formatNumber(stats.recent_assessments)} assessed recently` : undefined}
        />
        <StatCard
          label="Indicators tracked"
          value={formatNumber(stats.total_indicators)}
          icon={ListChecks}
          tint="violet"
          hint={
            stats.total_objectives != null ? (
              <>Across {formatNumber(stats.total_objectives)} objectives</>
            ) : (
              <GrowthHint value={stats.indicator_growth} />
            )
          }
        />
        <StatCard
          label="Average sector score"
          value={typeof stats.average_sector_score === "number" ? stats.average_sector_score.toFixed(1) : "—"}
          icon={Gauge}
          tint="amber"
          hint="Out of 5"
        />
      </div>

      {/* Monthly distribution */}
      <SectionCard
        title={`Assessments by month, ${currentYear}`}
        description={
          latestMonth
            ? `Latest: ${latestMonth.long} (${latestMonth.count} ${plural(latestMonth.count, "assessment")})` +
              (peakMonth ? ` · Busiest: ${capitalize(peakMonth)} (${stats.chart_stats?.peak_count})` : "")
            : "No assessments yet this year."
        }
        actions={
          <span className="font-clinical text-sm text-muted-foreground">
            {formatNumber(monthlyTotal)} this year
          </span>
        }
      >
        <div className="flex items-end gap-1.5 pt-2 sm:gap-3" role="list" aria-label="Assessments per month">
          {monthly.map((m, index) => {
            const isCurrent = index === currentMonthIndex
            const height = m.count > 0 ? Math.max((m.count / maxCount) * BAR_AREA_PX, 6) : 4
            return (
              <div key={m.short} role="listitem" className="flex flex-1 flex-col items-center gap-1.5">
                <span className={cn("font-clinical text-xs", m.count > 0 ? "font-medium text-foreground" : "text-text-disabled")}>
                  {m.count}
                </span>
                <div className="flex h-[140px] w-full items-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        aria-label={`${m.long}: ${m.count} ${plural(m.count, "assessment")}`}
                        className={cn(
                          "w-full rounded-t-md transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          m.count > 0 ? "bg-primary hover:bg-primary-hover" : "bg-muted",
                          isCurrent && "ring-2 ring-accent ring-offset-2 ring-offset-card",
                        )}
                        // Dynamic: bar height comes from the data.
                        style={{ height }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {m.long}: {m.count} {plural(m.count, "assessment")}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className={cn("text-xs", isCurrent ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {m.short}
                </span>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <SectionCard title="What would you like to do?" flush>
          <ul className="divide-y divide-border/60 border-t border-border">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/60"
                >
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", action.tint)}>
                    <action.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{action.title}</span>
                    <span className="block text-sm text-muted-foreground">{action.description}</span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Recent activity */}
        <SectionCard title="Recent activity" flush>
          {stats.recent_activity && stats.recent_activity.length > 0 ? (
            <ul className="divide-y divide-border/60 border-t border-border">
              {stats.recent_activity.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="truncate text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <span className="font-clinical shrink-0 text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              illustration="empty-list"
              title="No activity yet"
              description="Assessments you create and save will appear here."
              action={{ label: "Start an assessment", href: "/dashboard/assessment" }}
              className="border-t border-border"
            />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}

function GrowthHint({ value }: { value?: number }) {
  if (value == null) return null
  const up = value >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", up ? "text-success" : "text-error")}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {up ? "+" : ""}
      {value}% on last year
    </span>
  )
}

function formatNumber(value?: number | null): string {
  return typeof value === "number" ? value.toLocaleString() : "—"
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB")
}
