'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Circle, X, Download, Eye, Ban } from 'lucide-react';
import { toast } from 'sonner';

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
      toast.info('Cancelling - facilities not yet started will be skipped');
    } catch {
      toast.error('Failed to cancel the job');
    }
  };

  const handleDownload = async (item: BulkAssessmentJobItemSummary) => {
    if (!item.saved_assessment_id) return;
    setDownloadingId(item.id);
    try {
      const { blob, filename } = await assessmentService.exportSavedAssessmentExcel(item.saved_assessment_id);
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
      toast.error(error?.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const isRunning = job?.status === 'pending' || job?.status === 'in_progress';

  const statusIcon = (status: BulkAssessmentJobItemSummary['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-brand-teal animate-spin shrink-0" />;
      case 'skipped':
        return <Ban className="h-4 w-4 text-ink-muted shrink-0" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300 shrink-0" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-ink">Bulk generation progress</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {!job ? (
          <div className="py-10 flex items-center justify-center text-ink-muted">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink truncate">{job.name}</span>
                <Badge variant={job.status === 'failed' ? 'destructive' : 'secondary'} className="font-normal shrink-0 ml-2">
                  {job.status_display}
                </Badge>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${job.progress_percentage}%`, backgroundColor: 'var(--brand-navy)' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{job.processed_facilities} / {job.total_facilities} processed</span>
                <span>{job.succeeded_facilities} succeeded, {job.failed_facilities} failed</span>
              </div>
              {job.error_message && (
                <p className="text-xs text-red-600">{job.error_message}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg divide-y">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  {statusIcon(item.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink truncate">{item.org_unit_name}</p>
                    {item.error_message && (
                      <p className="text-xs text-red-600 truncate">{item.error_message}</p>
                    )}
                  </div>
                  {item.status === 'completed' && item.saved_assessment_id != null && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewAssessment(String(item.saved_assessment_id))}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId === item.id}
                      >
                        {downloadingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          {isRunning && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel remaining
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
