'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, Clock, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { generatePeriods, Period } from '@/lib/assessment-service';

interface PeriodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPeriodsSelected: (periods: Period[]) => void;
  selectedPeriods?: Period[];
}

const periodTypeOptions = [
  { value: 'Yearly', label: 'Yearly', icon: Calendar },
  { value: 'Quarterly', label: 'Quarterly', icon: CalendarDays },
  { value: 'SixMonthly', label: 'Six-monthly', icon: CalendarDays },
  { value: 'SixMonthlyApril', label: 'Six-monthly April', icon: CalendarDays },
  { value: 'SixMonthlyNov', label: 'Six-monthly Nov', icon: CalendarDays },
  { value: 'BiMonthly', label: 'Bi-monthly', icon: CalendarDays },
  { value: 'Monthly', label: 'Monthly', icon: Clock },
];

export default function PeriodSelectionModal({
  isOpen,
  onClose,
  onPeriodsSelected,
  selectedPeriods = []
}: PeriodSelectionModalProps) {
  const [periodType, setPeriodType] = useState('Quarterly');
  const [year, setYear] = useState(2023);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [selectedPeriodsList, setSelectedPeriodsList] = useState<Period[]>([]);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedSelectedIds, setSelectedSelectedIds] = useState<string[]>([]);

  // Generate periods for the specific year only
  useEffect(() => {
    const periods = generatePeriods(periodType, year);
    // Filter out periods that are already selected
    const filteredPeriods = periods.filter(period => 
      !selectedPeriodsList.some(selected => selected.id === period.id)
    );
    setAvailablePeriods(filteredPeriods);
  }, [periodType, year, selectedPeriodsList]);

  // Initialize selected periods
  useEffect(() => {
    setSelectedPeriodsList(selectedPeriods);
  }, [selectedPeriods]);

  const handleAvailablePeriodToggle = (periodId: string) => {
    setSelectedAvailableIds(prev => 
      prev.includes(periodId) 
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
  };

  const handleSelectedPeriodToggle = (periodId: string) => {
    setSelectedSelectedIds(prev => 
      prev.includes(periodId) 
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    );
  };

  const moveToSelected = () => {
    const periodsToMove = availablePeriods.filter(p => selectedAvailableIds.includes(p.id));
    setSelectedPeriodsList(prev => [...prev, ...periodsToMove]);
    setSelectedAvailableIds([]);
  };

  const moveToAvailable = () => {
    const periodsToMove = selectedPeriodsList.filter(p => selectedSelectedIds.includes(p.id));
    setSelectedPeriodsList(prev => prev.filter(p => !selectedSelectedIds.includes(p.id)));
    setSelectedSelectedIds([]);
  };

  const moveAllToSelected = () => {
    setSelectedPeriodsList(prev => [...prev, ...availablePeriods]);
    setSelectedAvailableIds([]);
  };

  const moveAllToAvailable = () => {
    setSelectedPeriodsList([]);
    setSelectedSelectedIds([]);
  };

  const handleConfirmSelection = () => {
    onPeriodsSelected(selectedPeriodsList);
    onClose();
  };

  const getPeriodTypeLabel = (type: string) => {
    const option = periodTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="h-5 w-5" style={{ color: '#265380' }} />
            Period
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="fixed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger 
                value="relative" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm"
              >
                Relative periods
              </TabsTrigger>
              <TabsTrigger 
                value="fixed" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                Fixed periods
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="fixed" className="mt-6">
              {/* Period Type and Year Selection */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="period-type" className="text-sm font-medium text-gray-700">Period type</Label>
                  <Select value={periodType} onValueChange={setPeriodType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodTypeOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="year" className="text-sm font-medium text-gray-700">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min={2020}
                    max={2030}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Two Panel Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Periods Panel */}
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    {availablePeriods.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availablePeriods.map((period) => (
                          <div
                            key={period.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedAvailableIds.includes(period.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleAvailablePeriodToggle(period.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-800">
                                  {period.displayName}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span>No {getPeriodTypeLabel(periodType)} periods available for {year}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Arrow Buttons */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={moveToSelected}
                      disabled={selectedAvailableIds.length === 0}
                      className="w-10 h-10 p-0 bg-gray-100 border-gray-300 hover:bg-gray-200"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={moveAllToSelected}
                      disabled={availablePeriods.length === 0}
                      className="w-10 h-10 p-0 bg-gray-100 border-gray-300 hover:bg-gray-200"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                      <ChevronRight className="h-4 w-4 text-gray-600 -ml-1" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={moveToAvailable}
                      disabled={selectedSelectedIds.length === 0}
                      className="w-10 h-10 p-0 bg-gray-100 border-gray-300 hover:bg-gray-200"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={moveAllToAvailable}
                      disabled={selectedPeriodsList.length === 0}
                      className="w-10 h-10 p-0 bg-gray-100 border-gray-300 hover:bg-gray-200"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                      <ChevronLeft className="h-4 w-4 text-gray-600 -ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Selected Periods Panel */}
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-gray-800">Selected Periods</h3>
                    </div>
                    {selectedPeriodsList.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedPeriodsList.map((period) => (
                          <div
                            key={period.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedSelectedIds.includes(period.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-green-200 bg-green-50'
                            }`}
                            onClick={() => handleSelectedPeriodToggle(period.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-green-600" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-800">
                                  {period.displayName}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span>No periods selected</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="relative" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                <span>Relative periods functionality coming soon...</span>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Hide
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedPeriodsList.length === 0}
              style={{ backgroundColor: '#265380', color: 'white' }}
              className="hover:opacity-90"
            >
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 