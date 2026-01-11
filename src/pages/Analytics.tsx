import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Loader2, PieChart, AlertCircle, TrendingUp, Target, BookOpen, Award } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paperApi, analyticsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from 'recharts';

interface PaperHistory {
  id: number;
  subject_name?: string;
  created_at?: string;
}

interface Analytics {
  difficulty_distribution?: { [key: string]: number };
  bloom_taxonomy?: { [key: string]: number };
  topic_coverage?: { [key: string]: number };
  marks_allocation?: { [key: string]: number };
}

const CHART_COLORS = [
  'hsl(238, 84%, 67%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(210, 90%, 55%)',
  'hsl(280, 70%, 60%)',
  'hsl(190, 90%, 50%)',
  'hsl(330, 80%, 60%)',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'hsl(142, 76%, 36%)',
  Easy: 'hsl(142, 76%, 36%)',
  medium: 'hsl(38, 92%, 50%)',
  Medium: 'hsl(38, 92%, 50%)',
  hard: 'hsl(0, 84%, 60%)',
  Hard: 'hsl(0, 84%, 60%)',
};

export default function Analytics() {
  const [searchParams] = useSearchParams();
  const [papers, setPapers] = useState<PaperHistory[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>(searchParams.get('paper') || '');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoadingPapers, setIsLoadingPapers] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPapers();
  }, []);

  useEffect(() => {
    if (selectedPaper) {
      loadAnalytics(parseInt(selectedPaper));
    }
  }, [selectedPaper]);

  const loadPapers = async () => {
    try {
      const data = await paperApi.getHistory();
      setPapers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load papers',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const loadAnalytics = async (paperId: number) => {
    setIsLoadingAnalytics(true);
    try {
      const data = await analyticsApi.getPaperAnalytics(paperId);
      setAnalytics(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const formatChartData = (data: { [key: string]: number } | undefined) => {
    if (!data) return [];
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const formatRadialData = (data: { [key: string]: number } | undefined) => {
    if (!data) return [];
    const entries = Object.entries(data);
    const maxValue = Math.max(...entries.map(([_, v]) => v));
    return entries.map(([name, value], index) => ({
      name,
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      percentage: Math.round((value / maxValue) * 100),
    }));
  };

  const difficultyData = formatChartData(analytics?.difficulty_distribution);
  const bloomData = formatChartData(analytics?.bloom_taxonomy);
  const topicData = formatChartData(analytics?.topic_coverage);
  const marksData = formatChartData(analytics?.marks_allocation);
  const radialBloomData = formatRadialData(analytics?.bloom_taxonomy);

  const totalQuestions = difficultyData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-popover px-4 py-3 shadow-xl">
          <p className="font-semibold text-foreground">{label || payload[0].name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Count: <span className="font-bold text-primary">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const selectedPaperData = papers.find(p => p.id.toString() === selectedPaper);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Paper Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive analysis of question paper composition
            </p>
          </div>

          {/* Paper Selection */}
          <div className="w-full md:w-80">
            {isLoadingPapers ? (
              <div className="flex items-center gap-2 h-12 px-4 rounded-lg border border-border bg-muted/30">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading papers...</span>
              </div>
            ) : (
              <Select value={selectedPaper} onValueChange={setSelectedPaper}>
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="Select a paper to analyze" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {papers.map((paper) => (
                    <SelectItem key={paper.id} value={paper.id.toString()}>
                      Paper #{paper.id} - {paper.subject_name || 'Question Paper'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!selectedPaper ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Select a Paper</h3>
                  <p className="text-muted-foreground mt-2 text-center max-w-md">
                    Choose a paper from the dropdown above to view detailed analytics including difficulty distribution, Bloom's taxonomy, and topic coverage.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : isLoadingAnalytics ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-96 items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </motion.div>
          ) : analytics ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Questions</p>
                          <p className="text-2xl font-bold">{totalQuestions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                          <TrendingUp className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Difficulty Levels</p>
                          <p className="text-2xl font-bold">{difficultyData.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                          <BookOpen className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Topics Covered</p>
                          <p className="text-2xl font-bold">{topicData.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                          <Award className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bloom Levels</p>
                          <p className="text-2xl font-bold">{bloomData.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Charts Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Difficulty Distribution - Donut Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <PieChart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Difficulty Distribution</CardTitle>
                          <CardDescription>Questions by difficulty level</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={difficultyData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={110}
                              paddingAngle={4}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                            >
                              {difficultyData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={DIFFICULTY_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                                  stroke="hsl(var(--background))"
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
                      <div className="flex justify-center gap-6 mt-4">
                        {difficultyData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: DIFFICULTY_COLORS[entry.name] || CHART_COLORS[index] }}
                            />
                            <span className="text-sm">{entry.name}: {entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bloom's Taxonomy - Horizontal Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                          <BarChart3 className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <CardTitle>Bloom's Taxonomy</CardTitle>
                          <CardDescription>Cognitive level distribution</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bloomData} layout="vertical" barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={100} 
                              stroke="hsl(var(--muted-foreground))" 
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="value" 
                              radius={[0, 8, 8, 0]}
                            >
                              {bloomData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Topic Coverage - Area Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                          <TrendingUp className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <CardTitle>Topic Coverage</CardTitle>
                          <CardDescription>Questions per topic</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={topicData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="name" 
                              stroke="hsl(var(--muted-foreground))" 
                              fontSize={11}
                              tickLine={false}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(38, 92%, 50%)" 
                              strokeWidth={2}
                              fill="url(#colorValue)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Marks Allocation - Donut Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                          <Award className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <CardTitle>Marks Allocation</CardTitle>
                          <CardDescription>Distribution of marks</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={marksData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={110}
                              paddingAngle={4}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                            >
                              {marksData.map((_, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                  stroke="hsl(var(--background))"
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No analytics data available for this paper. The paper may not have been fully processed yet.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
