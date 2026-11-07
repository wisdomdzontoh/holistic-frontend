'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/components/common/form-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { TableSkeleton } from '@/components/common/skeletons';
import { assessmentService } from '@/lib/assessment-service';
import { cn } from '@/lib/utils';

interface SavedItem {
  id: string;
  name: string;
  org_unit_id: string;
  org_unit_name: string;
  created_at: string;
  updated_at?: string;
}

interface DHIS2OrgUnit {
  id: string;
  name: string;
  displayName: string;
  level: number;
  children?: DHIS2OrgUnit[];
}

type Ordering = 'name' | '-name' | 'created_at' | '-created_at';

const ORDERING_LABELS: Record<Ordering, string> = {
  '-created_at': 'Newest first',
  created_at: 'Oldest first',
  name: 'Name (A to Z)',
  '-name': 'Name (Z to A)',
};

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
}

export function OpenAssessmentModal({
  isOpen,
  onClose,
  onOpenAssessment,
  orgUnitId,
  dhis2OrgUnitsFlat = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAssessment: (assessmentId: string) => void;
  orgUnitId?: string;
  dhis2OrgUnitsFlat?: DHIS2OrgUnit[];
}) {
  const [items, setItems] = useState<SavedItem[]>([]);
  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [ordering, setOrdering] = useState<Ordering>('-created_at');
  const owner = 'mine' as const; // Users can only see their own assessments
  const abortRef = useRef<AbortController | null>(null);

  const getOrgUnitDisplayName = (id: string): string => {
    const find = (units: DHIS2OrgUnit[]): DHIS2OrgUnit | undefined => {
      for (const unit of units) {
        if (unit.id === id) return unit;
        if (unit.children && unit.children.length > 0) {
          const found = find(unit.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const orgUnit = find(dhis2OrgUnitsFlat);
    return orgUnit ? (orgUnit.displayName || orgUnit.name) : '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cancel in-flight request for snappy refresh
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const res = await assessmentService.getSavedAssessments({ org_unit_id: orgUnitId, page, size: pageSize, search: filter, ordering, owner }, abortRef.current.signal);
      setItems(res.results || []);
      setCount(res.count || 0);
      // If current page is now out of range after a change (e.g. deletion/filter), snap to last page
      const totalPagesNow = Math.max(1, Math.ceil((res.count || 0) / pageSize));
      if (page > totalPagesNow) {
        setPage(totalPagesNow);
      }
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') {
        console.error('Failed to load saved assessments', e);
        toast.error("We couldn't load your saved assessments. Try again.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input -> updates filter
  useEffect(() => {
    const t = setTimeout(() => setFilter(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset selection and fetch fresh when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch on parameter changes while open
  useEffect(() => {
    if (isOpen) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgUnitId, page, pageSize, filter, ordering]);

  useEffect(() => { setPage(1); }, [filter, pageSize, ordering]);

  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  const rangeStart = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, count);

  const openSelected = () => {
    if (!selectedId) return;
    onOpenAssessment(selectedId);
    onClose();
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Open a saved assessment"
      description="Choose one of your saved assessments to carry on working on it."
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={openSelected} disabled={!selectedId}>
            <FolderOpen aria-hidden="true" />
            Open assessment
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border">
        {/* Toolbar band */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-subtle px-4 py-3">
          <div className="relative w-full max-w-sm flex-1">
            <label htmlFor="saved-search" className="sr-only">Search saved assessments</label>
            <Input
              id="saved-search"
              placeholder="Search by name or facility"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
            <Search className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>
          <Select value={ordering} onValueChange={(v) => setOrdering(v as Ordering)}>
            <SelectTrigger className="w-40" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORDERING_LABELS) as Ordering[]).map((key) => (
                <SelectItem key={key} value={key}>{ORDERING_LABELS[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw className={cn(loading && 'animate-spin')} aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        {loading && items.length === 0 ? (
          <TableSkeleton rows={5} columns={5} />
        ) : items.length === 0 ? (
          filter ? (
            <EmptyState
              illustration="no-results"
              title={`No saved assessment matches “${filter}”`}
              description="Check the spelling, or search by facility name instead."
              action={{ label: 'Clear search', onClick: () => setSearchTerm('') }}
            />
          ) : (
            <EmptyState
              illustration="assessment"
              title="No saved assessments yet"
              description="Generate a report and select “Save assessment” — it will then appear here."
            />
          )
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-surface-subtle">
                <tr className="border-b border-border text-xs text-foreground">
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Assessment</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Facility</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Created</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Last changed</th>
                  <th scope="col" className="w-14 px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isSelected = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={cn('table-row-interactive border-b border-border/60', isSelected && 'table-row-selected')}
                      onClick={() => setSelectedId(item.id)}
                      onDoubleClick={() => {
                        onOpenAssessment(item.id);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openSelected();
                        if (e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(item.id);
                        }
                      }}
                      tabIndex={0}
                      aria-selected={isSelected}
                    >
                      <td className="px-4 py-3">
                        <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-foreground')}>{item.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          {getOrgUnitDisplayName(item.org_unit_id) || item.org_unit_name || item.org_unit_id}
                        </span>
                      </td>
                      <td className="font-clinical px-4 py-3 text-muted-foreground">{formatDate(item.created_at)}</td>
                      <td className="font-clinical px-4 py-3 text-muted-foreground">
                        {item.updated_at ? formatDate(item.updated_at) : <span className="font-sans text-text-disabled">Not changed</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-error-bg hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(item);
                          }}
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: range + pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Showing <span className="font-clinical text-foreground">{rangeStart}–{rangeEnd}</span> of{' '}
              <span className="font-clinical text-foreground">{count}</span>
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1); }}>
              <SelectTrigger className="h-8 w-20" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hidden sm:inline">per page</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <span className="text-muted-foreground">
              Page <span className="font-clinical text-foreground">{page}</span> of <span className="font-clinical text-foreground">{totalPages}</span>
            </span>
            <Button variant="secondary" size="icon-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete “${pendingDelete?.name ?? ''}”?`}
        description="This can't be undone. The saved values, scores and remarks will be removed for good."
        cancelLabel="Keep assessment"
        confirmLabel="Yes, delete assessment"
        pendingLabel="Deleting…"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await assessmentService.deleteAssessment({ assessment_id: pendingDelete.id });
          } catch (error) {
            console.error('Failed to delete assessment', error);
            toast.error("We couldn't delete that assessment. Try again in a moment.");
            throw error;
          }
          if (selectedId === pendingDelete.id) setSelectedId(null);
          toast.success(`Deleted “${pendingDelete.name}”.`);
          await fetchData();
        }}
      />
    </FormDialog>
  );
}

/** Small "name this assessment" prompt. */
export function NameAssessmentModal({
  isOpen,
  onClose,
  defaultName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName || '');
  useEffect(() => setName(defaultName || ''), [defaultName, isOpen]);

  const submit = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      onClose();
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Name this assessment"
      size="sm"
      onSubmit={submit}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>Save name</Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <label htmlFor="assessment-name-prompt" className="text-sm font-medium text-foreground">Name</label>
        <Input
          id="assessment-name-prompt"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ho Municipal Hospital — 2025 review"
          autoFocus
        />
      </div>
    </FormDialog>
  );
}
