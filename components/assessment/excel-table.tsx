'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Edit3, Calculator, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { AssessmentData, Period } from '@/lib/assessment-service';

interface ExcelTableProps {
  multiPeriodData: AssessmentData[] | null;
  selectedPeriods: Period[];
  onCellEdit: (indicatorId: number, period: string, value: string) => Promise<void>;
  onScoreChange: (indicatorId: number, score: string) => void;
  onMilestoneScoreChange?: (objectiveId: number, score: string) => void;
  onRemarksChange?: (indicatorId: number, remarks: string) => void;
  onMilestoneRemarksChange?: (objectiveId: number, remarks: string) => void;
  onBulkScoreCalculation?: (manualEntries: Record<number, Record<string, number | null>>) => Promise<void>;
  isExporting?: boolean;
}

interface CellData {
  value: string;
  isEditable: boolean;
  isDHIS2Data: boolean;
  isManualEntry?: boolean;
}



export default function ExcelTable({ 
  multiPeriodData, 
  selectedPeriods, 
  onCellEdit, 
  onScoreChange,
  onMilestoneScoreChange,
  onRemarksChange,
  onMilestoneRemarksChange,
  onBulkScoreCalculation,
  isExporting
}: ExcelTableProps) {
  const [cellData, setCellData] = useState<Record<string, CellData>>({});
  const [hasManualEntries, setHasManualEntries] = useState(false);
  const [isCalculatingScores, setIsCalculatingScores] = useState(false);

  // Check if there are manual entries
  useEffect(() => {
    if (cellData) {
      const manualEntries = Object.values(cellData).some(cell => 
        !cell.isDHIS2Data && cell.value.trim() !== ''
      );
      setHasManualEntries(manualEntries);
    }
  }, [cellData]);

  // Initialize cell data when multiPeriodData changes or when forced to refresh
  useEffect(() => {
    if (multiPeriodData && multiPeriodData.length > 0) {
      const newCellData: Record<string, CellData> = {};
      
      multiPeriodData.forEach((periodData) => {
        periodData.objectives.forEach((objective) => {
          
                     objective.indicators.forEach((indicator) => {
             // Performance trend columns (period data)
             selectedPeriods.forEach((period) => {
               // Use period.code instead of period.name to match backend data keys
               const periodKey = period.code || period.name;
               const cellKey = `${indicator.id}_${periodKey}`;
               const dataValue = indicator.data_values && indicator.data_values[periodKey];
              
              // Check if this is DHIS2 data (has dhis2_uid) or manual data
              const isDHIS2Data = !!indicator.dhis2_uid;
              const hasValue = dataValue && dataValue.value !== null && dataValue.value !== undefined;
              const isManualEntry = dataValue && dataValue.manual_override !== null && dataValue.manual_override !== undefined;
              
              newCellData[cellKey] = {
                value: hasValue && dataValue.value !== null ? dataValue.value.toString() : '',
                isEditable: !isDHIS2Data, // Editable if not DHIS2 data
                isDHIS2Data: isDHIS2Data,
                isManualEntry: isManualEntry
              };
            });
            
                                      // Change column (computed in page logic)
             const changeKey = `${indicator.id}_change`;
             let changeDisplay = '';
             
             // Debug: Log the indicator score data for Change column
             console.log(`Change column for indicator ${indicator.id}:`, {
               percent_change: indicator.score?.percent_change,
               target_type: indicator.target_type,
               score: indicator.score?.score
             });
             
             if (indicator.score?.percent_change !== undefined && indicator.score?.percent_change !== null) {
               const percentChange = indicator.score.percent_change;
               const isDecreaseIndicator = indicator.target_type === 'decrease';
               
               // For decrease indicators, add visual indicator
               if (isDecreaseIndicator) {
                 if (percentChange > 0) {
                   changeDisplay = `+${percentChange}% (↗️ Bad)`; // Increased when should decrease
                 } else if (percentChange < 0) {
                   changeDisplay = `${percentChange}% (↘️ Good)`; // Decreased when should decrease
                 } else {
                   changeDisplay = `${percentChange}% (→ Stable)`;
                 }
               } else {
                 // For increase indicators, standard display
                 if (percentChange > 0) {
                   changeDisplay = `+${percentChange}% (↗️ Good)`; // Increased when should increase
                 } else if (percentChange < 0) {
                   changeDisplay = `${percentChange}% (↘️ Bad)`; // Decreased when should increase
                 } else {
                   changeDisplay = `${percentChange}% (→ Stable)`;
                 }
               }
             } else {
               // Handle cases where percent_change is null (first year, no data, etc.)
               if (indicator.score?.score === -2) {
                 changeDisplay = 'No Data';
               } else if (indicator.score?.is_first_year === "Yes" || indicator.score?.is_first_year === true) {
                 changeDisplay = 'First Year';
               } else {
                 changeDisplay = 'N/A';
               }
             }
            
            newCellData[changeKey] = {
              value: changeDisplay,
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

  const handleCellChange = async (cellKey: string, value: string) => {
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
      await onCellEdit(parseInt(indicatorId), column, value);
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

  const handleBulkScoreCalculation = async () => {
    if (!onBulkScoreCalculation) return;
    
    setIsCalculatingScores(true);
    try {
      // Collect manual entries
      const manualEntries: Record<number, Record<string, number | null>> = {};
      
      Object.entries(cellData).forEach(([cellKey, cell]) => {
        if (!cell.isDHIS2Data && cell.value.trim() !== '') {
          const [indicatorId, periodKey] = cellKey.split('_');
          const indicatorIdNum = parseInt(indicatorId);
          const value = parseFloat(cell.value);
          
          if (!isNaN(value)) {
            if (!manualEntries[indicatorIdNum]) {
              manualEntries[indicatorIdNum] = {};
            }
            manualEntries[indicatorIdNum][periodKey] = value;
          }
        }
      });

      await onBulkScoreCalculation(manualEntries);
    } catch (error) {
      console.error('Error calculating scores:', error);
    } finally {
      setIsCalculatingScores(false);
    }
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

  const getPrintRowClass = (type: string) => {
    if (isExporting) return ''; // No print styles when exporting
    switch (type) {
      case 'milestone':
        return 'print-row-milestone';
      case 'objective':
        return 'print-row-objective';
      default:
        return '';
    }
  };

  const getPrintChangeClass = (val?: string) => {
    if (!val) return '';
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    if (n > 0) return 'print-change-positive';
    if (n < 0) return 'print-change-negative';
    return 'print-change-neutral';
  };

  const getPrintGapClass = (val?: string) => {
    if (!val) return '';
    const n = Math.abs(parseFloat(val));
    if (isNaN(n)) return '';
    if (n <= 10) return 'print-gap-good';
    if (n <= 40) return 'print-gap-warning';
    return 'print-gap-poor';
  };

  const getPrintScoreClass = (score: string) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '';
    if (numScore >= 2) return 'print-score-2';
    if (numScore >= 1) return 'print-score-1';
    if (numScore === 0) return 'print-score-0';
    if (numScore === -1) return 'print-score-neg1';
    if (numScore === -2) return 'print-score-neg2';
    return '';
  };

  if (!multiPeriodData || multiPeriodData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No assessment data available. Generate a report to view data.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Print Styles for Color Coding */}
      <style jsx>{`
        @media print {
          /* Score Color Coding for Print */
          .print-score-2 { background-color: #548235 !important; color: white !important; }
          .print-score-1 { background-color: #A9D08E !important; color: black !important; }
          .print-score-0 { background-color: #FFFF00 !important; color: black !important; }
          .print-score-neg1 { background-color: #FFC7CE !important; color: black !important; }
          .print-score-neg2 { background-color: #FF0000 !important; color: white !important; }
          
          /* Change Background Colors for Print */
          .print-change-positive { background-color: #d1fae5 !important; }
          .print-change-neutral { background-color: #fef3c7 !important; }
          .print-change-negative { background-color: #fee2e2 !important; }
          
          /* Gap Background Colors for Print */
          .print-gap-good { background-color: #d1fae5 !important; }
          .print-gap-warning { background-color: #fef3c7 !important; }
          .print-gap-poor { background-color: #fee2e2 !important; }
          
          /* Row Background Colors for Print */
          .print-row-objective { background-color: #fed7aa !important; }
          .print-row-milestone { background-color: #fef3c7 !important; border-left: 4px solid #f59e0b !important; }
          
          /* Table Styling for Print */
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db !important;
            padding: 4px 6px !important;
            text-align: center !important;
            vertical-align: middle !important;
          }
          
          .print-table th {
            background-color: #154360 !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 9px !important;
          }
          
          /* Header Styling for Print */
          .print-header {
            text-align: center !important;
            margin-bottom: 20px !important;
            page-break-after: avoid !important;
          }
          
          .print-header h1 {
            font-size: 24px !important;
            font-weight: bold !important;
            margin-bottom: 8px !important;
            color: #1f2937 !important;
          }
          
          .print-header p {
            font-size: 12px !important;
            color: #6b7280 !important;
            margin: 0 !important;
          }
          
          /* Ensure proper page breaks */
          .print-table tr {
            page-break-inside: avoid !important;
          }
          
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="overflow-x-auto overflow-y-auto max-h-full print-table-container">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block print-header">
          <h1>Holistic Assessment Report</h1>
          <p>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      
        {/* Manual Scoring Controls - Hidden when printing */}
        <div className="no-print mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {hasManualEntries ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">Manual entries detected</span>
                  </>
                ) : (
                  <>
                    <Info className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Enter values in manual indicator cells to calculate scores</span>
                  </>
                )}
              </div>
            </div>
            
            {hasManualEntries && onBulkScoreCalculation && (
              <button
                onClick={handleBulkScoreCalculation}
                disabled={isCalculatingScores}
                className="px-6 py-3 bg-gradient-to-r from-[#1E8449] to-[#27AE60] text-white rounded-lg hover:from-[#27AE60] hover:to-[#2ECC71] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                {isCalculatingScores ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Calculating Scores...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    <span>Calculate Scores</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      
      <table className="w-full border-collapse border border-gray-300 text-sm print-table">
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
              <tr className={`${getRowBackground('objective')} ${getPrintRowClass('objective')}`}>
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
                            <Database className="h-3 w-3 text-[#1E8449]" />
                          ) : (
                            <Edit3 className="h-3 w-3 text-orange-600" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          {indicator.dhis2_uid ? (
                            <div>
                              <p className="font-medium text-[#1E8449]">DHIS2 Indicator</p>
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
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={cell?.value || ''}
                            onChange={(e) => handleCellChange(cellKey, e.target.value)}
                            className="h-6 text-xs border-0 p-1 focus:ring-1 focus:ring-[#1E8449]"
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
            <td className={`border border-gray-300 px-1 py-1 ${getChangeBg((cellData[`${indicator.id}_change`]?.value || '').replace('%',''))} ${getPrintChangeClass((cellData[`${indicator.id}_change`]?.value || '').replace('%',''))}`}>
              <div className="text-xs text-center">
                {cellData[`${indicator.id}_change`]?.value || ''}
              </div>
            </td>
            
            {/* P-T Gap Analysis column */}
            <td className={`border border-gray-300 px-1 py-1 ${getGapBg((cellData[`${indicator.id}_gap`]?.value || '').replace('%',''))} ${getPrintGapClass((cellData[`${indicator.id}_gap`]?.value || '').replace('%',''))}`}>
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
                  <td className={`border border-gray-300 px-1 py-1 ${getPrintScoreClass(cellData[`${indicator.id}_score`]?.value || '-2.00')}`}>
                    {indicator.score?.isLoading ? (
                      <div className="h-6 text-xs text-center flex items-center justify-center" style={{ 
                        backgroundColor: '#6c757d',
                        color: 'white'
                      }}>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Calculating...
                      </div>
                    ) : (
                      <Select
                        value={cellData[`${indicator.id}_score`]?.value?.replace('.00', '') || '-2'}
                        onValueChange={(value) => handleCellChange(`${indicator.id}_score`, `${value}.00`)}
                      >
                        <SelectTrigger className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-[#1E8449] font-bold" style={{ 
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
                    )}
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
              <tr className={`${getRowBackground('milestone')} ${getPrintRowClass('milestone')}`}>
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
                <td className={`border border-gray-300 px-1 py-1 ${getPrintScoreClass(`${objective.milestone?.score || -2}.00`)}`}>
                  <Select
                    value={objective.milestone?.score?.toString() || '-2'}
                    onValueChange={(value) => handleMilestoneScoreChange(objective.id, value)}
                  >
                    <SelectTrigger className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-[#1E8449] font-bold" style={{ 
                      backgroundColor: getScoreColor(`${objective.milestone?.score || -2}.00`),
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
                
                {/* Milestone remarks column */}
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
    </div>
  );
}