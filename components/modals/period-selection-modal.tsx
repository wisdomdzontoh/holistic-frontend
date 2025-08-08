'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DHIS2PeriodGenerator, Period, PeriodType } from '@/lib/dhis2/periods';
import { Calendar, Clock, X } from 'lucide-react';

interface PeriodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPeriodsSelected: (periods: Period[]) => void;
  selectedPeriods?: Period[];
  maxPeriods?: number;
}

export default function PeriodSelectionModal({
  isOpen,
  onClose,
  onPeriodsSelected,
  selectedPeriods = [],
  maxPeriods = 3
}: PeriodSelectionModalProps) {
  const [selectedType, setSelectedType] = useState<PeriodType>('yearly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [localSelectedPeriods, setLocalSelectedPeriods] = useState<Period[]>(selectedPeriods);

  useEffect(() => {
    const periods = DHIS2PeriodGenerator.generateFixedPeriods(selectedType, selectedYear);
    setAvailablePeriods(periods);
  }, [selectedType, selectedYear]);

  useEffect(() => {
    setLocalSelectedPeriods(selectedPeriods);
  }, [selectedPeriods]);

  const handleTypeChange = (value: PeriodType) => {
    setSelectedType(value);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value));
  };

  const handlePeriodSelect = (period: Period) => {
    if (localSelectedPeriods.length < maxPeriods) {
      const newPeriods = [...localSelectedPeriods, period].sort((a, b) => 
        a.startDate.localeCompare(b.startDate)
      );
      setLocalSelectedPeriods(newPeriods);
    }
  };

  const handlePeriodRemove = (periodId: string) => {
    setLocalSelectedPeriods(prev => prev.filter(p => p.id !== periodId));
  };

  const handleSave = () => {
    onPeriodsSelected(localSelectedPeriods);
    onClose();
  };

  const years = Array.from(
    { length: 10 }, 
    (_, i) => selectedYear - 5 + i
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Assessment Periods</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period Type</label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="sixmonthly">Six-Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Selected Periods ({localSelectedPeriods.length}/{maxPeriods})
            </label>
            <div className="flex flex-wrap gap-2">
              {localSelectedPeriods.map(period => (
                <Badge key={period.id} variant="secondary" className="gap-2">
                  <Calendar className="h-3 w-3" />
                  {period.displayName}
                  <button
                    onClick={() => handlePeriodRemove(period.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[200px] border rounded-md p-4">
            <div className="grid grid-cols-2 gap-2">
              {availablePeriods.map(period => (
                <Button
                  key={period.id}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  disabled={localSelectedPeriods.some(p => p.id === period.id)}
                  onClick={() => handlePeriodSelect(period)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {period.displayName}
                </Button>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 