'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Search, 
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Database
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

interface AssessmentData {
  assessment: SavedAssessment;
  objectives: Array<{
    id: number;
    name: string;
    score: number;
  }>;
  overall_score: number;
  detailed_scores?: Array<{
    indicator_id: string;
    indicator_name: string;
    objective_name: string;
    current_value?: number;
    previous_value?: number;
    target_value?: number;
    data_provided: boolean;
    current_meets_target?: boolean;
    previous_meets_target?: boolean;
    change_category?: string;
    gap_category?: string;
    percent_change?: number;
    target_gap?: number;
    final_score: number;
    score_color: string;
    score_label: string;
  }>;
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
  const [showDetailedScores, setShowDetailedScores] = useState(false);

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

  const getChangeCategoryIcon = (category?: string) => {
    switch (category) {
      case '>5%':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case '5%<=C>-5%':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case '-10%<C<=-5%':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case '<=-10%':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGapCategoryColor = (category?: string) => {
    switch (category) {
      case '<=10%':
        return 'bg-green-100 text-green-800';
      case '10%<PT<=40%':
        return 'bg-yellow-100 text-yellow-800';
      case '>40%':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <div className="grid grid-cols-1 gap-1 text-xs">
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

  const DetailedScoresTable = ({ scores }: { scores: AssessmentData['detailed_scores'] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Detailed Scoring Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Indicator</th>
                <th className="text-left p-2">Objective</th>
                <th className="text-center p-2">Data Provided</th>
                <th className="text-center p-2">Target Met</th>
                <th className="text-center p-2">Performance Change</th>
                <th className="text-center p-2">Gap to Target</th>
                <th className="text-center p-2">Final Score</th>
              </tr>
            </thead>
            <tbody>
              {scores?.map((score, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{score.indicator_name}</td>
                  <td className="p-2 text-gray-600">{score.objective_name}</td>
                  <td className="p-2 text-center">
                    {score.data_provided ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {score.current_meets_target === true ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    ) : score.current_meets_target === false ? (
                      <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getChangeCategoryIcon(score.change_category)}
                      <span className="text-xs">{score.change_category || 'N/A'}</span>
                    </div>
                    {score.percent_change !== undefined && (
                      <div className="text-xs text-gray-500">
                        {score.percent_change > 0 ? '+' : ''}{score.percent_change.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <Badge className={getGapCategoryColor(score.gap_category)}>
                      {score.gap_category || 'N/A'}
                    </Badge>
                    {score.target_gap !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        {score.target_gap.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <div 
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: score.score_color }}
                    >
                      {score.final_score} ({score.score_label})
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                Generate objective-based performance charts from saved assessments with detailed holistic scoring
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
                        Generate Analysis
                      </>
                    )}
                  </Button>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredAssessments.length > 0 ? (
                      filteredAssessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setSearchTerm(assessment.name);
                            setShowDropdown(false);
                            setAssessmentData(null);
                          }}
                        >
                          <div className="font-medium">{assessment.name}</div>
                          <div className="text-sm text-gray-600">
                            {assessment.org_unit_name} • {new Date(assessment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No assessments found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Assessment Display */}
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

        {/* Analysis Results */}
        {assessmentData && (
          <div className="space-y-8">
            {/* Toggle Detailed Scores */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              <Button
                variant="outline"
                onClick={() => setShowDetailedScores(!showDetailedScores)}
                className="flex items-center gap-2"
              >
                {showDetailedScores ? 'Hide' : 'Show'} Detailed Scoring
              </Button>
            </div>

            {/* Individual Objective Charts */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Objective Performance</h3>
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">Overall Sector Score</h3>
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

            {/* Detailed Scores Table */}
            {showDetailedScores && assessmentData.detailed_scores && (
              <DetailedScoresTable scores={assessmentData.detailed_scores} />
            )}
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
                  Select a saved assessment from the dropdown above to generate performance charts with detailed holistic scoring analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
