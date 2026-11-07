'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Minus,
  Play,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layouts/dashboard-shell';
import { PageCard } from '@/components/layouts/page-card';
import { SectionCard } from '@/components/common/section-card';
import { StatCard } from '@/components/common/stat-card';
import { StatusPill, type PillTone } from '@/components/common/status-pill';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { CardSkeleton } from '@/components/common/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assessmentService } from '@/lib/assessment-service';
import { cn } from '@/lib/utils';

interface SavedAssessment {
  id: string;
  name: string;
  org_unit_name: string;
  created_at: string;
  total_indicators: number;
  total_objectives: number;
}

interface DetailedScore {
  indicator_id: string;
  indicator_name: string;
  objective_name: string;
  current_value?: number;
  previous_value?: number;
  target_value?: number;
  data_provided: boolean;
  current_meets_target?: boolean;
  previous_meets_target?: boolean;
  change_category?: string;
  gap_category?: string;
  percent_change?: number;
  target_gap?: number;
  final_score: number;
  score_color: string;
  score_label: string;
}

interface AnalysisData {
  assessment: SavedAssessment;
  objectives: Array<{
    id: number;
    name: string;
    score: number;
  }>;
  overall_score: number;
  detailed_scores?: DetailedScore[];
}

/* ── Performance band (0 … 5) ─────────────────────────────────────────── */

const BAND = [
  { min: 4, label: 'Highly performing', className: 'perf-5' },
  { min: 3, label: 'Moderately performing', className: 'perf-4' },
  { min: 2, label: 'Sustained', className: 'perf-3' },
  { min: 1, label: 'Underperforming', className: 'perf-2' },
  { min: -Infinity, label: 'Severely underperforming', className: 'perf-1' },
] as const;

// Segment widths along the 0–5 scale (left to right, worst to best).
const SEGMENTS = [
  { className: 'perf-1', width: 'w-[18%]' },
  { className: 'perf-2', width: 'w-[22%]' },
  { className: 'perf-3', width: 'w-[20%]' },
  { className: 'perf-4', width: 'w-[20%]' },
  { className: 'perf-5', width: 'w-[20%]' },
] as const;

function bandFor(score: number) {
  return BAND.find((b) => score >= b.min) ?? BAND[BAND.length - 1];
}

function formatScore(score: unknown): string {
  return typeof score === 'number' ? score.toFixed(1) : '0.0';
}

/* ── Scoring breakdown helpers ────────────────────────────────────────── */

const CHANGE_CATEGORY: Record<string, { tone: PillTone; icon: typeof TrendingUp }> = {
  '>5%': { tone: 'success', icon: TrendingUp },
  '-5%<C<=5%': { tone: 'pending', icon: Minus },
  '-10%<C<=-5%': { tone: 'warning', icon: TrendingDown },
  '<=-10%': { tone: 'error', icon: TrendingDown },
};

const GAP_TONE: Record<string, PillTone> = {
  '<=10%': 'success',
  '10%<PT<=40%': 'pending',
  '>40%': 'error',
};

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [generatingCharts, setGeneratingCharts] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<SavedAssessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([]);
  const [showDetailedScores, setShowDetailedScores] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const fetchSavedAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const response = await assessmentService.getSavedAssessments({ owner: 'mine', size: 100 });
      setSavedAssessments(response.results || []);
    } catch (err) {
      console.error('Failed to fetch saved assessments:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedAssessments();
  }, [fetchSavedAssessments]);

  // Close the picker when clicking outside it — only listen while it's open.
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const filteredAssessments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return savedAssessments.filter(
      (a) => a.name.toLowerCase().includes(term) || a.org_unit_name?.toLowerCase().includes(term)
    );
  }, [savedAssessments, searchTerm]);

  const selectAssessment = (assessment: SavedAssessment) => {
    setSelectedAssessment(assessment);
    setSearchTerm(assessment.name);
    setShowDropdown(false);
    setAnalysisData(null);
  };

  const clearSelection = () => {
    setSelectedAssessment(null);
    setSearchTerm('');
    setAnalysisData(null);
  };

  const generateCharts = async () => {
    if (!selectedAssessment) return;
    setGeneratingCharts(true);
    try {
      const data = await assessmentService.getAnalysisData(selectedAssessment.id);
      setAnalysisData(data);
      toast.success('Analysis ready');
    } catch (err) {
      console.error('Failed to generate charts:', err);
      toast.error("We couldn't build the analysis. Try again in a moment.");
    } finally {
      setGeneratingCharts(false);
    }
  };

  const performingWell = analysisData?.objectives.filter((obj) => obj.score >= 3).length ?? 0;

  return (
    <PageContainer>
      <PageCard
        title="Performance analysis"
        description="Choose a saved assessment to see how each objective, and the sector overall, is performing."
      />

      {/* Assessment selection */}
      <SectionCard title="Choose an assessment" description="Only assessments you have saved are listed.">
        {loading ? (
          <CardSkeleton lines={1} className="border-0 p-0" />
        ) : failed ? (
          <ErrorState
            title="We couldn't load your saved assessments"
            message="Check your internet connection and try again."
            onRetry={fetchSavedAssessments}
            className="py-6"
          />
        ) : savedAssessments.length === 0 ? (
          <EmptyState
            illustration="assessment"
            title="No saved assessments yet"
            description="Generate and save an assessment first — it will then be available for analysis here."
            action={{ label: 'Start an assessment', href: '/dashboard/assessment' }}
            className="py-6"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div ref={pickerRef} className="relative flex-1">
                <label htmlFor="assessment-picker" className="sr-only">
                  Search saved assessments
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="assessment-picker"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-controls="assessment-picker-list"
                  placeholder="Search by assessment or facility name"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
                  className="h-10 pr-9 pl-8"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowDropdown((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showDropdown ? 'Close list' : 'Show all saved assessments'}
                >
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showDropdown && 'rotate-180')} />
                </button>

                {showDropdown && (
                  <div
                    id="assessment-picker-list"
                    role="listbox"
                    className="absolute z-40 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-border bg-popover shadow-[var(--shadow-card)]"
                  >
                    <div className="sticky top-0 border-b border-border bg-surface-subtle px-3 py-2 text-xs font-medium text-muted-foreground">
                      {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'}
                    </div>
                    {filteredAssessments.length > 0 ? (
                      filteredAssessments.map((assessment) => {
                        const isSelected = selectedAssessment?.id === assessment.id;
                        return (
                          <button
                            key={assessment.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => selectAssessment(assessment)}
                            className={cn(
                              'flex w-full items-start gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-muted/60',
                              isSelected && 'bg-primary-soft'
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{assessment.name}</p>
                              <AssessmentMeta assessment={assessment} />
                            </div>
                            {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No assessment matches “{searchTerm}”. Check the spelling or search by facility.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button size="lg" onClick={generateCharts} disabled={!selectedAssessment || generatingCharts}>
                {generatingCharts ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Building analysis…
                  </>
                ) : (
                  <>
                    <Play aria-hidden="true" />
                    Show analysis
                  </>
                )}
              </Button>
            </div>

            {selectedAssessment && (
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-primary-border bg-primary-soft px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-primary uppercase">Selected</p>
                  <p className="truncate text-sm font-semibold text-foreground">{selectedAssessment.name}</p>
                  <AssessmentMeta assessment={selectedAssessment} />
                </div>
                <Button variant="secondary" size="sm" onClick={clearSelection}>
                  <X aria-hidden="true" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {generatingCharts && (
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
          <CardSkeleton lines={1} />
          <CardSkeleton className="md:col-span-3" lines={4} />
        </div>
      )}

      {!generatingCharts && analysisData && (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Overall score"
              value={formatScore(analysisData.overall_score)}
              icon={Target}
              tint="blue"
              hint={bandFor(analysisData.overall_score).label}
            />
            <StatCard label="Objectives assessed" value={analysisData.objectives.length} icon={BarChart3} tint="teal" />
            <StatCard
              label="Performing well"
              value={performingWell}
              icon={CheckCircle2}
              tint="violet"
              hint="Objectives scoring 3 or more"
            />
          </div>

          {/* Overall sector score */}
          <SectionCard
            title="Overall sector score"
            description={`Performance for ${analysisData.assessment.name}`}
            actions={<ScoreBadge score={analysisData.overall_score} />}
          >
            <PerformanceBar score={analysisData.overall_score} size="large" />
            <BandLegend />
          </SectionCard>

          {/* Objective performance */}
          <SectionCard
            title="Objective performance"
            description="Each objective's score on the 0 to 5 performance scale."
            actions={
              analysisData.detailed_scores && analysisData.detailed_scores.length > 0 ? (
                <Button variant="outline" onClick={() => setShowDetailedScores((v) => !v)}>
                  {showDetailedScores ? 'Hide scoring breakdown' : 'Show scoring breakdown'}
                </Button>
              ) : undefined
            }
          >
            {analysisData.objectives.length === 0 ? (
              <EmptyState
                illustration="empty-list"
                title="No objective scores in this assessment"
                description="Generate the assessment again with periods that have data, then save it."
                className="py-6"
              />
            ) : (
              <ul className="divide-y divide-dashed divide-border">
                {analysisData.objectives.map((objective) => (
                  <li key={objective.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{objective.name}</h3>
                      <ScoreBadge score={objective.score} />
                    </div>
                    <PerformanceBar score={objective.score} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {showDetailedScores && analysisData.detailed_scores && (
            <DetailedScoresTable scores={analysisData.detailed_scores} />
          )}
        </>
      )}

      {!loading && !failed && savedAssessments.length > 0 && !generatingCharts && !analysisData && (
        <SectionCard>
          <EmptyState
            illustration="choose-first"
            title={selectedAssessment ? 'Ready when you are' : 'Choose an assessment to see its analysis'}
            description={
              selectedAssessment
                ? 'Select “Show analysis” to build the objective and sector charts.'
                : 'Pick a saved assessment above, then select “Show analysis”.'
            }
          />
        </SectionCard>
      )}
    </PageContainer>
  );
}

function AssessmentMeta({ assessment }: { assessment: SavedAssessment }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
        {assessment.org_unit_name}
      </span>
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        {new Date(assessment.created_at).toLocaleDateString('en-GB')}
      </span>
      <span>
        <span className="font-clinical">{assessment.total_indicators}</span> indicators ·{' '}
        <span className="font-clinical">{assessment.total_objectives}</span> objectives
      </span>
    </div>
  );
}

/** Score number + band label; the colour swatch is never the only signal. */
function ScoreBadge({ score }: { score: number }) {
  const band = bandFor(score);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-sm">
      <span className={cn('font-clinical rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground', band.className)}>
        {formatScore(score)}
      </span>
      <span className="text-muted-foreground">{band.label}</span>
    </span>
  );
}

function PerformanceBar({ score, size = 'medium' }: { score: number; size?: 'medium' | 'large' }) {
  const position = Math.min(Math.max((score / 5) * 100, 0), 100);
  return (
    <div className="space-y-1.5">
      <div
        className={cn('relative flex overflow-hidden rounded-full', size === 'large' ? 'h-5' : 'h-3')}
        role="img"
        aria-label={`Score ${formatScore(score)} out of 5: ${bandFor(score).label}`}
      >
        {SEGMENTS.map((seg) => (
          <div key={seg.className} className={cn('h-full', seg.className, seg.width)} />
        ))}
        <div
          className="absolute inset-y-0 flex -translate-x-1/2 items-center"
          // Dynamic: marker position follows the score.
          style={{ left: `${position}%` }}
        >
          <span
            className={cn(
              'block rounded-full border-2 border-card bg-foreground shadow-[var(--shadow-card)]',
              size === 'large' ? 'h-4 w-4' : 'h-2.5 w-2.5'
            )}
          />
        </div>
      </div>
      <div className="font-clinical flex justify-between text-xs text-muted-foreground">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

function BandLegend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-dashed border-border pt-4 text-xs text-muted-foreground">
      {[...BAND].reverse().map((b) => (
        <li key={b.label} className="inline-flex items-center gap-1.5">
          <span className={cn('h-3 w-3 rounded-sm', b.className)} aria-hidden="true" />
          {b.label}
        </li>
      ))}
    </ul>
  );
}

function DetailedScoresTable({ scores }: { scores: DetailedScore[] }) {
  return (
    <SectionCard title="Scoring breakdown" description="How each indicator contributed to its objective score." flush>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-subtle">
            <tr className="border-b border-border text-xs text-foreground">
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Indicator</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Objective</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Data provided</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Target met</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Change</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Gap to target</th>
              <th scope="col" className="px-4 py-2.5 text-left font-medium">Final score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => {
              const change = score.change_category ? CHANGE_CATEGORY[score.change_category] : undefined;
              return (
                <tr key={score.indicator_id ?? index} className="border-b border-border/60 align-top hover:bg-surface-muted/60">
                  <td className="px-4 py-3 font-medium text-foreground">{score.indicator_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{score.objective_name}</td>
                  <td className="px-4 py-3">
                    {score.data_provided ? (
                      <StatusPill tone="success" icon={CheckCircle2}>Yes</StatusPill>
                    ) : (
                      <StatusPill tone="error" icon={XCircle}>No data</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {score.current_meets_target === true ? (
                      <StatusPill tone="success" icon={CheckCircle2}>Met</StatusPill>
                    ) : score.current_meets_target === false ? (
                      <StatusPill tone="error" icon={XCircle}>Not met</StatusPill>
                    ) : (
                      <span className="text-text-disabled">Not recorded</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={change?.tone ?? 'neutral'} icon={change?.icon ?? Minus}>
                      {score.change_category || 'Not recorded'}
                    </StatusPill>
                    {score.percent_change != null && (
                      <p className="font-clinical mt-1 text-xs text-muted-foreground">
                        {score.percent_change > 0 ? '+' : ''}
                        {score.percent_change.toFixed(1)}%
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={(score.gap_category && GAP_TONE[score.gap_category]) || 'neutral'}>
                      {score.gap_category || 'Not recorded'}
                    </StatusPill>
                    {score.target_gap != null && (
                      <p className="font-clinical mt-1 text-xs text-muted-foreground">{score.target_gap.toFixed(1)}%</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      {/* Dynamic: the colour comes from the scoring rule configured on the server. */}
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: score.score_color }}
                        aria-hidden="true"
                      />
                      <span className="font-clinical font-semibold text-foreground">{score.final_score}</span>
                      <span className="text-muted-foreground">{score.score_label}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
