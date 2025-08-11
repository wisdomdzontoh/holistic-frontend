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
  Loader2,
  AlertCircle
} from 'lucide-react';
import { assessmentService } from '@/lib/assessment-service';
import { toast } from 'sonner';

interface SavedAssessment {
  id: string;
  name: string;
  org_unit_name: string;
  created_at: string;
  total_indicators: number;
  total_objectives: number;
}

interface ObjectiveScore {
  id: number;
  name: string;
  score: number;
}

interface AssessmentData {
  assessment: SavedAssessment;
  objectives: ObjectiveScore[];
  overall_score: number;
}

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [generatingCharts, setGeneratingCharts] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<SavedAssessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved assessments on component mount
  useEffect(() => {
    fetchSavedAssessments();
  }, []);

  const fetchSavedAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await assessmentService.getSavedAssessments({
        owner: 'mine',
        size: 100 // Get more assessments for the dropdown
      });
      
      setSavedAssessments(response.results || []);
    } catch (err) {
      console.error('Failed to fetch saved assessments:', err);
      setError('Failed to load saved assessments. Please try again.');
      toast.error('Failed to load saved assessments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = savedAssessments.filter(assessment =>
    assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.org_unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCharts = async () => {
    if (!selectedAssessment) return;
    
    setGeneratingCharts(true);
    
    try {
      // Fetch analysis data from backend
      const data = await assessmentService.getAnalysisData(selectedAssessment.id);
      setAssessmentData(data);
      toast.success('Analysis data loaded successfully');
    } catch (err) {
      console.error('Failed to generate charts:', err);
      toast.error('Failed to generate analysis charts');
    } finally {
      setGeneratingCharts(false);
    }
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

  // Show loading state while fetching assessments
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gray-200 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#154360' }} />
              <p className="text-gray-600">Loading saved assessments...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gray-200 min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchSavedAssessments} style={{ backgroundColor: '#154360' }}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                    {loading ? (
                      <div className="px-4 py-3 text-gray-500">Loading assessments...</div>
                    ) : filteredAssessments.length > 0 ? (
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
                            {assessment.org_unit_name} • {new Date(assessment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500">
                        {error ? 'Error loading assessments' : 'No assessments found'}
                      </div>
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
                        {selectedAssessment.org_unit_name} • {new Date(selectedAssessment.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {selectedAssessment.total_indicators} indicators • {selectedAssessment.total_objectives} objectives
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
                  score={assessmentData.overall_score}
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
                    <div className="text-2xl font-bold text-gray-900">{assessmentData.overall_score.toFixed(1)}</div>
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
