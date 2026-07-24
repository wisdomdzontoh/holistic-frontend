'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DHIS2PeriodGenerator, Period, PeriodType } from '@/lib/dhis2/periods';
import { Calendar, Clock, X, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

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
    { value: 'financialYear', label: 'Financial year (Start November)' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-800 text-lg font-semibold">Period</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex space-x-4 min-h-0 overflow-hidden">
          {/* Left Panel - Available Periods */}
          <div className="flex-1 flex flex-col border rounded-lg min-h-0">
            {/* Tabs */}
            <div className="flex border-b flex-shrink-0">
              <button className="px-4 py-2 text-sm text-gray-500 border-b-2 border-transparent">
                Relative periods
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-800 border-b-2" style={{ borderColor: 'var(--brand-navy)', color: 'var(--brand-navy)' }}>
                Fixed periods
              </button>
            </div>

            {/* Period Type and Year Selection */}
            <div className="p-4 space-y-4 flex-shrink-0">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period type</label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-9">
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
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-9">
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
            </div>

            {/* Available Periods List */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {availablePeriods.map(period => {
                    const isSelected = selectedAvailablePeriods.some(p => p.id === period.id);
                    return (
                      <div
                        key={period.id}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-brand-green/10 border border-brand-green/20' : ''
                        }`}
                        onClick={() => handleAvailablePeriodClick(period)}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-brand-green' : 'border-gray-300'
                        }`} style={isSelected ? { backgroundColor: 'var(--brand-navy)', borderColor: 'var(--brand-navy)' } : {}}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm text-gray-700">{period.displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Middle Panel - Transfer Controls */}
          <div className="flex flex-col justify-center space-y-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveToSelected}
              disabled={selectedAvailablePeriods.length === 0 || localSelectedPeriods.length >= maxPeriods}
              className="w-10 h-10 p-0 hover:bg-brand-green/10"
              style={{ borderColor: 'var(--brand-navy)', color: 'var(--brand-navy)' }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveAllToSelected}
              disabled={availablePeriods.length === 0 || localSelectedPeriods.length >= maxPeriods}
              className="w-10 h-10 p-0 hover:bg-brand-green/10"
              style={{ borderColor: 'var(--brand-navy)', color: 'var(--brand-navy)' }}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveToAvailable}
              disabled={selectedAvailablePeriods.length === 0}
              className="w-10 h-10 p-0 hover:bg-brand-green/10"
              style={{ borderColor: 'var(--brand-navy)', color: 'var(--brand-navy)' }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveAllToAvailable}
              disabled={localSelectedPeriods.length === 0}
              className="w-10 h-10 p-0 hover:bg-brand-green/10"
              style={{ borderColor: 'var(--brand-navy)', color: 'var(--brand-navy)' }}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Panel - Selected Periods */}
          <div className="flex-1 flex flex-col border rounded-lg min-h-0">
            <div className="p-4 border-b flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700">Selected Periods</h3>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
              {localSelectedPeriods.map(period => (
                    <div
                      key={period.id}
                      className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200"
                    >
                      <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <span className="text-sm text-green-700 flex-1">{period.displayName}</span>
                  <button
                        onClick={() => handleSelectedPeriodClick(period)}
                        className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                    </div>
                  ))}
                  {localSelectedPeriods.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No periods selected</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            </div>
          </div>

        {/* Bottom Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t bg-gray-50 px-4 py-3 -mx-6 -mb-6 sticky bottom-0">
                <Button
                  variant="outline"
            onClick={onClose}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Hide
                </Button>
          <Button 
            onClick={() => {
              onPeriodsSelected(localSelectedPeriods);
              onClose();
            }}
            className="text-white"
            style={{ backgroundColor: 'var(--brand-navy)' }}
          >
            Update
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 