'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Ban, CheckCircle2, Circle, Download, Eye, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FormDialog } from '@/components/common/form-dialog';
import { StatusPill, type PillTone } from '@/components/common/status-pill';
import { InlineNotice } from '@/components/common/inline-notice';
import { TableSkeleton } from '@/components/common/skeletons';
import {
  assessmentService,
  BulkAssessmentJobSummary,
  BulkAssessmentJobItemSummary,
} from '@/lib/assessment-service';

interface BulkGenerateProgressProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  onViewAssessment: (assessmentId: string) => void;
}

type ItemStatus = BulkAssessmentJobItemSummary['status'];

const ITEM_STATUS: Record<string, { label: string; tone: PillTone; icon: typeof CheckCircle2; spin?: boolean }> = {
  completed: { label: 'Done', tone: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'error', icon: XCircle },
  in_progress: { label: 'Working on it', tone: 'info', icon: Loader2, spin: true },
  skipped: { label: 'Skipped', tone: 'neutral', icon: Ban },
  pending: { label: 'Waiting', tone: 'pending', icon: Circle },
};

const JOB_TONE: Record<string, PillTone> = {
  pending: 'pending',
  in_progress: 'info',
  completed: 'success',
  completed_with_errors: 'warning',
  failed: 'error',
  cancelled: 'neutral',
};

export function BulkGenerateProgress({ isOpen, onClose, jobId, onViewAssessment }: BulkGenerateProgressProps) {
  const [job, setJob] = useState<BulkAssessmentJobSummary | null>(null);
  const [items, setItems] = useState<BulkAssessmentJobItemSummary[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const stopPollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopPollRef.current?.();
    setJob(null);
    setItems([]);

    if (!isOpen || jobId == null) return;

    stopPollRef.current = assessmentService.pollBulkAssessmentJob(
      jobId,
      (jobUpdate, itemsUpdate) => {
        setJob(jobUpdate);
        setItems(itemsUpdate);
      },
      (error) => {
        toast.error(error.message);
      }
    );

    return () => stopPollRef.current?.();
  }, [isOpen, jobId]);

  const handleCancel = async () => {
    if (jobId == null) return;
    try {
      await assessmentService.cancelBulkAssessmentJob(jobId);
      toast.info("Stopping — facilities that haven't started yet will be skipped.");
    } catch {
      toast.error("We couldn't stop the job. Try again.");
    }
  };

  const handleDownload = async (item: BulkAssessmentJobItemSummary) => {
    if (!item.saved_assessment_id) return;
    setDownloadingId(item.id);
    try {
      const { blob, filename } = await assessmentService.exportSavedAssessmentExcel(item.saved_assessment_id, item.org_unit_name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', filename);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "The download didn't work. Try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const isRunning = job?.status === 'pending' || job?.status === 'in_progress';

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Group progress"
      description="You can close this window — generation carries on in the background."
      size="lg"
      footer={
        <>
          {isRunning && (
            <Button variant="destructive-outline" onClick={handleCancel}>
              Stop remaining facilities
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {!job ? (
        <div className="space-y-4" aria-busy="true">
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            Loading progress…
          </div>
          <TableSkeleton rows={4} columns={3} className="rounded-xl border border-border" />
        </div>
      ) : (
        <>
          <div className="space-y-2.5 rounded-xl border border-border bg-surface-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-semibold text-foreground">{job.name}</span>
              <StatusPill tone={JOB_TONE[job.status] ?? 'neutral'}>{job.status_display}</StatusPill>
            </div>
            <Progress value={job.progress_percentage} aria-label="Overall progress" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-clinical text-foreground">{job.processed_facilities}</span> of{' '}
                <span className="font-clinical text-foreground">{job.total_facilities}</span> facilities done
              </span>
              <span>
                <span className="font-clinical text-success">{job.succeeded_facilities}</span> worked ·{' '}
                <span className="font-clinical text-error">{job.failed_facilities}</span> failed
              </span>
            </div>
            {job.error_message && <InlineNotice tone="error">{job.error_message}</InlineNotice>}
          </div>

          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border" aria-label="Facilities">
            {items.map(item => {
              const status = ITEM_STATUS[item.status as ItemStatus] ?? ITEM_STATUS.pending;
              const Icon = status.icon;
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.org_unit_name}</p>
                    {item.error_message && <p className="truncate text-xs text-error">{item.error_message}</p>}
                  </div>
                  <span className={`status-pill status-pill-${status.tone}`}>
                    <Icon className={status.spin ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} aria-hidden="true" />
                    {status.label}
                  </span>
                  {item.status === 'completed' && item.saved_assessment_id != null && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onViewAssessment(String(item.saved_assessment_id))}>
                        <Eye aria-hidden="true" />
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId === item.id}
                        aria-label={`Download Excel for ${item.org_unit_name}`}
                      >
                        {downloadingId === item.id ? <Loader2 className="animate-spin" /> : <Download />}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </FormDialog>
  );
}
