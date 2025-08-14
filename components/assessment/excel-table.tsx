'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Edit3 } from 'lucide-react';
import { AssessmentData, Period } from '@/lib/assessment-service';

interface ExcelTableProps {
  multiPeriodData: AssessmentData[] | null;
  selectedPeriods: Period[];
  onCellEdit: (indicatorId: number, period: string, value: string) => void;
  onScoreChange: (indicatorId: number, score: string) => void;
  onMilestoneScoreChange?: (objectiveId: number, score: string) => void;
  onRemarksChange?: (indicatorId: number, remarks: string) => void;
  onMilestoneRemarksChange?: (objectiveId: number, remarks: string) => void;
}

interface CellData {
  value: string;
  isEditable: boolean;
  isDHIS2Data: boolean;
}



export default function ExcelTable({ 
  multiPeriodData, 
  selectedPeriods, 
  onCellEdit, 
  onScoreChange,
  onMilestoneScoreChange,
  onRemarksChange,
  onMilestoneRemarksChange
}: ExcelTableProps) {
  const [cellData, setCellData] = useState<Record<string, CellData>>({});

  // Initialize cell data when multiPeriodData changes
  useEffect(() => {
    if (multiPeriodData && multiPeriodData.length > 0) {
      const newCellData: Record<string, CellData> = {};
      
      multiPeriodData.forEach((periodData) => {
        periodData.objectives.forEach((objective) => {
          
          objective.indicators.forEach((indicator) => {
            // Debug: Log indicator data_values
            console.log(`ExcelTable: Indicator ${indicator.id} (${indicator.name}) data_values:`, indicator.data_values);
            
            // Performance trend columns (period data)
            selectedPeriods.forEach((period) => {
              // Use period.code instead of period.name to match backend data keys
              const periodKey = period.code || period.name;
              const cellKey = `${indicator.id}_${periodKey}`;
              const dataValue = indicator.data_values && indicator.data_values[periodKey];
              
              // Debug: Log individual period data
              console.log(`ExcelTable: Period ${periodKey} data for indicator ${indicator.id}:`, dataValue);
              
              // Check if this is DHIS2 data (has dhis2_uid) or manual data
              const isDHIS2Data = !!indicator.dhis2_uid;
              const hasValue = dataValue && dataValue.value !== null && dataValue.value !== undefined;
              
              newCellData[cellKey] = {
                value: hasValue && dataValue.value !== null ? dataValue.value.toString() : '',
                isEditable: !isDHIS2Data, // Editable if not DHIS2 data
                isDHIS2Data: isDHIS2Data
              };
            });
            
            // Change column (computed in page logic; fallback client derivation if absent)
            const changeKey = `${indicator.id}_change`;
            newCellData[changeKey] = {
              value: indicator.score?.percent_change !== undefined && indicator.score?.percent_change !== null
                ? `${indicator.score?.percent_change}%`
                : '',
              isEditable: false,
              isDHIS2Data: false
            };
            
            // P-T Gap Analysis column (computed in page logic)
            const gapKey = `${indicator.id}_gap`;
            newCellData[gapKey] = {
              value: indicator.score?.target_gap !== undefined && indicator.score?.target_gap !== null
                ? `${indicator.score?.target_gap}%`
                : '',
              isEditable: false,
              isDHIS2Data: false
            };
            
            // Target column - display target_display but keep target_value for scoring
            const targetKey = `${indicator.id}_target`;
            newCellData[targetKey] = {
              value: indicator.target_display || indicator.target_value?.toString() || '',
              isEditable: false,
              isDHIS2Data: false
            };
            
                         // Assessed score column
             const scoreKey = `${indicator.id}_score`;
             newCellData[scoreKey] = {
               value: indicator.score?.score?.toString() || '-2.00',
               isEditable: true,
               isDHIS2Data: false
             };
             
             // Remarks column
             const remarksKey = `${indicator.id}_remarks`;
             newCellData[remarksKey] = {
               value: indicator.score?.remarks || '',
               isEditable: true,
               isDHIS2Data: false
             };
          });
        });
             });
       
       // Add milestone remarks
       multiPeriodData.forEach((periodData) => {
         periodData.objectives.forEach((objective) => {
           if (objective.milestone) {
             const milestoneRemarksKey = `milestone_${objective.id}_remarks`;
             newCellData[milestoneRemarksKey] = {
               value: objective.milestone.notes || '',
               isEditable: true,
               isDHIS2Data: false
             };
           }
         });
       });
       
       setCellData(newCellData);
     }
   }, [multiPeriodData, selectedPeriods]);

  const handleCellChange = (cellKey: string, value: string) => {
    setCellData(prev => ({
      ...prev,
      [cellKey]: { ...prev[cellKey], value }
    }));
    
    // Parse cell key to get indicator ID and period/column
    const [indicatorId, column] = cellKey.split('_');
    
    if (column === 'score') {
      onScoreChange(parseInt(indicatorId), value);
    } else if (column === 'remarks') {
      if (onRemarksChange) {
        onRemarksChange(parseInt(indicatorId), value);
      }
    } else if (selectedPeriods.some(p => (p.code || p.name) === column)) {
      onCellEdit(parseInt(indicatorId), column, value);
    }
  };

  const handleMilestoneScoreChange = (objectiveId: number, value: string) => {
    if (onMilestoneScoreChange) {
      onMilestoneScoreChange(objectiveId, value);
    }
  };

  const handleMilestoneRemarksChange = (objectiveId: number, value: string) => {
    if (onMilestoneRemarksChange) {
      onMilestoneRemarksChange(objectiveId, value);
    }
  };



  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '#6c757d';
    
    // New color scheme: 2 (Dark Green), 1 (Light Green), 0 (Yellow), -1 (Light Red), -2 (Red)
    if (numScore >= 2) return '#548235';
    if (numScore >= 1) return '#A9D08E';
    if (numScore === 0) return '#FFFF00';
    if (numScore === -1) return '#FFC7CE';
    return '#FF0000';
  };

  const getRowBackground = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-yellow-50 border-l-4 border-l-yellow-400';
      case 'objective':
        return 'bg-orange-100';
      default:
        return 'bg-white';
    }
  };

  const getChangeBg = (val?: string) => {
    if (!val) return '';
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    // Flow diagram: >5% (Green), -5% to 5% (Yellow), <-5% (Red)
    if (n > 5) return 'bg-green-50';
    if (n >= -5) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getGapBg = (val?: string) => {
    if (!val) return '';
    const n = Math.abs(parseFloat(val));
    if (isNaN(n)) return '';
    // Flow diagram: ≤10% (Green), 10%<PT≤40% (Yellow), >40% (Red)
    if (n <= 10) return 'bg-green-50';
    if (n <= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (!multiPeriodData || multiPeriodData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No assessment data available. Generate a report to view data.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr style={{ backgroundColor: '#154360' }} className="text-white">
            <th className="border border-gray-300 px-2 py-2 text-left font-medium" style={{ width: '50px' }}>
              #
            </th>
            <th className="border border-gray-300 px-2 py-2 text-left font-medium" style={{ width: '300px' }}>
              Indicator
            </th>
            {/* Performance Trend columns */}
            {selectedPeriods.map((period) => (
              <th key={period.name} className="border border-gray-300 px-2 py-2 text-center font-medium" style={{ width: '100px' }}>
                {period.name}
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-2 text-center font-medium" style={{ width: '80px' }}>
              Change
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center font-medium" style={{ width: '100px' }}>
              P-T Gap Analysis
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center font-medium" style={{ width: '80px' }}>
              Target
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center font-medium" style={{ width: '120px' }}>
              Assessed score (-2, -1, 0 +1, +2)
            </th>
            <th className="border border-gray-300 px-2 py-2 text-center font-medium" style={{ width: '100px' }}>
              Remarks
            </th>
          </tr>
        </thead>
        <tbody>
          {multiPeriodData[0]?.objectives.map((objective, objIndex) => (
            <React.Fragment key={objective.id}>
              {/* Objective Row */}
              <tr className={getRowBackground('objective')}>
                <td className="border border-gray-300 px-2 py-2 font-medium" colSpan={7 + selectedPeriods.length}>
                  {objective.name}
                </td>
              </tr>
              
              {/* Indicators */}
              {objective.indicators
                .sort((a, b) => a.display_order - b.display_order)
                .map((indicator, indIndex) => (
                <tr key={indicator.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 text-center font-medium">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1 cursor-help">
                          {indicator.indicator_number || `${objIndex + 1}.${indicator.display_order || indIndex + 1}`}
                          {indicator.dhis2_uid ? (
                            <Database className="h-3 w-3 text-blue-600" />
                          ) : (
                            <Edit3 className="h-3 w-3 text-orange-600" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          {indicator.dhis2_uid ? (
                            <div>
                              <p className="font-medium text-blue-600">DHIS2 Indicator</p>
                              <p className="text-xs text-gray-600">UID: {indicator.dhis2_uid}</p>
                              <p className="text-xs">Data fetched automatically from DHIS2</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-orange-600">Manual Entry</p>
                              <p className="text-xs">Data requires manual input</p>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="text-xs">
                      {indicator.name}
                    </div>
                  </td>
                  
                  {/* Performance Trend columns */}
                  {selectedPeriods.map((period) => {
                    const periodKey = period.code || period.name;
                    const cellKey = `${indicator.id}_${periodKey}`;
                    const cell = cellData[cellKey];
                    
                    return (
                      <td key={period.name} className="border border-gray-300 px-1 py-1">
                        {cell?.isEditable ? (
                          <Input
                            inputMode="decimal"
                            value={cell?.value || ''}
                            onChange={(e) => handleCellChange(cellKey, e.target.value)}
                            className="h-6 text-xs border-0 p-1 focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter value"
                          />
                        ) : (
                          <div className="text-xs text-center">
                            {cell?.value ? (
                              <span>{cell.value}</span>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                              {/* Change column */}
            <td className={`border border-gray-300 px-1 py-1 ${getChangeBg((cellData[`${indicator.id}_change`]?.value || '').replace('%',''))}`}>
              <div className="text-xs text-center">
                {cellData[`${indicator.id}_change`]?.value || ''}
              </div>
            </td>
            
            {/* P-T Gap Analysis column */}
            <td className={`border border-gray-300 px-1 py-1 ${getGapBg((cellData[`${indicator.id}_gap`]?.value || '').replace('%',''))}`}>
              <div className="text-xs text-center">
                {cellData[`${indicator.id}_gap`]?.value || ''}
              </div>
            </td>
                  
                  {/* Target column */}
                  <td className="border border-gray-300 px-1 py-1">
                    <div className="text-xs text-center">
                      {cellData[`${indicator.id}_target`]?.value || ''}
                    </div>
                  </td>
                  
                  {/* Assessed score column */}
                  <td className="border border-gray-300 px-1 py-1">
                    <Select
                      value={cellData[`${indicator.id}_score`]?.value?.replace('.00', '') || '-2'}
                      onValueChange={(value) => handleCellChange(`${indicator.id}_score`, `${value}.00`)}
                    >
                                             <SelectTrigger className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-blue-500 font-bold" style={{ 
                         backgroundColor: getScoreColor(cellData[`${indicator.id}_score`]?.value || '-2.00'),
                         color: 'black'
                       }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-2">-2</SelectItem>
                        <SelectItem value="-1">-1</SelectItem>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  
                                     {/* Remarks column */}
                   <td className="border border-gray-300 px-1 py-1">
                     <Input
                       className="h-6 text-xs border-0 p-1"
                       placeholder="Add remarks"
                       value={cellData[`${indicator.id}_remarks`]?.value || ''}
                       onChange={(e) => handleCellChange(`${indicator.id}_remarks`, e.target.value)}
                     />
                   </td>
                </tr>
              ))}
              
              {/* Milestone row with score input */}
              <tr className={getRowBackground('milestone')}>
                <td className="border border-gray-300 px-2 py-2 font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        MS
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <div className="space-y-2">
                        <div className="font-semibold text-sm text-blue-900">Milestone Score (MS)</div>
                        <div className="text-xs">
                          <p>Milestone scores are manually assigned based on evidence of implementation progress.</p>
                          <p className="mt-2 font-medium">Scoring:</p>
                          <ul className="mt-1 space-y-1">
                            <li><span className="font-bold text-green-600">+2:</span> Complete realization</li>
                            <li><span className="font-bold text-yellow-600">0:</span> Started but not achieved</li>
                            <li><span className="font-bold text-red-600">-2:</span> No evidence/incomplete</li>
                          </ul>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="border border-gray-300 px-2 py-2 font-medium">
                  {objective.milestone?.name || `Milestone for ${objective.name.replace('Objective', '')}`}
                </td>
                
                {/* Performance Trend columns - empty for milestone */}
                {selectedPeriods.map((period) => (
                  <td key={period.name} className="border border-gray-300 px-1 py-1">
                    <div className="text-xs text-center text-gray-400">
                      -
                    </div>
                  </td>
                ))}
                
                {/* Change column - empty for milestone */}
                <td className="border border-gray-300 px-1 py-1">
                  <div className="text-xs text-center text-gray-400">
                    -
                  </div>
                </td>
                
                {/* P-T Gap Analysis column - empty for milestone */}
                <td className="border border-gray-300 px-1 py-1">
                  <div className="text-xs text-center text-gray-400">
                    -
                  </div>
                </td>
                
                {/* Target column - empty for milestone */}
                <td className="border border-gray-300 px-1 py-1">
                  <div className="text-xs text-center text-gray-400">
                    -
                  </div>
                </td>
                
                {/* Milestone score dropdown - properly aligned */}
                <td className="border border-gray-300 px-1 py-1">
                  {objective.milestone ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full relative">
                          <Select
                            value={objective.milestone.score?.toString() || '-2'}
                            onValueChange={(value) => handleMilestoneScoreChange(objective.id, value)}
                          >
                            <SelectTrigger className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-blue-500 font-bold w-full cursor-help" style={{ 
                              backgroundColor: getScoreColor(`${objective.milestone.score || -2}.00`),
                              color: 'black'
                            }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-2">-2</SelectItem>
                              <SelectItem value="-1">-1</SelectItem>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3">
                        <div className="space-y-2">
                          <div className="font-semibold text-sm text-blue-900">MS Score Guidelines</div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-green-600">+2:</span>
                              <span>Evidence provided by relevant institution on complete realization of the milestone</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-yellow-600">0:</span>
                              <span>Evidence that milestone implementation has started but not yet achieved</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-red-600">-2:</span>
                              <span>Otherwise (no evidence or incomplete implementation)</span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="text-xs text-center text-gray-400">
                      N/A
                    </div>
                  )}
                </td>
                
                                 {/* Remarks column for milestone - properly aligned */}
                 <td className="border border-gray-300 px-1 py-1">
                   <Input
                     className="h-6 text-xs border-0 p-1"
                     placeholder="Add remarks"
                     value={cellData[`milestone_${objective.id}_remarks`]?.value || ''}
                     onChange={(e) => handleMilestoneRemarksChange(objective.id, e.target.value)}
                   />
                 </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
} 