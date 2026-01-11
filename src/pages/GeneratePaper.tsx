import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Download, Eye, AlertCircle } from 'lucide-react';
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

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaperId, setGeneratedPaperId] = useState<number | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      setIsLoading(true);
      const data = await academicApi.getYears();
      setYears(Array.isArray(data) ? data : []);
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
      setSemesters(Array.isArray(data) ? data : []);
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
      setSubjects(Array.isArray(data) ? data : []);
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
      setUnits(Array.isArray(data) ? data : []);
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
      setTopics(Array.isArray(data) ? data : []);
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
    if (!selectedSubject) {
      toast({ title: 'Error', description: 'Please select a subject', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedPaperId(null);

    try {
      const payload = {
        subject_id: parseInt(selectedSubject),
        unit_ids: selectedUnit ? [parseInt(selectedUnit)] : undefined,
        topic_ids: selectedTopic ? [parseInt(selectedTopic)] : undefined,
        ai_engine: aiEngine,
        difficulty_distribution: difficulty,
      };

      const response = await paperApi.generate(payload);
      setGeneratedPaperId(response.paper_id || response.id);
      toast({
        title: 'Success!',
        description: 'Question paper generated successfully',
      });
    } catch (error: any) {
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
            Configure and generate AI-powered question papers
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Paper Configuration</CardTitle>
                <CardDescription>
                  Select academic details and configure the paper
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Academic Selection */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={selectedYear} onValueChange={handleYearChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year.id} value={year.id.toString()}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={selectedSemester} onValueChange={handleSemesterChange} disabled={!selectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((sem) => (
                          <SelectItem key={sem.id} value={sem.id.toString()}>
                            {sem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={!selectedSemester}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id.toString()}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unit (Optional)</Label>
                    <Select value={selectedUnit} onValueChange={handleUnitChange} disabled={!selectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Topic (Optional)</Label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={!selectedUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id.toString()}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Engine</Label>
                    <Select value={aiEngine} onValueChange={setAiEngine}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT</SelectItem>
                        <SelectItem value="hybrid">Rule + ML Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <Label className="text-base font-semibold">Difficulty Distribution</Label>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Easy</span>
                        <span className="text-sm font-medium text-success">{difficulty.easy}%</span>
                      </div>
                      <Slider
                        value={[difficulty.easy]}
                        onValueChange={([value]) => handleDifficultyChange('easy', value)}
                        max={100}
                        step={5}
                        className="[&_[role=slider]]:bg-success"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Medium</span>
                        <span className="text-sm font-medium text-warning">{difficulty.medium}%</span>
                      </div>
                      <Slider
                        value={[difficulty.medium]}
                        onValueChange={([value]) => handleDifficultyChange('medium', value)}
                        max={100}
                        step={5}
                        className="[&_[role=slider]]:bg-warning"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Hard</span>
                        <span className="text-sm font-medium text-destructive">{difficulty.hard}%</span>
                      </div>
                      <Slider
                        value={[difficulty.hard]}
                        onValueChange={([value]) => handleDifficultyChange('hard', value)}
                        max={100}
                        step={5}
                        className="[&_[role=slider]]:bg-destructive"
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedSubject}
                  className="w-full shadow-glow"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Question Paper
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Generated Paper</CardTitle>
                <CardDescription>
                  View and download your generated paper
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedPaperId ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg bg-success/10 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Paper ID</p>
                      <p className="text-3xl font-bold text-success">#{generatedPaperId}</p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => navigate(`/paper/${generatedPaperId}`)}
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Questions
                      </Button>
                      <Button
                        onClick={handleDownload}
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure the options and click generate to create a new question paper.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
