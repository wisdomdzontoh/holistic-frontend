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
  Database,
  Settings,
  ChevronDown,
  Calendar,
  Building2
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

  // Debug selectedAssessment changes
  useEffect(() => {
    console.log('selectedAssessment changed:', selectedAssessment);
  }, [selectedAssessment]);
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

  // Close dropdown when clicking outside and handle window resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    const handleResize = () => {
      // No longer needed since we're not using portal positioning
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [showDropdown]);

  const fetchSavedAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await assessmentService.getSavedAssessments({
        owner: 'mine',
        size: 100 // Get more assessments for the dropdown
      });
      
      console.log('Saved assessments response:', response);
      console.log('Results:', response.results);
      
      setSavedAssessments(response.results || []);
    } catch (err) {
      console.error('Failed to fetch saved assessments:', err);
      setError('Failed to load saved assessments. Please try again.');
      toast.error('Failed to load saved assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDropdown = () => {
    setShowDropdown(true);
  };

  const filteredAssessments = savedAssessments.filter(assessment =>
    assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.org_unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug logging
  console.log('Saved assessments state:', savedAssessments);
  console.log('Filtered assessments:', filteredAssessments);
  console.log('Search term:', searchTerm);
  console.log('Show dropdown:', showDropdown);

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
    if (score >= 2) return '#548235';
    if (score >= 1) return '#A9D08E';
    if (score === 0) return '#FFFF00';
    if (score === -1) return '#FFC7CE';
    return '#FF0000';
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
              case '-5%<C<=5%':
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


  const PerformanceChart = ({ title, score, size = 'medium' }: { title: string; score: number; size?: 'small' | 'medium' | 'large' }) => {
    const height = size === 'small' ? 'h-4' : size === 'large' ? 'h-8' : 'h-6';
    const markerSize = size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3';
    const labelSize = size === 'small' ? 'text-xs' : size === 'large' ? 'text-sm' : 'text-xs';
    
    return (
      <div className="space-y-2">
        <div className="relative">
          <div className={`${height} bg-gray-200 rounded-lg overflow-hidden`}>
            {/* Color segments */}
            <div className="flex h-full">
              <div className="h-full bg-red-800" style={{ width: '18%' }}></div>
              <div className="h-full bg-red-600" style={{ width: '22%' }}></div>
              <div className="h-full bg-yellow-500" style={{ width: '20%' }}></div>
              <div className="h-full bg-green-400" style={{ width: '20%' }}></div>
              <div className="h-full bg-green-700" style={{ width: '20%' }}></div>
            </div>
            
            {/* Score indicator */}
            <div 
              className="absolute top-0 bottom-0 flex items-center"
              style={{ left: `${getScorePosition(score)}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`${markerSize} bg-black border-2 border-white rounded-full`}></div>
              {size === 'large' && (
                <div className="ml-2 bg-white border border-gray-300 px-2 py-1 rounded text-sm font-medium">
                  {typeof score === 'number' ? score.toFixed(1) : '0.0'}
                </div>
              )}
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
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-800 rounded"></div>
            <span>Severely underperforming</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Underperforming</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Sustained</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Moderately performing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-700 rounded"></div>
            <span>Highly performing</span>
          </div>
        </div>
      </div>
    );
  };

  const DetailedScoresTable = ({ scores }: { scores: AssessmentData['detailed_scores'] }) => (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-brand-navy/5 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
          <Database className="h-5 w-5 mr-2 text-brand-navy" />
          Detailed Scoring Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-medium text-gray-900">Indicator</th>
                <th className="text-left p-3 font-medium text-gray-900">Objective</th>
                <th className="text-center p-3 font-medium text-gray-900">Data Provided</th>
                <th className="text-center p-3 font-medium text-gray-900">Target Met</th>
                <th className="text-center p-3 font-medium text-gray-900">Performance Change</th>
                <th className="text-center p-3 font-medium text-gray-900">Gap to Target</th>
                <th className="text-center p-3 font-medium text-gray-900">Final Score</th>
              </tr>
            </thead>
            <tbody>
              {scores?.map((score, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{score.indicator_name}</td>
                  <td className="p-3 text-gray-600">{score.objective_name}</td>
                  <td className="p-3 text-center">
                    {score.data_provided ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {score.current_meets_target === true ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    ) : score.current_meets_target === false ? (
                      <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getChangeCategoryIcon(score.change_category)}
                      <span className="text-xs">{score.change_category || 'N/A'}</span>
                    </div>
                    {score.percent_change !== undefined && score.percent_change !== null && (
                      <div className="text-xs text-gray-500">
                        {score.percent_change > 0 ? '+' : ''}{score.percent_change.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={getGapCategoryColor(score.gap_category)}>
                      {score.gap_category || 'N/A'}
                    </Badge>
                    {score.target_gap !== undefined && score.target_gap !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        {score.target_gap.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
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
        <div className="min-h-screen bg-gradient-to-br from-white to-surface-muted">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-navy" />
              <p className="text-gray-600 font-medium">Loading saved assessments...</p>
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
        <div className="min-h-screen bg-gradient-to-br from-white to-surface-muted">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchSavedAssessments} className="bg-brand-navy hover:bg-brand-navy-dark">
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
      <div className="min-h-screen bg-gradient-to-br from-white to-surface-muted">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>Performance Analysis</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Generate objective-based performance charts from saved assessments
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time charts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Assessment Selection */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
            <div className="bg-gradient-to-r from-brand-navy to-brand-navy-dark px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                <Settings className="h-5 w-5 mr-2" />
                Assessment Selection
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Searchable Dropdown */}
                <div className="relative dropdown-container">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search saved assessments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={handleShowDropdown}
                        onClick={handleShowDropdown}
                        className="pl-10 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (showDropdown) {
                            setShowDropdown(false);
                          } else {
                            handleShowDropdown();
                          }
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    <Button 
                      onClick={generateCharts}
                      disabled={!selectedAssessment || generatingCharts}
                      className="bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-50"
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

                  {/* Regular Dropdown */}
                  {showDropdown && (
                    <div 
                      className="absolute z-50 w-full mt-1 bg-white border-2 border-brand-navy/20 rounded-lg shadow-xl max-h-80 overflow-auto"
                      style={{ maxHeight: '320px' }}
                    >
                      <div className="p-2 bg-brand-navy/5 border-b border-brand-navy/20">
                        <div className="text-sm font-medium text-brand-navy">
                          {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} found
                        </div>
                      </div>
                      {filteredAssessments.length > 0 ? (
                        filteredAssessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className="px-4 py-4 hover:bg-brand-navy/5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Assessment clicked:', assessment);
                              setSelectedAssessment(assessment);
                              setSearchTerm(assessment.name);
                              setShowDropdown(false);
                              setAssessmentData(null);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-base">{assessment.name}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <Building2 className="h-4 w-4 text-brand-navy" />
                                  <span className="font-medium">{assessment.org_unit_name}</span>
                                  <Calendar className="h-4 w-4 text-green-600 ml-2" />
                                  <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-brand-navy rounded-full"></span>
                                    {assessment.total_indicators} indicators
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {assessment.total_objectives} objectives
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="w-2 h-2 bg-brand-navy rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <div className="text-gray-500 mb-2">No assessments found</div>
                          <div className="text-sm text-gray-400">Try adjusting your search terms</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Assessment Display */}
                {selectedAssessment && (
                  <div className="p-6 bg-gradient-to-r from-brand-navy/5 to-brand-navy/10 border-2 border-brand-navy/20 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="font-semibold text-brand-navy text-lg">Selected Assessment</div>
                        </div>
                        <div className="text-base font-medium text-gray-900 mb-1">{selectedAssessment.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-4 mb-2">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-brand-navy" />
                            {selectedAssessment.org_unit_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-green-600" />
                            {new Date(selectedAssessment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-brand-navy rounded-full"></span>
                            {selectedAssessment.total_indicators} indicators
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {selectedAssessment.total_objectives} objectives
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(null);
                            setSearchTerm('');
                            setAssessmentData(null);
                          }}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {generatingCharts && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-navy" />
                  <div className="text-lg font-medium text-gray-900">Generating Performance Charts</div>
                  <div className="text-sm text-gray-600">Please wait while we process your assessment data...</div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {assessmentData && (
            <div className="space-y-8">
              {/* Header with Toggle */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                  <p className="text-gray-600 mt-1">Performance analysis for {assessmentData.assessment.name}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailedScores(!showDetailedScores)}
                  className="flex items-center gap-2"
                >
                  {showDetailedScores ? 'Hide' : 'Show'} Detailed Scoring
                </Button>
              </div>

              {/* Individual Objective Charts */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-brand-navy/5 border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <BarChart3 className="h-5 w-5 mr-2 text-brand-navy" />
                    Objective Performance
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6">
                    {assessmentData.objectives.map((objective) => (
                      <div key={objective.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{objective.name}</h4>
                          <div className="flex items-center space-x-3">
                            <div 
                              className="px-3 py-1 rounded-full text-sm font-medium text-white"
                              style={{ backgroundColor: getScoreColor(objective.score) }}
                            >
                              {typeof objective.score === 'number' ? objective.score.toFixed(1) : '0.0'}
                            </div>
                            <span className="text-sm text-gray-600">
                              {getScoreLabel(objective.score)}
                            </span>
                          </div>
                        </div>
                        
                        <PerformanceChart title={objective.name} score={objective.score} size="medium" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall Sector Score */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-brand-navy/5 border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <Target className="h-5 w-5 mr-2 text-brand-navy" />
                    Overall Sector Score
                  </h3>
                </div>
                <div className="p-6">
                  <div className="max-w-4xl">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-gray-900">Overall Sector Performance</h4>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="px-4 py-2 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: getScoreColor(assessmentData.overall_score) }}
                        >
                          {typeof assessmentData.overall_score === 'number' ? assessmentData.overall_score.toFixed(1) : '0.0'}
                        </div>
                        <span className="text-sm text-gray-600">
                          {getScoreLabel(assessmentData.overall_score)}
                        </span>
                      </div>
                    </div>
                    
                    <PerformanceChart title="Overall Sector" score={assessmentData.overall_score} size="large" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-brand-navy/5 border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <TrendingUp className="h-5 w-5 mr-2 text-brand-navy" />
                    Performance Summary
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-brand-navy/5 to-brand-navy/10 rounded-lg border border-brand-navy/20">
                      <div className="text-3xl font-bold text-brand-navy">{typeof assessmentData.overall_score === 'number' ? assessmentData.overall_score.toFixed(1) : '0.0'}</div>
                      <div className="text-sm text-brand-navy font-medium">Overall Score</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-900">{assessmentData.objectives.length}</div>
                      <div className="text-sm text-green-700 font-medium">Objectives Assessed</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-brand-teal/5 to-brand-teal/10 rounded-lg border border-brand-teal/20">
                      <div className="text-3xl font-bold text-brand-teal">
                        {assessmentData.objectives.filter(obj => obj.score >= 3).length}
                      </div>
                      <div className="text-sm text-brand-teal font-medium">Performing Well</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Scores Table */}
              {showDetailedScores && assessmentData.detailed_scores && (
                <DetailedScoresTable scores={assessmentData.detailed_scores} />
              )}
            </div>
          )}

          {/* Empty State */}
          {!selectedAssessment && !generatingCharts && !assessmentData && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Selected</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Select a saved assessment from the dropdown above to generate performance charts with detailed holistic scoring analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
