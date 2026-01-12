import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, TrendingUp, Award, Loader2, AlertCircle, 
  Upload, FileSpreadsheet, X, BarChart3, ChevronRight 
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { studentsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// API response structure
interface StudentApiResponse {
  result_id: number;
  student_id: number;
  paper_id: number;
  marks_obtained: number;
  max_marks: number;
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  created_at: string;
}

// UI display structure
interface Student {
  result_id: number;
  student_id: number;
  paper_id: number;
  marks_obtained: number;
  max_marks: number;
  easy: number;
  medium: number;
  hard: number;
  created_at: string;
}

interface StudentAnalytics {
  student_id: number;
  name: string;
  total_papers: number;
  average_score: number;
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  performance_trend: Array<{
    paper_id: number;
    score: number;
  }>;
}

interface StudentsStats {
  total_students: number;
  active_students: number;
  avg_score: number;
  top_performer?: {
    name: string;
    score: number;
  };
}

const COLORS = {
  easy: 'hsl(var(--success))',
  medium: 'hsl(var(--warning))',
  hard: 'hsl(var(--destructive))',
};

const chartConfig = {
  easy: { label: 'Easy', color: 'hsl(var(--success))' },
  medium: { label: 'Medium', color: 'hsl(var(--warning))' },
  hard: { label: 'Hard', color: 'hsl(var(--destructive))' },
  score: { label: 'Score', color: 'hsl(var(--primary))' },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success';
  if (score >= 75) return 'text-primary';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: StudentApiResponse[] = await studentsApi.getAll();
      
      if (Array.isArray(data)) {
        // Transform API response to UI structure
        const transformed: Student[] = data.map(s => ({
          result_id: s.result_id,
          student_id: s.student_id,
          paper_id: s.paper_id,
          marks_obtained: s.marks_obtained,
          max_marks: s.max_marks,
          easy: s.difficulty_breakdown?.easy || 0,
          medium: s.difficulty_breakdown?.medium || 0,
          hard: s.difficulty_breakdown?.hard || 0,
          created_at: s.created_at,
        }));
        setStudents(transformed);
        calculateStats(transformed);
      }
    } catch (err: any) {
      setError('No students found. Upload a CSV to get started.');
      setStudents([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: Student[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const uniqueStudents = [...new Map(data.map(s => [s.student_id, s])).values()];
    const avgScore = Math.round(
      data.reduce((acc, s) => acc + (s.marks_obtained / s.max_marks) * 100, 0) / data.length
    );
    const topPerformer = data.reduce((top, s) => {
      const score = (s.marks_obtained / s.max_marks) * 100;
      const topScore = top ? (top.marks_obtained / top.max_marks) * 100 : 0;
      return score > topScore ? s : top;
    }, data[0]);

    setStats({
      total_students: uniqueStudents.length,
      active_students: uniqueStudents.length,
      avg_score: avgScore,
      top_performer: topPerformer ? {
        name: `Student ${topPerformer.student_id}`,
        score: Math.round((topPerformer.marks_obtained / topPerformer.max_marks) * 100),
      } : undefined,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      await studentsApi.uploadCsv(file);
      toast({
        title: 'Upload successful',
        description: 'Student data has been imported',
      });
      await loadStudents();
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.response?.data?.detail || 'Failed to upload CSV',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewAnalytics = async (student: Student) => {
    setSelectedStudent(student);
    setShowAnalyticsDialog(true);
    setIsAnalyticsLoading(true);
    
    try {
      const analytics = await studentsApi.getAnalytics(student.student_id);
      setStudentAnalytics(analytics);
    } catch (err) {
      // Build analytics from local data if API fails
      const studentRecords = students.filter(s => s.student_id === student.student_id);
      const localAnalytics: StudentAnalytics = {
        student_id: student.student_id,
        name: `Student ${student.student_id}`,
        total_papers: studentRecords.length,
        average_score: Math.round(
          studentRecords.reduce((acc, s) => acc + (s.marks_obtained / s.max_marks) * 100, 0) / studentRecords.length
        ),
        difficulty_breakdown: {
          easy: studentRecords.reduce((acc, s) => acc + s.easy, 0),
          medium: studentRecords.reduce((acc, s) => acc + s.medium, 0),
          hard: studentRecords.reduce((acc, s) => acc + s.hard, 0),
        },
        performance_trend: studentRecords.map(s => ({
          paper_id: s.paper_id,
          score: Math.round((s.marks_obtained / s.max_marks) * 100),
        })),
      };
      setStudentAnalytics(localAnalytics);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const difficultyPieData = studentAnalytics ? [
    { name: 'Easy', value: studentAnalytics.difficulty_breakdown.easy, fill: COLORS.easy },
    { name: 'Medium', value: studentAnalytics.difficulty_breakdown.medium, fill: COLORS.medium },
    { name: 'Hard', value: studentAnalytics.difficulty_breakdown.hard, fill: COLORS.hard },
  ] : [];

  const performanceBarData = studentAnalytics?.performance_trend.map(t => ({
    paper: `Paper ${t.paper_id}`,
    score: t.score,
  })) || [];

  const radarData = studentAnalytics ? [
    { subject: 'Easy', score: studentAnalytics.difficulty_breakdown.easy, fullMark: 100 },
    { subject: 'Medium', score: studentAnalytics.difficulty_breakdown.medium, fullMark: 100 },
    { subject: 'Hard', score: studentAnalytics.difficulty_breakdown.hard, fullMark: 100 },
  ] : [];

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
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">
              Student performance analytics and management
            </p>
          </div>

          {/* CSV Upload Button */}
          <div className="flex gap-3">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import CSV
            </Button>
          </div>
        </motion.div>

        {/* CSV Format Help */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">CSV Format</p>
                <code className="mt-1 block text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                  student_id,name,year,paper_id,marks_obtained,max_marks,easy,medium,hard
                </code>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'No students found. Upload a CSV to get started.'}</AlertDescription>
            </Alert>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">ML-Powered Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Upload student data to unlock performance analytics, difficulty breakdown, and trend analysis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Students"
                value={stats?.total_students || 0}
                icon={Users}
                variant="primary"
                delay={0}
              />
              <StatCard
                title="Active Students"
                value={stats?.active_students || 0}
                icon={GraduationCap}
                variant="success"
                delay={0.1}
              />
              <StatCard
                title="Avg. Score"
                value={`${stats?.avg_score || 0}%`}
                icon={TrendingUp}
                variant="warning"
                delay={0.2}
              />
              <StatCard
                title="Top Performer"
                value={stats?.top_performer?.name || 'N/A'}
                subtitle={stats?.top_performer ? `${stats.top_performer.score}% Average` : undefined}
                icon={Award}
                variant="default"
                delay={0.3}
              />
            </div>

            {/* Students Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Student Directory</CardTitle>
                  <CardDescription>
                    Click on a student to view detailed analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Paper</TableHead>
                        <TableHead className="text-center">Result</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Difficulty Breakdown</TableHead>
                        <TableHead className="text-right">Analytics</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => {
                        const scorePercent = Math.round((student.marks_obtained / student.max_marks) * 100);
                        return (
                          <motion.tr
                            key={`${student.student_id}-${student.paper_id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="group cursor-pointer hover:bg-muted/50"
                            onClick={() => handleViewAnalytics(student)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  S{student.student_id}
                                </div>
                                <span className="font-medium">Student {student.student_id}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">Paper #{student.paper_id}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              #{student.paper_id}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              #{student.result_id}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-semibold ${getScoreColor(scorePercent)}`}>
                                {student.marks_obtained}/{student.max_marks}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="h-2 w-2 rounded-full bg-success" />
                                  <span>{student.easy}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="h-2 w-2 rounded-full bg-warning" />
                                  <span>{student.medium}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="h-2 w-2 rounded-full bg-destructive" />
                                  <span>{student.hard}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="gap-1">
                                <BarChart3 className="h-4 w-4" />
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Analytics Dialog */}
        <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedStudent && (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                      S{selectedStudent.student_id}
                    </div>
                    <div>
                      <p>Student {selectedStudent.student_id}</p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Student Analytics
                      </p>
                    </div>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {isAnalyticsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : studentAnalytics ? (
              <div className="space-y-6 mt-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{studentAnalytics.total_papers}</p>
                      <p className="text-sm text-muted-foreground">Papers Attempted</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${getScoreColor(studentAnalytics.average_score)}`}>
                        {studentAnalytics.average_score}%
                      </p>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">
                        {studentAnalytics.difficulty_breakdown.easy + studentAnalytics.difficulty_breakdown.medium + studentAnalytics.difficulty_breakdown.hard}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Difficulty Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Difficulty Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={difficultyPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {difficultyPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis />
                            <Radar
                              name="Score"
                              dataKey="score"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Trend Bar Chart */}
                {performanceBarData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Trend</CardTitle>
                      <CardDescription>Score across papers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceBarData}>
                            <XAxis dataKey="paper" />
                            <YAxis domain={[0, 100]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Difficulty Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Difficulty Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-success" />
                          <span className="font-medium">Easy Questions</span>
                        </div>
                        <span className="text-lg font-bold">{studentAnalytics.difficulty_breakdown.easy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-warning" />
                          <span className="font-medium">Medium Questions</span>
                        </div>
                        <span className="text-lg font-bold">{studentAnalytics.difficulty_breakdown.medium}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-destructive" />
                          <span className="font-medium">Hard Questions</span>
                        </div>
                        <span className="text-lg font-bold">{studentAnalytics.difficulty_breakdown.hard}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No analytics data available
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
