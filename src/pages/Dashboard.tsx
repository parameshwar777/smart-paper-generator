import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Brain, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { paperApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface PaperHistory {
  id: number;
  subject_name?: string;
  created_at: string;
  total_marks?: number;
  ai_engine?: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<PaperHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await paperApi.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load paper history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPapers = history.length;
  const lastPaperId = history.length > 0 ? history[0]?.id : 'N/A';
  const recentPapers = history.slice(0, 5);

  // Calculate AI engine usage from history
  const aiEngineUsage = history.length > 0 
    ? history.reduce((acc, paper) => {
        const engine = paper.ai_engine || 'Unknown';
        acc[engine] = (acc[engine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const mostUsedEngine = Object.entries(aiEngineUsage).sort((a, b) => b[1] - a[1])[0];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your question paper generation system
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Papers Generated"
            value={isLoading ? '...' : totalPapers}
            icon={FileText}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Last Paper ID"
            value={isLoading ? '...' : lastPaperId}
            icon={Clock}
            variant="default"
            delay={0.1}
          />
          <StatCard
            title="AI Engine Usage"
            value={isLoading ? '...' : (mostUsedEngine ? mostUsedEngine[0] : 'N/A')}
            subtitle={isLoading ? '' : (mostUsedEngine ? `${mostUsedEngine[1]} papers` : 'No data')}
            icon={Brain}
            variant="success"
            delay={0.2}
          />
          <StatCard
            title="Total Marks Generated"
            value={isLoading ? '...' : history.reduce((acc, p) => acc + (p.total_marks || 0), 0)}
            icon={TrendingUp}
            variant="warning"
            delay={0.3}
          />
        </div>

        {/* Recent Papers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Papers</CardTitle>
              <CardDescription>
                Your recently generated question papers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentPapers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No papers generated yet</p>
                  <button
                    onClick={() => navigate('/generate')}
                    className="mt-4 text-sm text-primary hover:underline"
                  >
                    Generate your first paper
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPapers.map((paper, index) => (
                    <motion.div
                      key={paper.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Paper #{paper.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {paper.subject_name || 'Question Paper'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {paper.ai_engine ?? 'N/A'}
                        </Badge>
                        <Badge variant="outline">
                          {paper.total_marks ?? 'N/A'}{paper.total_marks != null ? ' marks' : ''}
                        </Badge>
                        <button
                          onClick={() => navigate(`/paper/${paper.id}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          View
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
