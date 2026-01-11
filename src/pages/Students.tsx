import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, Award, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: number;
  name: string;
  email: string;
  papers_attempted?: number;
  avg_score?: number;
  status?: string;
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to fetch students from API
      const response = await api.get('/students');
      const data = response.data;
      
      if (Array.isArray(data)) {
        setStudents(data);
        // Calculate stats from data
        const activeStudents = data.filter((s: Student) => s.status === 'active').length;
        const avgScore = data.length > 0 
          ? Math.round(data.reduce((acc: number, s: Student) => acc + (s.avg_score || 0), 0) / data.length)
          : 0;
        const topPerformer = data.reduce((top: Student | null, s: Student) => 
          (!top || (s.avg_score || 0) > (top.avg_score || 0)) ? s : top, null);
        
        setStats({
          total_students: data.length,
          active_students: activeStudents,
          avg_score: avgScore,
          top_performer: topPerformer ? { name: topPerformer.name, score: topPerformer.avg_score || 0 } : undefined,
        });
      } else if (data.students) {
        setStudents(data.students);
        setStats(data.stats);
      }
    } catch (err: any) {
      // API endpoint might not exist yet
      setError('Students API not available. This feature requires backend integration.');
      setStudents([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Student performance analytics and management
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <>
            {/* Error/Not Available Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {/* Future ML Integration Notice */}
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
                    <p className="font-semibold">ML-Powered Analytics Coming Soon</p>
                    <p className="text-sm text-muted-foreground">
                      Future integration will include predictive performance analysis, personalized learning paths, and AI-driven insights.
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
                    Overview of all registered students and their performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No students found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-center">Papers Attempted</TableHead>
                          <TableHead className="text-center">Avg. Score</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="group"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  {student.name.charAt(0)}
                                </div>
                                <span className="font-medium">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.email}
                            </TableCell>
                            <TableCell className="text-center">
                              {student.papers_attempted || 0}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-semibold ${getScoreColor(student.avg_score || 0)}`}>
                                {student.avg_score || 0}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={student.status === 'active' ? 'default' : 'secondary'}
                                className={student.status === 'active' ? 'bg-success/10 text-success' : ''}
                              >
                                {student.status || 'unknown'}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
