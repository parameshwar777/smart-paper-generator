import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Loader2, FileText, Award, BookOpen, Target } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { paperApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question_number: number;
  text: string;
  difficulty: string;
  bloom_level: string;
  marks: number;
}

interface Paper {
  id: number;
  subject_name?: string;
  total_marks?: number;
  created_at?: string;
  questions: Question[];
}

const difficultyColors = {
  easy: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

const bloomColors: Record<string, string> = {
  remember: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  understand: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  apply: 'bg-green-500/10 text-green-400 border-green-500/20',
  analyze: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  evaluate: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  create: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function PaperPreview() {
  const { paperId } = useParams<{ paperId: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (paperId) {
      loadPaper(parseInt(paperId));
    }
  }, [paperId]);

  const loadPaper = async (id: number) => {
    try {
      const data = await paperApi.getPaper(id);
      setPaper(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load paper',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (paperId) {
      window.open(paperApi.downloadPdf(parseInt(paperId)), '_blank');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!paper) {
    return (
      <DashboardLayout>
        <div className="flex h-96 flex-col items-center justify-center">
          <FileText className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-xl font-medium">Paper not found</p>
          <Button onClick={() => navigate('/papers')} variant="link" className="mt-2">
            Back to papers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Paper #{paper.id}</h1>
            </div>
            <p className="ml-10 text-muted-foreground">
              {paper.subject_name || 'Question Paper'} • {paper.questions?.length || 0} Questions • {paper.total_marks || 100} Marks
            </p>
          </div>
          <Button onClick={handleDownload} className="shadow-glow">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{paper.questions?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-success/10 p-3">
                <Award className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{paper.total_marks || 100}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <Target className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Marks/Question</p>
                <p className="text-2xl font-bold">
                  {paper.questions?.length ? ((paper.total_marks || 100) / paper.questions.length).toFixed(1) : 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>All questions in this paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paper.questions?.length > 0 ? (
                paper.questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="rounded-lg border border-border bg-card/50 p-5 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {question.question_number || index + 1}
                        </div>
                        <div className="space-y-2">
                          <p className="text-base leading-relaxed">{question.text}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize',
                                difficultyColors[question.difficulty?.toLowerCase() as keyof typeof difficultyColors] || difficultyColors.medium
                              )}
                            >
                              {question.difficulty || 'Medium'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize',
                                bloomColors[question.bloom_level?.toLowerCase()] || 'bg-muted text-muted-foreground'
                              )}
                            >
                              <BookOpen className="mr-1 h-3 w-3" />
                              {question.bloom_level || 'Understand'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 rounded-lg bg-muted px-3 py-1.5 text-center">
                        <p className="text-lg font-bold">{question.marks}</p>
                        <p className="text-xs text-muted-foreground">marks</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No questions found in this paper</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
