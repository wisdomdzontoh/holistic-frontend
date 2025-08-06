'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AssessmentData, Period } from '@/lib/assessment-service';

interface ExcelTableProps {
  multiPeriodData: AssessmentData[] | null;
  selectedPeriods: Period[];
  onCellEdit: (indicatorId: number, period: string, value: string) => void;
  onScoreChange: (indicatorId: number, score: string) => void;
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
  onScoreChange 
}: ExcelTableProps) {
  const [cellData, setCellData] = useState<Record<string, CellData>>({});

  // Initialize cell data when multiPeriodData changes
  useEffect(() => {
    if (multiPeriodData && multiPeriodData.length > 0) {
      const newCellData: Record<string, CellData> = {};
      
      multiPeriodData.forEach((periodData) => {
        periodData.objectives.forEach((objective) => {
          objective.indicators.forEach((indicator) => {
            // Performance trend columns (period data)
            selectedPeriods.forEach((period) => {
              const cellKey = `${indicator.id}_${period.name}`;
              const dataValue = indicator.data_values[period.name];
              
              // Check if this is DHIS2 data (has dhis2_uid) or manual data
              const isDHIS2Data = !!indicator.dhis2_uid;
              const hasValue = dataValue && dataValue.value !== null && dataValue.value !== undefined;
              
              newCellData[cellKey] = {
                value: hasValue ? dataValue.value.toString() : '',
                isEditable: !isDHIS2Data, // Editable if not DHIS2 data
                isDHIS2Data: isDHIS2Data
              };
            });
            
            // Change column
            const changeKey = `${indicator.id}_change`;
            newCellData[changeKey] = {
              value: indicator.score?.percent_change?.toString() || '',
              isEditable: false,
              isDHIS2Data: false
            };
            
            // P-T Gap Analysis column
            const gapKey = `${indicator.id}_gap`;
            newCellData[gapKey] = {
              value: indicator.score?.target_gap?.toString() || '',
              isEditable: false,
              isDHIS2Data: false
            };
            
            // Target column
            const targetKey = `${indicator.id}_target`;
            newCellData[targetKey] = {
              value: indicator.target_value?.toString() || '',
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
          });
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
    } else if (selectedPeriods.some(p => p.name === column)) {
      onCellEdit(parseInt(indicatorId), column, value);
    }
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '#6c757d';
    
    if (numScore >= 1) return '#28a745'; // Green
    if (numScore >= 0) return '#ffc107'; // Yellow
    if (numScore >= -1) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const getRowBackground = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-yellow-100';
      case 'objective':
        return 'bg-orange-100';
      default:
        return 'bg-white';
    }
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
          <tr className="bg-blue-600 text-white">
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
              {objective.indicators.map((indicator, indIndex) => (
                <tr key={indicator.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 text-center font-medium">
                    {indicator.indicator_number || `${objIndex + 1}.${indIndex + 1}`}
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="text-xs">
                      {indicator.name}
                    </div>
                  </td>
                  
                  {/* Performance Trend columns */}
                  {selectedPeriods.map((period) => {
                    const cellKey = `${indicator.id}_${period.name}`;
                    const cell = cellData[cellKey];
                    
                    return (
                      <td key={period.name} className="border border-gray-300 px-1 py-1">
                        {cell?.isEditable ? (
                          <Input
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
                            {cell?.isDHIS2Data && (
                              <div className="text-xs text-blue-600 mt-1">DHIS2</div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Change column */}
                  <td className="border border-gray-300 px-1 py-1">
                    <div className="text-xs text-center">
                      {cellData[`${indicator.id}_change`]?.value || ''}
                    </div>
                  </td>
                  
                  {/* P-T Gap Analysis column */}
                  <td className="border border-gray-300 px-1 py-1">
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
                    <Input
                      value={cellData[`${indicator.id}_score`]?.value || '-2.00'}
                      onChange={(e) => handleCellChange(`${indicator.id}_score`, e.target.value)}
                      className="h-6 text-xs border-0 p-1 text-center focus:ring-1 focus:ring-blue-500"
                      style={{ 
                        backgroundColor: getScoreColor(cellData[`${indicator.id}_score`]?.value || '-2.00'),
                        color: 'white'
                      }}
                    />
                  </td>
                  
                  {/* Remarks column */}
                  <td className="border border-gray-300 px-1 py-1">
                    <Input
                      className="h-6 text-xs border-0 p-1"
                      placeholder="Add remarks"
                    />
                  </td>
                </tr>
              ))}
              
              {/* Milestone row */}
              <tr className={getRowBackground('milestone')}>
                <td className="border border-gray-300 px-2 py-2 font-medium" colSpan={7 + selectedPeriods.length}>
                  {objective.milestone?.name || `MS ${objective.name.replace('Objective', 'Milestone')}`}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
} 