import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  FileText, 
  Award, 
  BookOpen, 
  Target, 
  ChevronDown,
  ChevronUp,
  Printer,
  Share2,
  BarChart3,
  Clock,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Brain
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { paperApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Question {
  id?: number;
  question_number?: number;
  text: string;
  difficulty: string;
  bloom: string;
  bloom_level?: string;
  marks: number;
  topic?: string;
  unit?: string;
}

interface Section {
  section_id?: number;
  section_name?: string;
  title?: string;
  questions?: Question[];
  text?: string;
  difficulty?: string;
  bloom?: string;
  marks?: number;
}

interface Paper {
  id?: number;
  paper_id?: number;
  subject_name?: string;
  subject?: string;
  total_marks?: number;
  total_questions?: number;
  engine_used?: string;
  created_at?: string;
  questions?: Question[];
  sections?: Section[];
}

const difficultyConfig = {
  easy: { 
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: '🟢',
    label: 'Easy'
  },
  medium: { 
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: '🟡',
    label: 'Medium'
  },
  hard: { 
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: '🔴',
    label: 'Hard'
  },
};

const bloomConfig: Record<string, { color: string; level: number }> = {
  remember: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', level: 1 },
  understand: { color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', level: 2 },
  apply: { color: 'bg-green-500/10 text-green-400 border-green-500/20', level: 3 },
  analyze: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', level: 4 },
  evaluate: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', level: 5 },
  create: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', level: 6 },
};

export default function PaperPreview() {
  const { paperId } = useParams<{ paperId: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
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
      // Expand all sections by default
      if (data.sections) {
        setExpandedSections(new Set(data.sections.map((_: Section, i: number) => i)));
      }
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

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    if (paper?.sections) {
      setExpandedSections(new Set(paper.sections.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Normalize questions from both formats
  const getAllQuestions = (): Question[] => {
    if (!paper) return [];
    
    // If paper has sections with questions
    if (paper.sections && paper.sections.length > 0) {
      // Check if sections have questions array
      if (paper.sections[0].questions) {
        return paper.sections.flatMap(s => s.questions || []);
      }
      // Sections ARE the questions (flat structure)
      return paper.sections.map((s, i) => ({
        id: s.section_id || i,
        question_number: i + 1,
        text: s.text || s.title || '',
        difficulty: s.difficulty || 'medium',
        bloom: s.bloom || 'understand',
        bloom_level: s.bloom,
        marks: s.marks || 0,
      }));
    }
    
    // If paper has direct questions array
    if (paper.questions) {
      return paper.questions;
    }
    
    return [];
  };

  const questions = getAllQuestions();
  
  // Calculate stats
  const totalMarks = paper?.total_marks || questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalQuestions = paper?.total_questions || questions.length;
  
  const difficultyStats = questions.reduce((acc, q) => {
    const diff = q.difficulty?.toLowerCase() || 'medium';
    acc[diff] = (acc[diff] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bloomStats = questions.reduce((acc, q) => {
    const bloom = (q.bloom || q.bloom_level || 'understand').toLowerCase();
    acc[bloom] = (acc[bloom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading paper...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!paper) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-xl font-medium">Paper not found</p>
            <p className="mt-2 text-muted-foreground">The requested paper could not be loaded</p>
            <Button onClick={() => navigate('/papers')} variant="outline" className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Papers
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Render sections or flat questions
  const hasSections = paper.sections && paper.sections.length > 0 && paper.sections[0].questions;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Question Paper #{paper.paper_id || paper.id || paperId}
                </h1>
                <p className="text-muted-foreground">
                  {paper.subject_name || paper.subject || 'Question Paper'} 
                  {paper.engine_used && <span className="ml-2 text-primary">• {paper.engine_used}</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/analytics?paper=${paperId}`)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} size="sm" className="shadow-glow">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-primary/20 p-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{totalQuestions}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-success/20 p-3">
                <Award className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{totalMarks}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-warning/20 p-3">
                <Target className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Marks/Q</p>
                <p className="text-2xl font-bold">
                  {totalQuestions > 0 ? (totalMarks / totalQuestions).toFixed(1) : 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-accent/20 p-3">
                <Brain className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bloom Levels</p>
                <p className="text-2xl font-bold">{Object.keys(bloomStats).length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty & Bloom Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid gap-4 md:grid-cols-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Difficulty Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(difficultyConfig).map(([key, config]) => {
                  const count = difficultyStats[key] || 0;
                  const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span className="capitalize">{config.label}</span>
                        </span>
                        <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className={cn("h-full rounded-full", 
                            key === 'easy' ? 'bg-emerald-500' : 
                            key === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bloom's Taxonomy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(bloomConfig).map(([key, config]) => {
                  const count = bloomStats[key] || 0;
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className={cn("capitalize text-xs", config.color)}
                    >
                      <span className="mr-1 text-[10px]">L{config.level}</span>
                      {key} ({count})
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    {hasSections 
                      ? `${paper.sections?.length} sections with ${totalQuestions} total questions`
                      : `${totalQuestions} questions in this paper`
                    }
                  </CardDescription>
                </div>
                {hasSections && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={expandAll}>
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Expand All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll}>
                      <ChevronUp className="mr-1 h-4 w-4" />
                      Collapse All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {hasSections ? (
                // Render sectioned questions
                <div className="divide-y divide-border">
                  {paper.sections?.map((section, sectionIndex) => (
                    <Collapsible
                      key={sectionIndex}
                      open={expandedSections.has(sectionIndex)}
                      onOpenChange={() => toggleSection(sectionIndex)}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                            {sectionIndex + 1}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{section.section_name || section.title || `Section ${sectionIndex + 1}`}</p>
                            <p className="text-sm text-muted-foreground">
                              {section.questions?.length || 0} questions
                            </p>
                          </div>
                        </div>
                        {expandedSections.has(sectionIndex) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                          {section.questions?.map((question, qIndex) => (
                            <QuestionCard key={qIndex} question={question} index={qIndex} />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                // Render flat questions list
                <div className="p-4 space-y-3">
                  {questions.length > 0 ? (
                    questions.map((question, index) => (
                      <QuestionCard key={index} question={question} index={index} />
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No questions found in this paper</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

// Question Card Component
function QuestionCard({ question, index }: { question: Question; index: number }) {
  const difficulty = question.difficulty?.toLowerCase() || 'medium';
  const bloom = (question.bloom || question.bloom_level || 'understand').toLowerCase();
  const diffConfig = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;
  const bloomCfg = bloomConfig[bloom] || bloomConfig.understand;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.02 * index }}
      className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {question.question_number || index + 1}
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-base leading-relaxed">{question.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("capitalize text-xs", diffConfig.color)}>
              {diffConfig.icon} {diffConfig.label}
            </Badge>
            <Badge variant="outline" className={cn("capitalize text-xs", bloomCfg.color)}>
              <BookOpen className="mr-1 h-3 w-3" />
              {bloom}
            </Badge>
            {question.topic && (
              <Badge variant="secondary" className="text-xs">
                {question.topic}
              </Badge>
            )}
          </div>
        </div>
        <div className="shrink-0 rounded-lg bg-gradient-to-br from-muted to-muted/50 px-3 py-2 text-center border border-border">
          <p className="text-lg font-bold">{question.marks}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">marks</p>
        </div>
      </div>
    </motion.div>
  );
}
