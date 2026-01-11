import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Download, Eye, AlertCircle, Zap, Brain, ChevronRight, CheckCircle2, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { academicApi, paperApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface SelectOption {
  id: number;
  name: string;
}

export default function GeneratePaper() {
  const [years, setYears] = useState<SelectOption[]>([]);
  const [semesters, setSemesters] = useState<SelectOption[]>([]);
  const [subjects, setSubjects] = useState<SelectOption[]>([]);
  const [units, setUnits] = useState<SelectOption[]>([]);
  const [topics, setTopics] = useState<SelectOption[]>([]);

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [aiEngine, setAiEngine] = useState<string>('openai');
  const [difficulty, setDifficulty] = useState({ easy: 30, medium: 50, hard: 20 });
  const [totalMarks, setTotalMarks] = useState<number>(100);

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaperId, setGeneratedPaperId] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadYears();
  }, []);

  // Simulate progress during generation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setGenerationProgress(0);
    }
  }, [isGenerating]);

  // Helper to normalize API response to {id, name} format
  const normalizeOptions = (data: any[], idKey: string, nameKey: string): SelectOption[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      id: item[idKey],
      name: item[nameKey] || `${nameKey.replace('_name', '').replace('_number', '')} ${item[idKey]}`,
    }));
  };

  const loadYears = async () => {
    try {
      setIsLoading(true);
      const data = await academicApi.getYears();
      setYears(normalizeOptions(data, 'year_id', 'year_number').map(y => ({ ...y, name: `Year ${y.name}` })));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load years', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = async (yearId: string) => {
    setSelectedYear(yearId);
    setSelectedSemester('');
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSemesters([]);
    setSubjects([]);
    setUnits([]);
    setTopics([]);

    try {
      const data = await academicApi.getSemesters(parseInt(yearId));
      setSemesters(normalizeOptions(data, 'semester_id', 'semester_number').map(s => ({ ...s, name: `Semester ${s.name}` })));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load semesters', variant: 'destructive' });
    }
  };

  const handleSemesterChange = async (semesterId: string) => {
    setSelectedSemester(semesterId);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSubjects([]);
    setUnits([]);
    setTopics([]);

    try {
      const data = await academicApi.getSubjects(parseInt(semesterId));
      setSubjects(normalizeOptions(data, 'subject_id', 'subject_name'));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load subjects', variant: 'destructive' });
    }
  };

  const handleSubjectChange = async (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedUnit('');
    setSelectedTopic('');
    setUnits([]);
    setTopics([]);

    try {
      const data = await academicApi.getUnits(parseInt(subjectId));
      setUnits(normalizeOptions(data, 'unit_id', 'unit_number').map(u => ({ ...u, name: `Unit ${u.name}` })));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load units', variant: 'destructive' });
    }
  };

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedTopic('');
    setTopics([]);

    try {
      const data = await academicApi.getTopics(parseInt(unitId));
      setTopics(normalizeOptions(data, 'topic_id', 'topic_name'));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load topics', variant: 'destructive' });
    }
  };

  const handleDifficultyChange = (type: 'easy' | 'medium' | 'hard', value: number) => {
    const remaining = 100 - value;
    const others = type === 'easy' 
      ? ['medium', 'hard'] as const
      : type === 'medium' 
        ? ['easy', 'hard'] as const
        : ['easy', 'medium'] as const;
    
    const otherTotal = difficulty[others[0]] + difficulty[others[1]];
    const ratio = otherTotal > 0 ? remaining / otherTotal : 0.5;
    
    setDifficulty({
      ...difficulty,
      [type]: value,
      [others[0]]: Math.round(difficulty[others[0]] * ratio),
      [others[1]]: Math.round(difficulty[others[1]] * ratio),
    });
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedUnit || !selectedTopic) {
      toast({ title: 'Error', description: 'Please select subject, unit, and topic', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedPaperId(null);

    try {
      // Get the topic name for the unit_topic_map
      const topicName = topics.find(t => t.id.toString() === selectedTopic)?.name || '';
      
      const payload = {
        subject_id: parseInt(selectedSubject),
        paper_model_id: 1,
        ai_engine: aiEngine === 'openai' ? 'OPENAI' : 'RULE_ML_HYBRID',
        difficulty_distribution: {
          Easy: Math.round(difficulty.easy / 10),
          Medium: Math.round(difficulty.medium / 10),
          Hard: Math.round(difficulty.hard / 10),
        },
        unit_topic_map: {
          [selectedUnit]: topicName,
        },
        marks_map: {
          Easy: 5,
          Medium: 10,
          Hard: 15,
        },
        generated_by: 1,
      };

      const response = await paperApi.generate(payload);
      setGenerationProgress(100);
      setGeneratedPaperId(response.paper_id || response.id);
      toast({
        title: 'Success!',
        description: 'Question paper generated successfully',
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.response?.data?.detail || 'Failed to generate paper',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedPaperId) {
      window.open(paperApi.downloadPdf(generatedPaperId), '_blank');
    }
  };

  const getSelectionName = (options: SelectOption[], id: string) => {
    return options.find(o => o.id.toString() === id)?.name || '';
  };

  const completionSteps = [
    { label: 'Year', complete: !!selectedYear },
    { label: 'Semester', complete: !!selectedSemester },
    { label: 'Subject', complete: !!selectedSubject },
  ];

  const completionPercentage = (completionSteps.filter(s => s.complete).length / completionSteps.length) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight">Generate Question Paper</h1>
          <p className="text-muted-foreground">
            Configure academic parameters and generate AI-powered question papers
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Academic Selection Card */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Academic Selection</CardTitle>
                      <CardDescription>Choose year, semester, subject, and more</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="font-semibold text-primary">{Math.round(completionPercentage)}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Two Column Grid - Year & Semester */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Year</Label>
                    <Select value={selectedYear} onValueChange={handleYearChange}>
                      <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {years.map((year) => (
                          <SelectItem key={year.id} value={year.id.toString()}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Semester</Label>
                    <Select value={selectedSemester} onValueChange={handleSemesterChange} disabled={!selectedYear}>
                      <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-colors disabled:opacity-50">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {semesters.map((sem) => (
                          <SelectItem key={sem.id} value={sem.id.toString()}>
                            {sem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Two Column Grid - Subject & Unit */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Subject</Label>
                    <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={!selectedSemester}>
                      <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-colors disabled:opacity-50">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id.toString()}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Unit <span className="text-muted-foreground">(Optional)</span></Label>
                    <Select value={selectedUnit} onValueChange={handleUnitChange} disabled={!selectedSubject}>
                      <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-colors disabled:opacity-50">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Full Width - Topic */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Topic <span className="text-muted-foreground">(Optional)</span></Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={!selectedUnit}>
                    <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-colors disabled:opacity-50">
                      <SelectValue placeholder="Select Topic" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Engine & Settings Card */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Brain className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>Select AI engine and configure paper settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* AI Engine Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">AI Engine</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setAiEngine('openai')}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        aiEngine === 'openai'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/20 hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          aiEngine === 'openai' ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <Zap className={`h-5 w-5 ${aiEngine === 'openai' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">OpenAI GPT</p>
                          <p className="text-sm text-muted-foreground">Advanced language model for high-quality questions</p>
                        </div>
                        {aiEngine === 'openai' && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setAiEngine('hybrid')}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        aiEngine === 'hybrid'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/20 hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          aiEngine === 'hybrid' ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <Brain className={`h-5 w-5 ${aiEngine === 'hybrid' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Rule + ML Hybrid</p>
                          <p className="text-sm text-muted-foreground">Combine rule-based with machine learning</p>
                        </div>
                        {aiEngine === 'hybrid' && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Total Marks Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Marks</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[totalMarks]}
                      onValueChange={([value]) => setTotalMarks(value)}
                      min={25}
                      max={200}
                      step={25}
                      className="flex-1"
                    />
                    <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-border bg-muted/30 font-semibold">
                      {totalMarks}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Distribution Card */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle>Difficulty Distribution</CardTitle>
                <CardDescription>Adjust the percentage of questions by difficulty level</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-success" />
                        <span className="text-sm font-medium">Easy</span>
                      </div>
                      <span className="text-xl font-bold text-success">{difficulty.easy}%</span>
                    </div>
                    <Slider
                      value={[difficulty.easy]}
                      onValueChange={([value]) => handleDifficultyChange('easy', value)}
                      max={100}
                      step={5}
                      className="[&_[role=slider]]:bg-success [&_.range]:bg-success"
                    />
                    <p className="text-xs text-muted-foreground">Basic recall & understanding</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-warning" />
                        <span className="text-sm font-medium">Medium</span>
                      </div>
                      <span className="text-xl font-bold text-warning">{difficulty.medium}%</span>
                    </div>
                    <Slider
                      value={[difficulty.medium]}
                      onValueChange={([value]) => handleDifficultyChange('medium', value)}
                      max={100}
                      step={5}
                      className="[&_[role=slider]]:bg-warning [&_.range]:bg-warning"
                    />
                    <p className="text-xs text-muted-foreground">Application & analysis</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-destructive" />
                        <span className="text-sm font-medium">Hard</span>
                      </div>
                      <span className="text-xl font-bold text-destructive">{difficulty.hard}%</span>
                    </div>
                    <Slider
                      value={[difficulty.hard]}
                      onValueChange={([value]) => handleDifficultyChange('hard', value)}
                      max={100}
                      step={5}
                      className="[&_[role=slider]]:bg-destructive [&_.range]:bg-destructive"
                    />
                    <p className="text-xs text-muted-foreground">Synthesis & evaluation</p>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="mt-6 h-4 flex rounded-full overflow-hidden">
                  <motion.div
                    className="bg-success"
                    style={{ width: `${difficulty.easy}%` }}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  <motion.div
                    className="bg-warning"
                    style={{ width: `${difficulty.medium}%` }}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  <motion.div
                    className="bg-destructive"
                    style={{ width: `${difficulty.hard}%` }}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSubject || !selectedUnit || !selectedTopic}
                className="w-full h-14 text-lg shadow-glow"
                size="lg"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating Paper...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Question Paper</span>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </motion.div>

            {/* Generation Progress */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Generating questions with AI...</span>
                    <span className="font-medium">{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-8 overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle>Generated Paper</CardTitle>
                <CardDescription>View and download your paper</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {generatedPaperId ? (
                    <motion.div
                      key="result"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="rounded-xl bg-success/10 border border-success/20 p-6 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
                        <p className="text-sm text-muted-foreground">Paper Generated Successfully</p>
                        <p className="text-4xl font-bold text-success mt-1">#{generatedPaperId}</p>
                      </div>

                      {/* Summary */}
                      <div className="space-y-3 text-sm">
                        {selectedSubject && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subject</span>
                            <span className="font-medium">{getSelectionName(subjects, selectedSubject)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AI Engine</span>
                          <span className="font-medium">{aiEngine === 'openai' ? 'OpenAI GPT' : 'Hybrid'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Marks</span>
                          <span className="font-medium">{totalMarks}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(`/paper/${generatedPaperId}`)}
                          variant="outline"
                          className="w-full h-11"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Questions
                        </Button>
                        <Button onClick={handleDownload} className="w-full h-11">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button
                          onClick={() => navigate(`/analytics?paper=${generatedPaperId}`)}
                          variant="secondary"
                          className="w-full h-11"
                        >
                          View Analytics
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Alert className="bg-muted/30 border-dashed">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Configure the options and click generate to create a new question paper.
                        </AlertDescription>
                      </Alert>

                      {/* Quick tips */}
                      <div className="mt-6 space-y-3">
                        <p className="text-sm font-medium">Quick Tips:</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                            Select Year, Semester, and Subject (required)
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                            Unit and Topic are optional for broader coverage
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                            Adjust difficulty distribution as needed
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
