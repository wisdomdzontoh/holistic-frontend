'use client';

import React, { useState, useEffect } from 'react';
import { FilePlus2, Loader2, PenLine, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormDialog, FormDialogSection } from '@/components/common/form-dialog';
import { InlineNotice } from '@/components/common/inline-notice';

interface SaveAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, isUpdate: boolean, assessmentId?: string) => Promise<void>;
  existingAssessmentId?: string;
  existingAssessmentName?: string;
  isSaving: boolean;
}

export function SaveAssessmentModal({
  isOpen,
  onClose,
  onSave,
  existingAssessmentId,
  existingAssessmentName,
  isSaving
}: SaveAssessmentModalProps) {
  const [assessmentName, setAssessmentName] = useState('');
  const [saveMode, setSaveMode] = useState<'new' | 'update'>('new');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingAssessmentId && existingAssessmentName) {
        setAssessmentName(existingAssessmentName);
        setSaveMode('update');
      } else {
        setAssessmentName('');
        setSaveMode('new');
      }
      setError('');
    }
  }, [isOpen, existingAssessmentId, existingAssessmentName]);

  const handleSave = async () => {
    if (!assessmentName.trim()) {
      setError('Give the assessment a name so you can find it later.');
      return;
    }

    setError('');
    try {
      await onSave(assessmentName.trim(), saveMode === 'update', existingAssessmentId);
      onClose();
    } catch {
      setError("The assessment wasn't saved. Your work is still on screen — try again.");
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const isUpdate = saveMode === 'update';

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={isUpdate ? 'Update saved assessment' : 'Save assessment'}
      description="Saving keeps the values, scores and remarks so you can open them again or analyse them later."
      size="sm"
      onSubmit={handleSave}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !assessmentName.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                {isUpdate ? 'Updating…' : 'Saving…'}
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                {isUpdate ? 'Update assessment' : 'Save assessment'}
              </>
            )}
          </Button>
        </>
      }
    >
      {existingAssessmentId && (
        <FormDialogSection title="How to save">
          <RadioGroup
            value={saveMode}
            onValueChange={(value) => setSaveMode(value as 'new' | 'update')}
            className="gap-2"
          >
            <label className="choice-option">
              <RadioGroupItem value="update" id="save-update" />
              <PenLine className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Update “{existingAssessmentName}”
                <span className="block text-xs font-normal text-muted-foreground">Replaces what was saved before.</span>
              </span>
            </label>
            <label className="choice-option">
              <RadioGroupItem value="new" id="save-new" />
              <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Save as a new assessment
                <span className="block text-xs font-normal text-muted-foreground">Keeps the earlier one as it was.</span>
              </span>
            </label>
          </RadioGroup>
        </FormDialogSection>
      )}

      <div className="space-y-1.5">
        <label htmlFor="assessment-name" className="text-sm font-medium text-foreground">
          Assessment name
        </label>
        <Input
          id="assessment-name"
          value={assessmentName}
          onChange={(e) => setAssessmentName(e.target.value)}
          placeholder="e.g. Ho Municipal Hospital — 2025 review"
          disabled={isSaving}
          aria-invalid={!!error && !assessmentName.trim()}
          autoFocus
        />
      </div>

      {error && <InlineNotice tone="error">{error}</InlineNotice>}
    </FormDialog>
  );
}
