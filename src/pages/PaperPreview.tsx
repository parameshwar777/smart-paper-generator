import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  FileText, 
  Printer,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { paperApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  unit_id?: number;
  sub_part?: string;
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
  unit_id?: number;
}

interface Paper {
  id?: number;
  paper_id?: number;
  subject_name?: string;
  subject?: string;
  subject_code?: string;
  total_marks?: number;
  total_questions?: number;
  engine_used?: string;
  created_at?: string;
  time_hours?: number;
  year?: string;
  semester?: string;
  exam_type?: string;
  instructions?: string[];
  questions?: Question[];
  sections?: Section[];
}

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

  const handleDownload = async () => {
    if (paperId) {
      try {
        await paperApi.downloadPdf(parseInt(paperId));
      } catch {
        toast({ title: 'Error', description: 'Failed to download PDF', variant: 'destructive' });
      }
    }
  };

  // Normalize questions and group by unit
  const getUnitQuestions = (): Map<string, Question[]> => {
    if (!paper) return new Map();
    
    let allQuestions: Question[] = [];

    if (paper.sections && paper.sections.length > 0) {
      if (paper.sections[0].questions) {
        // Sections with nested questions
        paper.sections.forEach(section => {
          const unitLabel = section.section_name || section.title || 'Questions';
          (section.questions || []).forEach(q => {
            allQuestions.push({ ...q, unit: q.unit || unitLabel });
          });
        });
      } else {
        // Flat sections
        paper.sections.forEach((s, i) => {
          allQuestions.push({
            id: s.section_id || i,
            question_number: i + 1,
            text: s.text || s.title || '',
            difficulty: s.difficulty || 'medium',
            bloom: s.bloom || 'understand',
            marks: s.marks || 0,
            unit: `Unit ${s.unit_id || i + 1}`,
          });
        });
      }
    } else if (paper.questions) {
      allQuestions = paper.questions;
    }

    // Group by unit
    const unitMap = new Map<string, Question[]>();
    allQuestions.forEach(q => {
      const unitKey = q.unit || 'Questions';
      if (!unitMap.has(unitKey)) {
        unitMap.set(unitKey, []);
      }
      unitMap.get(unitKey)!.push(q);
    });

    // If no unit grouping, create a single group
    if (unitMap.size === 0 && allQuestions.length > 0) {
      unitMap.set('Questions', allQuestions);
    }

    return unitMap;
  };

  const unitQuestions = getUnitQuestions();
  const isFinalPaper = unitQuestions.size > 1;
  const allQuestions = Array.from(unitQuestions.values()).flat();
  const totalMarks = paper?.total_marks || allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalQuestions = paper?.total_questions || allQuestions.length;
  const timeHours = paper?.time_hours || 3;
  const subjectName = paper?.subject_name || paper?.subject || 'Question Paper';
  const subjectCode = paper?.subject_code || '';

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
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
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-xl font-medium">Paper not found</p>
          <Button onClick={() => navigate('/papers')} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Papers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 print:hidden"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/analytics?paper=${paperId}`)}>
              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </motion.div>

        {/* ===== EXAM PAPER FORMAT ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden print:shadow-none print:border-2 print:border-foreground">
            {/* Paper Header */}
            <div className="border-b-2 border-border p-6 sm:p-8 text-center space-y-3">
              {subjectCode && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Code No: <span className="font-semibold text-foreground">{subjectCode}</span></span>
                  <span>SET - 1</span>
                </div>
              )}

              {(paper?.year || paper?.semester) && (
                <p className="text-sm text-muted-foreground">
                  {paper.year && `${paper.year} `}
                  {paper.semester && `${paper.semester} `}
                  {paper.exam_type || 'Regular'} Examinations
                </p>
              )}

              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground">
                {subjectName}
              </h2>

              <div className="flex items-center justify-between text-sm font-medium">
                <span>Time: {timeHours} hours</span>
                <span>Max. Marks: {totalMarks}</span>
              </div>

              <Separator />

              {/* Instructions */}
              <div className="text-sm text-muted-foreground italic space-y-1">
                {paper.instructions && paper.instructions.length > 0 ? (
                  paper.instructions.map((inst, i) => <p key={i}>{inst}</p>)
                ) : unitQuestions.size > 1 ? (
                  <>
                    <p>Answer any {unitQuestions.size > 5 ? 'five' : unitQuestions.size} Questions — one Question from Each Unit</p>
                    <p>All Questions Carry Equal Marks</p>
                  </>
                ) : (
                  <p>Answer all questions</p>
                )}
              </div>
            </div>

            {/* Questions Body */}
            <div className="p-6 sm:p-8 space-y-4">
              {isFinalPaper ? (
                // ===== FINAL PAPER FORMAT (university exam style) =====
                (() => {
                  let globalQ = 0;
                  return Array.from(unitQuestions.entries()).map(([unitName, questions], unitIndex) => {
                    // Pair questions: every 2 questions get an "Or" between them
                    const pairs: Question[][] = [];
                    for (let i = 0; i < questions.length; i += 2) {
                      pairs.push(questions.slice(i, i + 2));
                    }

                    return (
                      <div key={unitIndex}>
                        {/* Unit Header */}
                        <div className="text-center font-bold text-sm py-2 text-foreground">
                          {unitName.toLowerCase().startsWith('unit') 
                            ? unitName.replace(/unit\s*/i, 'Unit - ').toUpperCase().replace('UNIT', 'Unit')
                            : `Unit - ${unitIndex + 1}`}
                        </div>

                        {pairs.map((pair, pairIndex) => (
                          <div key={pairIndex}>
                            {pair.map((question, qInPair) => {
                              globalQ++;
                              const qNum = globalQ;
                              const hasSubParts = question.sub_part || pair.length === 1;

                              return (
                                <div key={qInPair} className="mb-2">
                                  {/* If question has sub_parts or multiple marks entries, render with sub-parts */}
                                  <div className="flex gap-2 items-start py-1">
                                    <span className="font-medium text-foreground min-w-[2rem] shrink-0">
                                      {qNum}
                                    </span>
                                    {question.sub_part && (
                                      <span className="font-medium text-foreground min-w-[1.5rem] shrink-0">
                                        {question.sub_part})
                                      </span>
                                    )}
                                    <span className="flex-1 text-foreground leading-relaxed">
                                      {question.text}
                                    </span>
                                    <span className="shrink-0 font-medium text-foreground whitespace-nowrap">
                                      ({question.marks}M)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* "Or" separator between pairs (not after the last pair in a unit) */}
                            {pairIndex < pairs.length - 1 && (
                              <div className="text-center font-bold text-sm text-foreground py-1">
                                Or
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  });
                })()
              ) : (
                // ===== INDIVIDUAL PAPER FORMAT (single unit, no unit headers) =====
                <div className="space-y-5">
                  {allQuestions.map((question, qIndex) => {
                    const qNumber = question.question_number || qIndex + 1;
                    return (
                      <div key={qIndex} className="group">
                        <div className="flex gap-3">
                          <span className="font-bold text-foreground min-w-[2rem] shrink-0">
                            {qNumber}.
                          </span>
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                {question.sub_part && (
                                  <span className="font-semibold mr-1">{question.sub_part})</span>
                                )}
                                <span className="text-foreground leading-relaxed">
                                  {question.text}
                                </span>
                              </div>
                              <span className="shrink-0 font-semibold text-primary whitespace-nowrap">
                                ({question.marks}M)
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity print:opacity-100">
                              <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                {question.bloom || question.bloom_level || ''}
                              </Badge>
                              {question.topic && (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                  {question.topic}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {allQuestions.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No questions found in this paper</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 text-center text-xs text-muted-foreground">
              Paper #{paper.paper_id || paper.id || paperId}
              {paper.engine_used && <span> • Generated with {paper.engine_used}</span>}
              {paper.created_at && <span> • {new Date(paper.created_at).toLocaleDateString()}</span>}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
