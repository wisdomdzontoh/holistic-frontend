'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Search, 
  Play,
  Loader2
} from 'lucide-react';

interface SavedAssessment {
  id: string;
  name: string;
  date: string;
  facility: string;
  period: string;
}

interface ObjectiveScore {
  id: string;
  name: string;
  score: number;
}

interface AssessmentData {
  objectives: ObjectiveScore[];
  overallScore: number;
}

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [generatingCharts, setGeneratingCharts] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<SavedAssessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  // Mock saved assessments
  const savedAssessments: SavedAssessment[] = [
    { id: '1', name: 'Q4 2024 Assessment - Central Hospital', date: '2024-12-15', facility: 'Central Hospital', period: 'Q4 2024' },
    { id: '2', name: 'Q3 2024 Assessment - Regional Clinic', date: '2024-09-30', facility: 'Regional Clinic', period: 'Q3 2024' },
    { id: '3', name: 'Q2 2024 Assessment - Community Health Center', date: '2024-06-30', facility: 'Community Health Center', period: 'Q2 2024' },
    { id: '4', name: 'Q1 2024 Assessment - Central Hospital', date: '2024-03-31', facility: 'Central Hospital', period: 'Q1 2024' },
  ];

  const filteredAssessments = savedAssessments.filter(assessment =>
    assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCharts = async () => {
    if (!selectedAssessment) return;
    
    setGeneratingCharts(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock assessment data
    const mockData: AssessmentData = {
      objectives: [
        { id: '1', name: 'Objective 1', score: 1.3 },
        { id: '2', name: 'Objective 2', score: 2.9 },
        { id: '3', name: 'Objective 3', score: 1.8 },
        { id: '4', name: 'Objective 4', score: 3.2 },
        { id: '5', name: 'Objective 5', score: 2.1 },
      ],
      overallScore: 2.0
    };
    
    setAssessmentData(mockData);
    setGeneratingCharts(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return '#166534'; // Dark green - Highly performing
    if (score >= 3) return '#16a34a'; // Light green - Moderately performing
    if (score >= 2) return '#eab308'; // Yellow - Sustained
    if (score >= 1) return '#dc2626'; // Red - Underperforming
    return '#991b1b'; // Dark red - Severely underperforming
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Highly performing';
    if (score >= 3) return 'Moderately performing';
    if (score >= 2) return 'Sustained';
    if (score >= 1) return 'Underperforming';
    return 'Severely underperforming';
  };

  const getScorePosition = (score: number) => {
    return (score / 5) * 100;
  };

  const PerformanceChart = ({ title, score }: { title: string; score: number }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Performance Bar */}
          <div className="relative">
            <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
              {/* Color segments */}
              <div className="flex h-full">
                <div className="h-full bg-red-800" style={{ width: '20%' }}></div>
                <div className="h-full bg-red-600" style={{ width: '20%' }}></div>
                <div className="h-full bg-yellow-500" style={{ width: '20%' }}></div>
                <div className="h-full bg-green-400" style={{ width: '20%' }}></div>
                <div className="h-full bg-green-700" style={{ width: '20%' }}></div>
              </div>
              
              {/* Score indicator */}
              <div 
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${getScorePosition(score)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-4 h-4 bg-black border-2 border-white rounded-full"></div>
                <div className="ml-2 bg-white border border-gray-300 px-2 py-1 rounded text-sm font-medium">
                  {score.toFixed(1)}
                </div>
              </div>
            </div>
            
            {/* Scale */}
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-800 rounded"></div>
              <span>Severely underperforming</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Underperforming</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Sustained</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>Moderately performing</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-700 rounded"></div>
              <span>Highly performing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-200 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Analysis</h1>
              <p className="text-gray-600 mt-2">
                Generate objective-based performance charts from saved assessments
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Searchable Dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search saved assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={generateCharts}
                    disabled={!selectedAssessment || generatingCharts}
                    style={{ backgroundColor: '#154360' }}
                  >
                    {generatingCharts ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate Chart by Objectives
                      </>
                    )}
                  </Button>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredAssessments.length > 0 ? (
                      filteredAssessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setShowDropdown(false);
                            setSearchTerm(assessment.name);
                          }}
                        >
                          <div className="font-medium text-gray-900">{assessment.name}</div>
                          <div className="text-sm text-gray-600">
                            {assessment.facility} • {assessment.period} • {assessment.date}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500">No assessments found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Assessment Info */}
              {selectedAssessment && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">Selected Assessment</div>
                      <div className="text-sm text-blue-700">
                        {selectedAssessment.facility} • {selectedAssessment.period}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssessment(null);
                        setSearchTerm('');
                        setAssessmentData(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        {generatingCharts && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#154360' }} />
                  <div className="text-lg font-medium text-gray-900">Generating Performance Charts</div>
                  <div className="text-sm text-gray-600">Please wait while we process your assessment data...</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {assessmentData && !generatingCharts && (
          <div className="space-y-8">
            {/* Individual Objective Charts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Objective Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {assessmentData.objectives.map((objective) => (
                  <PerformanceChart
                    key={objective.id}
                    title={objective.name}
                    score={objective.score}
                  />
                ))}
              </div>
            </div>

            {/* Overall Sector Score */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Sector Score</h2>
              <div className="max-w-4xl">
                <PerformanceChart
                  title="Overall Sector Score"
                  score={assessmentData.overallScore}
                />
              </div>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessmentData.overallScore.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{assessmentData.objectives.length}</div>
                    <div className="text-sm text-gray-600">Objectives Assessed</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {assessmentData.objectives.filter(obj => obj.score >= 3).length}
                    </div>
                    <div className="text-sm text-gray-600">Performing Well</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedAssessment && !generatingCharts && !assessmentData && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Selected</h3>
                <p className="text-gray-600">
                  Select a saved assessment from the dropdown above to generate performance charts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
