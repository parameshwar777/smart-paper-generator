import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, Award, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Static placeholder data - ready for future API integration
const studentsData = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', papers_attempted: 12, avg_score: 85, status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', papers_attempted: 8, avg_score: 72, status: 'active' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', papers_attempted: 15, avg_score: 91, status: 'active' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', papers_attempted: 10, avg_score: 78, status: 'inactive' },
  { id: 5, name: 'Edward Norton', email: 'edward@example.com', papers_attempted: 6, avg_score: 65, status: 'active' },
  { id: 6, name: 'Fiona Apple', email: 'fiona@example.com', papers_attempted: 20, avg_score: 88, status: 'active' },
  { id: 7, name: 'George Lucas', email: 'george@example.com', papers_attempted: 5, avg_score: 70, status: 'inactive' },
  { id: 8, name: 'Hannah Montana', email: 'hannah@example.com', papers_attempted: 18, avg_score: 95, status: 'active' },
];

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success';
  if (score >= 75) return 'text-primary';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

export default function Students() {
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

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={studentsData.length}
            icon={Users}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Active Students"
            value={studentsData.filter(s => s.status === 'active').length}
            icon={GraduationCap}
            variant="success"
            delay={0.1}
          />
          <StatCard
            title="Avg. Score"
            value={`${Math.round(studentsData.reduce((acc, s) => acc + s.avg_score, 0) / studentsData.length)}%`}
            icon={TrendingUp}
            variant="warning"
            delay={0.2}
          />
          <StatCard
            title="Top Performer"
            value="Hannah M."
            subtitle="95% Average"
            icon={Award}
            variant="default"
            delay={0.3}
          />
        </div>

        {/* Future ML Integration Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                  {studentsData.map((student, index) => (
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
                        {student.papers_attempted}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getScoreColor(student.avg_score)}`}>
                          {student.avg_score}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={student.status === 'active' ? 'default' : 'secondary'}
                          className={student.status === 'active' ? 'bg-success/10 text-success' : ''}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
