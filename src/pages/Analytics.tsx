import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, PieChart, AlertCircle } from 'lucide-react';
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
} from 'recharts';

interface PaperHistory {
  id: number;
  subject_name?: string;
}

interface Analytics {
  difficulty_distribution?: { [key: string]: number };
  bloom_taxonomy?: { [key: string]: number };
  topic_coverage?: { [key: string]: number };
  marks_allocation?: { [key: string]: number };
}

const COLORS = {
  primary: 'hsl(238, 84%, 67%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
  blue: 'hsl(210, 90%, 55%)',
  cyan: 'hsl(190, 90%, 50%)',
  purple: 'hsl(280, 70%, 60%)',
  pink: 'hsl(330, 80%, 60%)',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.destructive, COLORS.blue, COLORS.purple];

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

  const difficultyData = formatChartData(analytics?.difficulty_distribution);
  const bloomData = formatChartData(analytics?.bloom_taxonomy);
  const topicData = formatChartData(analytics?.topic_coverage);
  const marksData = formatChartData(analytics?.marks_allocation);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
          <p className="font-medium">{label || payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Value: <span className="font-semibold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Analyze the distribution and coverage of your question papers
          </p>
        </motion.div>

        {/* Paper Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Select Paper</CardTitle>
              <CardDescription>Choose a paper to view its analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPapers ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Loading papers...</span>
                </div>
              ) : (
                <Select value={selectedPaper} onValueChange={setSelectedPaper}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select a paper" />
                  </SelectTrigger>
                  <SelectContent>
                    {papers.map((paper) => (
                      <SelectItem key={paper.id} value={paper.id.toString()}>
                        Paper #{paper.id} - {paper.subject_name || 'Question Paper'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Charts */}
        {!selectedPaper ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a paper to view its analytics
            </AlertDescription>
          </Alert>
        ) : isLoadingAnalytics ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : analytics ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Difficulty Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Difficulty Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of questions by difficulty level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={difficultyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {difficultyData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bloom Taxonomy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-success" />
                    Bloom's Taxonomy
                  </CardTitle>
                  <CardDescription>
                    Distribution across cognitive levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bloomData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Topic Coverage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-warning" />
                    Topic Coverage
                  </CardTitle>
                  <CardDescription>
                    Questions distributed across topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Marks Allocation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-destructive" />
                    Marks Allocation
                  </CardTitle>
                  <CardDescription>
                    Distribution of marks by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={marksData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {marksData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No analytics data available for this paper
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}
