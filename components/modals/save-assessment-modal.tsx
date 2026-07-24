'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Save, Plus, Edit } from 'lucide-react';

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
      setError('Please enter an assessment name');
      return;
    }

    setError('');
    try {
      await onSave(assessmentName.trim(), saveMode === 'update', existingAssessmentId);
      onClose();
    } catch (error) {
      setError('Failed to save assessment. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[50vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {saveMode === 'update' ? (
              <>
                <Edit className="h-5 w-5 text-brand-green" />
                Update Assessment
              </>
            ) : (
              <>
                <Save className="h-5 w-5 text-brand-green" />
                Save Assessment
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
          {/* Save Mode Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Save Mode</Label>
            <RadioGroup
              value={saveMode}
              onValueChange={(value) => setSaveMode(value as 'new' | 'update')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Save as New Assessment
                </Label>
              </div>
              {existingAssessmentId && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" />
                  <Label htmlFor="update" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Update Existing Assessment
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Assessment Name Input */}
          <div className="space-y-2">
            <Label htmlFor="assessment-name" className="text-sm font-medium">
              Assessment Name
            </Label>
            <Input
              id="assessment-name"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              placeholder="Enter assessment name..."
              disabled={isSaving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t bg-background flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !assessmentName.trim()}
            className="bg-brand-green hover:bg-brand-green/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {saveMode === 'update' ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                {saveMode === 'update' ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
