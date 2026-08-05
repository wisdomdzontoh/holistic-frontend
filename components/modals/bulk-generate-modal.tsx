'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

import {
  assessmentService,
  DHIS2OrgUnitGroup,
  Period,
} from '@/lib/assessment-service';
import PeriodSelectionModal from '@/components/modals/period-selection-modal';

interface BulkGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted: (jobId: number, totalFacilities: number) => void;
}

export function BulkGenerateModal({ isOpen, onClose, onStarted }: BulkGenerateModalProps) {
  const [groups, setGroups] = useState<DHIS2OrgUnitGroup[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([]);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingMeta(true);
    assessmentService.getDHIS2OrgUnitGroups()
      .then(setGroups)
      .catch(() => {
        toast.error('Could not load organisation unit groups from DHIS2');
      })
      .finally(() => setIsLoadingMeta(false));
  }, [isOpen]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleGenerate = async () => {
    if (!selectedGroupId) {
      toast.error('Select a group to generate assessments for');
      return;
    }
    if (selectedPeriods.length === 0) {
      toast.error('Select at least one period');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await assessmentService.startBulkAssessmentJob({
        org_unit_group_id: selectedGroupId,
        org_unit_group_name: selectedGroup?.name,
        periods: selectedPeriods,
      });
      toast.success(`Started generating assessments for ${result.total_facilities} facilities`);
      onStarted(result.job_id, result.total_facilities);
      onClose();
      setSelectedGroupId('');
      setSelectedPeriods([]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to start bulk generation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-ink">Bulk generate assessments</DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <p className="text-sm text-ink-muted">
              Generate a Holistic Assessment for every facility in a group, scoped to your own
              DHIS2 org unit access. Runs in the background, one facility at a time.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Select a group</label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoadingMeta}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingMeta ? 'Loading...' : 'e.g. District Hospital, CHPS'} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Periods</label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsPeriodModalOpen(true)}
              >
                <CalendarDays className="h-4 w-4 mr-2 text-ink-muted" />
                {selectedPeriods.length > 0 ? `${selectedPeriods.length} period(s) selected` : 'Select periods'}
              </Button>
              {selectedPeriods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedPeriods.map(period => (
                    <Badge key={period.code} variant="secondary" className="font-normal">
                      {period.displayName || period.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isSubmitting || !selectedGroupId || selectedPeriods.length === 0}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--brand-navy)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PeriodSelectionModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        onPeriodsSelected={(periods) => {
          setSelectedPeriods(periods);
          setIsPeriodModalOpen(false);
        }}
        selectedPeriods={selectedPeriods}
        maxPeriods={10}
      />
    </>
  );
}
