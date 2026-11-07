'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Download, PenLine, Search, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layouts/dashboard-shell';
import { PageCard } from '@/components/layouts/page-card';
import { StatusPill } from '@/components/common/status-pill';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { TableSkeleton } from '@/components/common/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { indicatorService, Indicator } from '@/lib/indicator-service';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'active' | 'inactive' | 'dhis2' | 'calculated';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All indicators',
  active: 'Active only',
  inactive: 'Inactive only',
  dhis2: 'From DHIMS2',
  calculated: 'Calculated',
};

interface ObjectiveGroup {
  id: number;
  name: string;
  indicators: Indicator[];
}

const COLUMN_COUNT = 8;

export default function IndicatorsPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [objectives, setObjectives] = useState<ObjectiveGroup[]>([]);

  const fetchIndicators = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const data = await indicatorService.getIndicatorsForDefinitions();
      setObjectives(data.objectives);
    } catch (err) {
      console.error('Failed to fetch indicators:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  const totalIndicators = useMemo(
    () => objectives.reduce((sum, obj) => sum + obj.indicators.length, 0),
    [objectives]
  );

  const filteredObjectives = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return objectives
      .map((objective) => ({
        ...objective,
        indicators: objective.indicators
          .filter((indicator) => {
            const matchesSearch =
              term === '' ||
              indicator.name?.toLowerCase().includes(term) ||
              indicator.description?.toLowerCase().includes(term) ||
              indicator.indicator_number?.toLowerCase().includes(term);

            const matchesFilter =
              filterType === 'all' ||
              (filterType === 'active' && indicator.is_active) ||
              (filterType === 'inactive' && !indicator.is_active) ||
              (filterType === 'dhis2' && !!indicator.dhis2_uid) ||
              (filterType === 'calculated' && indicator.indicator_type === 'calculated');

            return matchesSearch && matchesFilter;
          })
          .sort((a, b) => a.display_order - b.display_order),
      }))
      .filter((objective) => objective.indicators.length > 0);
  }, [objectives, searchTerm, filterType]);

  const filteredCount = filteredObjectives.reduce((sum, obj) => sum + obj.indicators.length, 0);
  const isFiltered = searchTerm.trim() !== '' || filterType !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
  };

  const handleDownloadCsv = () => {
    const rows: string[][] = [
      ['Objective', 'Number', 'Indicator', 'Definition', 'Numerator', 'Denominator', 'Calculation', 'Source of data', 'Target', 'DHIMS2 ID', 'Active'],
    ];
    filteredObjectives.forEach((objective) => {
      objective.indicators.forEach((ind) => {
        rows.push([
          objective.name,
          ind.indicator_number ?? '',
          ind.name ?? '',
          ind.description ?? '',
          ind.numerator ?? '',
          ind.denominator ?? '',
          ind.formula ?? '',
          ind.source_of_data ?? '',
          ind.target_display || (ind.target_value != null ? String(ind.target_value) : ''),
          ind.dhis2_uid ?? '',
          ind.is_active ? 'Yes' : 'No',
        ]);
      });
    });
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicator-definitions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filteredCount} ${filteredCount === 1 ? 'indicator' : 'indicators'}`);
  };

  return (
    <PageContainer>
      <PageCard
        title="Indicator definitions"
        description="What each health indicator measures, how it is calculated and the target it is scored against."
        actions={
          <Button variant="outline" onClick={handleDownloadCsv} disabled={loading || failed || filteredCount === 0}>
            <Download aria-hidden="true" />
            Download CSV
          </Button>
        }
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Toolbar band */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-subtle px-4 py-3">
          <div className="relative w-full max-w-sm">
            <label htmlFor="indicator-search" className="sr-only">
              Search indicators
            </label>
            <Input
              id="indicator-search"
              placeholder="Search by name, number or definition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <Search className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-48" aria-label="Filter indicators">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FILTER_LABELS) as FilterType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {FILTER_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && !failed && (
            <span className="ml-auto text-sm text-muted-foreground">
              Showing <span className="font-clinical text-foreground">{filteredCount}</span> of{' '}
              <span className="font-clinical text-foreground">{totalIndicators}</span>
            </span>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : failed ? (
          <ErrorState
            title="We couldn't load the indicator definitions"
            message="Check your internet connection and try again."
            onRetry={fetchIndicators}
          />
        ) : filteredObjectives.length === 0 ? (
          isFiltered ? (
            <EmptyState
              illustration="no-results"
              title="Nothing matches these filters"
              description="Try a different search, or show all indicators."
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          ) : (
            <EmptyState
              illustration="empty-list"
              title="No indicators set up yet"
              description="Indicators are added by an administrator. Once they are, their definitions will appear here."
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-surface-subtle">
                <tr className="border-b border-border text-xs font-medium text-foreground">
                  <th scope="col" className="w-16 px-4 py-2.5 text-left font-medium">#</th>
                  <th scope="col" className="w-[20%] px-4 py-2.5 text-left font-medium">Indicator</th>
                  <th scope="col" className="w-[22%] px-4 py-2.5 text-left font-medium">Definition</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Numerator</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Denominator</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Calculation</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Source of data</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredObjectives.map((objective) => (
                  <React.Fragment key={objective.id}>
                    <tr className="sheet-row-objective border-b border-border">
                      <th scope="colgroup" colSpan={COLUMN_COUNT} className="px-4 py-2.5 text-left text-sm font-semibold">
                        {objective.name}
                      </th>
                    </tr>
                    {objective.indicators.map((indicator) => {
                      const inactive = !indicator.is_active;
                      return (
                        <tr key={indicator.id} className="border-b border-border/60 align-top transition-colors hover:bg-surface-muted/60">
                          <td className="font-clinical px-4 py-3 text-muted-foreground">
                            {indicator.indicator_number || `${objective.id}.${indicator.display_order || indicator.id}`}
                          </td>
                          <td className="px-4 py-3">
                            <p className={cn('font-medium', inactive ? 'text-muted-foreground' : 'text-foreground')}>{indicator.name}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {indicator.dhis2_uid ? (
                                <StatusPill tone="info" icon={Database} title={`DHIMS2 ID: ${indicator.dhis2_uid}`}>
                                  DHIMS2
                                </StatusPill>
                              ) : (
                                <StatusPill tone="neutral" icon={PenLine}>
                                  Entered by hand
                                </StatusPill>
                              )}
                              {inactive && (
                                <StatusPill tone="error" icon={XCircle}>
                                  Inactive
                                </StatusPill>
                              )}
                            </div>
                            {indicator.dhis2_uid && (
                              <p className="font-clinical mt-1 text-xs text-muted-foreground">{indicator.dhis2_uid}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {indicator.description || <NotRecorded label="No definition yet" />}
                          </td>
                          <td className="px-4 py-3 text-foreground">{indicator.numerator || <NotRecorded />}</td>
                          <td className="px-4 py-3 text-foreground">{indicator.denominator || <NotRecorded />}</td>
                          <td className="font-clinical px-4 py-3 text-foreground">{indicator.formula || <NotRecorded />}</td>
                          <td className="px-4 py-3 text-foreground">{indicator.source_of_data || <NotRecorded />}</td>
                          <td className="font-clinical px-4 py-3 text-right font-medium text-foreground">
                            {indicator.target_display || (indicator.target_value != null ? indicator.target_value.toString() : <NotRecorded />)}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function NotRecorded({ label = '—' }: { label?: string }) {
  return <span className="text-text-disabled">{label}</span>;
}

function csvCell(value: string): string {
  const v = value.replace(/\r?\n/g, ' ');
  return /[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
