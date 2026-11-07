'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/components/common/form-dialog';
import { InlineNotice } from '@/components/common/inline-notice';
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
  const [groupsFailed, setGroupsFailed] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([]);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingMeta(true);
    setGroupsFailed(false);
    assessmentService.getDHIS2OrgUnitGroups()
      .then(setGroups)
      .catch(() => {
        setGroupsFailed(true);
      })
      .finally(() => setIsLoadingMeta(false));
  }, [isOpen]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleGenerate = async () => {
    if (!selectedGroupId) {
      toast.error('Choose a group first.');
      return;
    }
    if (selectedPeriods.length === 0) {
      toast.error('Choose at least one period.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await assessmentService.startBulkAssessmentJob({
        org_unit_group_id: selectedGroupId,
        org_unit_group_name: selectedGroup?.name,
        periods: selectedPeriods,
      });
      toast.success(`Started — generating assessments for ${result.total_facilities} facilities.`);
      onStarted(result.job_id, result.total_facilities);
      onClose();
      setSelectedGroupId('');
      setSelectedPeriods([]);
    } catch (error: any) {
      toast.error(error?.message || "We couldn't start generating. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title="Generate for a whole group"
        description="Creates and saves an assessment for every facility in a group you can access in DHIMS2. It runs in the background, one facility at a time."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isSubmitting || !selectedGroupId || selectedPeriods.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Starting…
                </>
              ) : (
                'Start generating'
              )}
            </Button>
          </>
        }
      >
        {groupsFailed && (
          <InlineNotice tone="error">
            We couldn&apos;t load the facility groups from DHIMS2. Close this window and try again.
          </InlineNotice>
        )}

        <div className="space-y-1.5">
          <label htmlFor="bulk-group" className="text-sm font-medium text-foreground">Facility group</label>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoadingMeta || groupsFailed}>
            <SelectTrigger id="bulk-group" className="h-10">
              <SelectValue placeholder={isLoadingMeta ? 'Loading groups…' : 'e.g. District Hospital, CHPS'} />
            </SelectTrigger>
            <SelectContent>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Periods</span>
          <button
            type="button"
            onClick={() => setIsPeriodModalOpen(true)}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-input bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/45 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className={selectedPeriods.length > 0 ? 'flex-1 text-sm font-medium text-foreground' : 'flex-1 text-sm text-muted-foreground'}>
              {selectedPeriods.length > 0
                ? `${selectedPeriods.length} ${selectedPeriods.length === 1 ? 'period' : 'periods'} chosen`
                : 'Choose periods'}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
          </button>
          {selectedPeriods.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {selectedPeriods.map(period => (
                <li
                  key={period.code}
                  className="rounded-full border border-primary-border bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {period.displayName || period.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormDialog>

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
