import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Eye, Download, Calendar, Award, Search, Filter, BarChart3, Sparkles, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paperApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaperHistory {
  id: number;
  subject_name?: string;
  created_at?: string;
  total_marks?: number;
  ai_engine?: string;
  question_count?: number;
  difficulty_distribution?: { easy: number; medium: number; hard: number };
}

export default function PaperHistoryPage() {
  const [papers, setPapers] = useState<PaperHistory[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PaperHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [engineFilter, setEngineFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPapers();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [papers, searchQuery, engineFilter]);

  const loadPapers = async () => {
    try {
      const data = await paperApi.getHistory();
      setPapers(Array.isArray(data) ? data : []);
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

  const filterPapers = () => {
    let filtered = [...papers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.id.toString().includes(query) ||
          (p.subject_name?.toLowerCase().includes(query))
      );
    }

    if (engineFilter !== 'all') {
      filtered = filtered.filter((p) => p.ai_engine?.toLowerCase() === engineFilter);
    }

    setFilteredPapers(filtered);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEngineVariant = (engine?: string) => {
    if (!engine) return 'secondary';
    return engine.toLowerCase() === 'openai' ? 'default' : 'outline';
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Paper History</h1>
            <p className="text-muted-foreground">
              Browse and manage your generated question papers
            </p>
          </div>
          <Button onClick={() => navigate('/generate')} className="shadow-glow">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New Paper
          </Button>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Papers</p>
                  <p className="text-2xl font-bold">{papers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                  <Award className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Marks</p>
                  <p className="text-2xl font-bold">
                    {papers.reduce((sum, p) => sum + (p.total_marks || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latest Paper</p>
                  <p className="text-2xl font-bold">
                    #{papers[0]?.id || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by paper ID or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <Select value={engineFilter} onValueChange={setEngineFilter}>
                  <SelectTrigger className="w-full md:w-48 h-11">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by engine" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Engines</SelectItem>
                    <SelectItem value="openai">OpenAI GPT</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none h-11 px-4"
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none h-11 px-4"
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Papers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPapers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xl font-medium">No papers found</p>
                <p className="mt-2 text-muted-foreground text-center">
                  {papers.length === 0
                    ? 'Start by generating your first question paper'
                    : 'Try adjusting your search or filter'}
                </p>
                {papers.length === 0 && (
                  <Button onClick={() => navigate('/generate')} className="mt-6">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Paper
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredPapers.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: 0.03 * index }}
                  >
                    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated hover:border-primary/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">Paper #{paper.id}</CardTitle>
                              <CardDescription className="line-clamp-1">
                                {paper.subject_name || 'Question Paper'}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={getEngineVariant(paper.ai_engine)}>
                            {paper.ai_engine || 'OpenAI'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(paper.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award className="h-4 w-4" />
                            <span>{paper.total_marks || 100} marks</span>
                          </div>
                        </div>

                        {paper.created_at && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(paper.created_at)}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/paper/${paper.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(paperApi.downloadPdf(paper.id), '_blank')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/analytics?paper=${paper.id}`)}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Stats
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paper ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>AI Engine</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPapers.map((paper) => (
                    <TableRow key={paper.id}>
                      <TableCell className="font-medium">#{paper.id}</TableCell>
                      <TableCell>{paper.subject_name || 'Question Paper'}</TableCell>
                      <TableCell>
                        <Badge variant={getEngineVariant(paper.ai_engine)}>
                          {paper.ai_engine || 'OpenAI'}
                        </Badge>
                      </TableCell>
                      <TableCell>{paper.total_marks || 100}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(paper.created_at)}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(paper.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/paper/${paper.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(paperApi.downloadPdf(paper.id), '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/analytics?paper=${paper.id}`)}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
