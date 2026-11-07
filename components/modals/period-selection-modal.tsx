'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormDialog } from '@/components/common/form-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { DHIS2PeriodGenerator, Period, PeriodType } from '@/lib/dhis2/periods';
import { cn } from '@/lib/utils';
import { CalendarCheck, Check, X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

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
  const [selectedType, setSelectedType] = useState<PeriodType>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [localSelectedPeriods, setLocalSelectedPeriods] = useState<Period[]>(selectedPeriods);
  const [selectedAvailablePeriods, setSelectedAvailablePeriods] = useState<Period[]>([]);

  useEffect(() => {
    const periods = DHIS2PeriodGenerator.generateFixedPeriods(selectedType, selectedYear);
    // Filter out already selected periods
    const filteredPeriods = periods.filter(period => 
      !localSelectedPeriods.some(selected => selected.id === period.id)
    );
    setAvailablePeriods(filteredPeriods);
  }, [selectedType, selectedYear, localSelectedPeriods]);

  useEffect(() => {
    setLocalSelectedPeriods(selectedPeriods);
  }, [selectedPeriods]);

  const handleTypeChange = (value: PeriodType) => {
    setSelectedType(value);
    setSelectedAvailablePeriods([]);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value));
    setSelectedAvailablePeriods([]);
  };

  const handleAvailablePeriodClick = (period: Period) => {
    setSelectedAvailablePeriods(prev => {
      const isSelected = prev.some(p => p.id === period.id);
      if (isSelected) {
        return prev.filter(p => p.id !== period.id);
      } else {
        return [...prev, period];
      }
    });
  };

  const handleSelectedPeriodClick = (period: Period) => {
    setLocalSelectedPeriods(prev => prev.filter(p => p.id !== period.id));
  };

  const handleMoveToSelected = () => {
    if (selectedAvailablePeriods.length > 0 && localSelectedPeriods.length < maxPeriods) {
      const periodsToAdd = selectedAvailablePeriods.slice(0, maxPeriods - localSelectedPeriods.length);
      setLocalSelectedPeriods(prev => [...prev, ...periodsToAdd]);
      setSelectedAvailablePeriods([]);
    }
  };

  const handleMoveToAvailable = () => {
    if (selectedAvailablePeriods.length > 0) {
      setLocalSelectedPeriods(prev => prev.filter(p => !selectedAvailablePeriods.some(sp => sp.id === p.id)));
      setSelectedAvailablePeriods([]);
    }
  };

  const handleMoveAllToSelected = () => {
    const periodsToAdd = availablePeriods.slice(0, maxPeriods - localSelectedPeriods.length);
    setLocalSelectedPeriods(prev => [...prev, ...periodsToAdd]);
    setSelectedAvailablePeriods([]);
  };

  const handleMoveAllToAvailable = () => {
    setLocalSelectedPeriods([]);
    setSelectedAvailablePeriods([]);
  };

  const years = Array.from(
    { length: 10 }, 
    (_, i) => selectedYear - 5 + i
  );

  const periodTypeOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'bimonthly', label: 'Bi-monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'sixmonthly', label: 'Six-monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'financialYear', label: 'Financial year (starts November)' }
  ];

  const atLimit = localSelectedPeriods.length >= maxPeriods;

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Choose periods"
      description={`Pick a period type and year, select periods on the left, then move them across. You can compare up to ${maxPeriods} periods.`}
      size="xl"
      fill
      footerStart={
        <span>
          <span className="font-clinical font-medium text-foreground">{localSelectedPeriods.length}</span> of{' '}
          <span className="font-clinical">{maxPeriods}</span> chosen
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onPeriodsSelected(localSelectedPeriods);
              onClose();
            }}
          >
            Use these periods
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
        {/* Available periods */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
          <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-border bg-surface-subtle p-3">
            <div className="space-y-1.5">
              <label htmlFor="period-type" className="text-xs font-medium text-foreground">Period type</label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger id="period-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="period-year" className="text-xs font-medium text-foreground">Year</label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger id="period-year" className="font-clinical">
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
          <ScrollArea className="min-h-0 flex-1">
            <ul className="space-y-0.5 p-2" aria-label="Available periods">
              {availablePeriods.map(period => {
                const isSelected = selectedAvailablePeriods.some(p => p.id === period.id);
                return (
                  <li key={period.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleAvailablePeriodClick(period)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'border-primary-border bg-primary-soft font-medium text-primary'
                          : 'border-transparent text-foreground hover:bg-surface-muted/60'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2',
                          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-card'
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {period.displayName}
                    </button>
                  </li>
                );
              })}
              {availablePeriods.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Every period for this year is already chosen.
                </li>
              )}
            </ul>
          </ScrollArea>
        </div>

        {/* Transfer controls */}
        <div className="flex shrink-0 flex-row items-center justify-center gap-2 md:flex-col">
          <TransferButton label="Add selected periods" onClick={handleMoveToSelected} disabled={selectedAvailablePeriods.length === 0 || atLimit}>
            <ChevronRight />
          </TransferButton>
          <TransferButton label="Add all periods" onClick={handleMoveAllToSelected} disabled={availablePeriods.length === 0 || atLimit}>
            <ChevronsRight />
          </TransferButton>
          <TransferButton label="Remove selected periods" onClick={handleMoveToAvailable} disabled={selectedAvailablePeriods.length === 0}>
            <ChevronLeft />
          </TransferButton>
          <TransferButton label="Remove all periods" onClick={handleMoveAllToAvailable} disabled={localSelectedPeriods.length === 0}>
            <ChevronsLeft />
          </TransferButton>
        </div>

        {/* Chosen periods */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface-subtle px-3 py-3">
            <h3 className="text-sm font-semibold text-foreground">Chosen periods</h3>
            {atLimit && <span className="status-pill status-pill-pending">Limit reached</span>}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <ul className="space-y-1.5 p-2" aria-label="Chosen periods">
              {localSelectedPeriods.map(period => (
                <li
                  key={period.id}
                  className="flex items-center gap-2.5 rounded-lg border border-primary-border bg-primary-soft px-2.5 py-2"
                >
                  <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex-1 text-sm font-medium text-primary">{period.displayName}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectedPeriodClick(period)}
                    className="rounded-md p-1 text-primary transition-colors hover:bg-primary/10"
                    aria-label={`Remove ${period.displayName}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {localSelectedPeriods.length === 0 && (
                <li>
                  <EmptyState
                    illustration="choose-first"
                    title="No periods chosen yet"
                    description="Select periods on the left and use the arrow to add them."
                    className="py-8"
                  />
                </li>
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </FormDialog>
  );
}

function TransferButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant="outline" size="icon" onClick={onClick} disabled={disabled} aria-label={label} className="rotate-90 md:rotate-0">
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
