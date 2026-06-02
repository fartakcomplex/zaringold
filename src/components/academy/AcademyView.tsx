'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Star,
  Award,
  CheckCircle,
  XCircle,
  Lock,
  Play,
  Clock,
  Zap,
  Flame,
  ChevronLeft,
  Brain,
  Shield,
  Target,
  BarChart3,
  Gift,
  Medal,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Data                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  totalLessons: number;
  completedLessons: number;
  xpReward: number;
  isCompleted: boolean;
  hasCertificate: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: React.ElementType;
  iconColor: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  xpReward: number;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  count: number;
}

const CATEGORIES: Category[] = [
  { id: 'basics', name: 'مبانی طلا', icon: Shield, color: '#D4AF37', count: 8 },
  { id: 'trading', name: 'معاملات طلا', icon: BarChart3, color: '#34D399', count: 12 },
  { id: 'investment', name: 'سرمایه‌گذاری', icon: Target, color: '#60A5FA', count: 10 },
  { id: 'analysis', name: 'تحلیل بازار', icon: Brain, color: '#F472B6', count: 6 },
  { id: 'security', name: 'امنیت', icon: Lock, color: '#FB923C', count: 5 },
  { id: 'advanced', name: 'پیشرفته', icon: Crown, color: '#A78BFA', count: 4 },
];

const COURSES_DATA: Course[] = [
  {
    id: 'c1',
    title: 'مبانی سرمایه‌گذاری در طلا',
    description: 'آشنایی با بازار طلا و اصول اولیه سرمایه‌گذاری',
    category: 'basics',
    totalLessons: 8,
    completedLessons: 8,
    xpReward: 500,
    isCompleted: true,
    hasCertificate: true,
    difficulty: 'beginner',
    icon: Shield,
    iconColor: '#D4AF37',
  },
  {
    id: 'c2',
    title: 'خرید و فروش آنلاین طلا',
    description: 'نحوه خرید و فروش طلا در پلتفرم زرین گلد',
    category: 'trading',
    totalLessons: 12,
    completedLessons: 7,
    xpReward: 800,
    isCompleted: false,
    hasCertificate: false,
    difficulty: 'beginner',
    icon: BarChart3,
    iconColor: '#34D399',
  },
  {
    id: 'c3',
    title: 'تحلیل فنی بازار طلا',
    description: 'آموزش تحلیل تکنیکال برای معاملات طلا',
    category: 'analysis',
    totalLessons: 6,
    completedLessons: 0,
    xpReward: 600,
    isCompleted: false,
    hasCertificate: false,
    difficulty: 'intermediate',
    icon: Brain,
    iconColor: '#F472B6',
  },
  {
    id: 'c4',
    title: 'مدیریت پرتفوی طلایی',
    description: 'اصول مدیریت سبد سرمایه‌گذاری طلا',
    category: 'investment',
    totalLessons: 10,
    completedLessons: 3,
    xpReward: 700,
    isCompleted: false,
    hasCertificate: false,
    difficulty: 'intermediate',
    icon: Target,
    iconColor: '#60A5FA',
  },
  {
    id: 'c5',
    title: 'امنیت حساب و احراز هویت',
    description: 'محافظت از حساب کاربری و دارایی‌ها',
    category: 'security',
    totalLessons: 5,
    completedLessons: 5,
    xpReward: 400,
    isCompleted: true,
    hasCertificate: true,
    difficulty: 'beginner',
    icon: Lock,
    iconColor: '#FB923C',
  },
];

const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'کدام عامل بیشترین تأثیر را بر قیمت جهانی طلا دارد؟',
    options: ['نرخ بهره فدرال رزرو آمریکا', 'قیمت نفت', 'نرخ دلار در بازار ایران', 'قیمت مس'],
    correctIndex: 0,
    xpReward: 50,
  },
  {
    id: 'q2',
    question: 'عیار طلای سکه بهار آزادی چقدر است؟',
    options: ['۱۸ عیار', '۲۱ عیار', '۲۴ عیار', '۱۴ عیار'],
    correctIndex: 1,
    xpReward: 50,
  },
  {
    id: 'q3',
    question: 'بهترین زمان خرید طلا از نظر تاریخی کدام فصل است؟',
    options: ['بهار', 'تابستان', 'پاییز', 'زمستان'],
    correctIndex: 1,
    xpReward: 50,
  },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'مبتدی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main AcademyView Component                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AcademyView() {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [activeTab, setActiveTab] = useState<'courses' | 'quiz'>('courses');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(2400);
  const [level, setLevel] = useState(5);
  const [courses, setCourses] = useState<Course[]>(COURSES_DATA);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [showResult, setShowResult] = useState(false);

  /* ── Filtered courses ── */
  const filteredCourses = selectedCategory
    ? courses.filter((c) => c.category === selectedCategory)
    : courses;

  /* ── Quiz handlers ── */
  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
    setEarnedXP(0);
    setShowResult(false);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === QUIZ_DATA[currentQ].correctIndex) {
      setQuizScore((s) => s + 1);
      setEarnedXP((xp) => xp + QUIZ_DATA[currentQ].xpReward);
    }
  };

  const nextQuestion = () => {
    if (currentQ < QUIZ_DATA.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
      setTotalXP((xp) => xp + earnedXP);
      addToast(`آفرین! ${formatNumber(earnedXP)} XP کسب کردید`, 'success');
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
    setEarnedXP(0);
    setShowResult(false);
  };

  /* ── XP to next level ── */
  const xpForNextLevel = level * 600;
  const xpProgress = (totalXP % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <GraduationCap className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">آکادمی طلا</h1>
          <p className="text-xs text-muted-foreground">یاد بگیرید، آزمون بدهید، پاداش بگیرید</p>
        </div>
      </div>

      {/* XP Stats Bar */}
      <Card className="overflow-hidden border-[#D4AF37]/30 bg-gradient-to-l from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-foreground">سطح {formatNumber(level)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="size-3.5 text-orange-500" />
              <span className="text-sm font-black tabular-nums text-[#D4AF37]">
                {formatNumber(totalXP)} XP
              </span>
            </div>
          </div>
          <Progress value={xpProgress} className="h-2 bg-border [&>div]:bg-[#D4AF37]" />
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {formatNumber(xpForNextLevel - (totalXP % xpForNextLevel))} XP تا سطح بعدی
          </p>
        </CardContent>
      </Card>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'courses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('courses')}
          className={cn(
            'flex-1 gap-1.5 text-xs',
            activeTab === 'courses'
              ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]'
              : 'border-border text-muted-foreground',
          )}
        >
          <BookOpen className="size-3.5" />
          دوره‌ها
        </Button>
        <Button
          variant={activeTab === 'quiz' ? 'default' : 'outline'}
          onClick={() => setActiveTab('quiz')}
          className={cn(
            'flex-1 gap-1.5 text-xs',
            activeTab === 'quiz'
              ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]'
              : 'border-border text-muted-foreground',
          )}
        >
          <Brain className="size-3.5" />
          آزمون
        </Button>
      </div>

      {/* ═══ COURSES TAB ═══ */}
      {activeTab === 'courses' && (
        <>
          {/* Categories */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all',
                selectedCategory === null
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                  : 'border-border bg-background hover:border-[#D4AF37]/30',
              )}
            >
              <BookOpen className={cn('size-4', selectedCategory === null ? 'text-[#D4AF37]' : 'text-muted-foreground')} />
              <span className={cn('text-[10px] font-semibold', selectedCategory === null ? 'text-[#D4AF37]' : 'text-muted-foreground')}>
                همه
              </span>
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all',
                    selectedCategory === cat.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-border bg-background hover:border-[#D4AF37]/30',
                  )}
                >
                  <Icon className="size-4" style={{ color: selectedCategory === cat.id ? '#D4AF37' : undefined }} />
                  <span className={cn('text-[10px] font-semibold', selectedCategory === cat.id ? 'text-[#D4AF37]' : 'text-muted-foreground')}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Course Cards */}
          <div className="space-y-3">
            {filteredCourses.map((course) => {
              const Icon = course.icon;
              const progress = (course.completedLessons / course.totalLessons) * 100;

              return (
                <Card key={course.id} className="overflow-hidden border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${course.iconColor}15` }}
                      >
                        <Icon className="size-5" style={{ color: course.iconColor }} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-bold text-foreground">{course.title}</h3>
                          {course.hasCertificate && (
                            <Badge className="shrink-0 gap-1 bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30">
                              <Award className="size-3" />
                              گواهی
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{course.description}</p>

                        {/* Progress */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">
                              {formatNumber(course.completedLessons)} / {formatNumber(course.totalLessons)} درس
                            </span>
                            <span className="font-bold tabular-nums" style={{ color: course.iconColor }}>
                              {formatNumber(Math.round(progress))}٪
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-1.5 bg-border"
                            style={{ ['--progress-color' as string]: course.iconColor }}
                          />
                        </div>

                        {/* Footer */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {DIFFICULTY_LABELS[course.difficulty]}
                            </Badge>
                            <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                              <Zap className="size-2.5 text-[#D4AF37]" />
                              {formatNumber(course.xpReward)} XP
                            </Badge>
                          </div>

                          {course.isCompleted ? (
                            <Button size="sm" variant="ghost" className="gap-1 text-emerald-500 text-[10px]">
                              <CheckCircle className="size-3.5" />
                              تکمیل شده
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="gap-1 bg-[#D4AF37] text-[#1a1a1a] text-[10px] hover:bg-[#E5C249]"
                            >
                              <Play className="size-3" />
                              ادامه
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="size-10 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">دوره‌ای یافت نشد</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ QUIZ TAB ═══ */}
      {activeTab === 'quiz' && (
        <>
          {!quizStarted ? (
            /* Quiz Intro */
            <Card className="overflow-hidden border-border">
              <CardContent className="flex flex-col items-center py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
                  <Brain className="size-8 text-[#D4AF37]" />
                </div>
                <h2 className="mt-4 text-base font-bold text-foreground">آزمون طلا</h2>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  دانش خود را درباره بازار طلا بسنجید و XP کسب کنید!
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="size-3.5" />
                    <span>{QUIZ_DATA.length} سؤال</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    <Zap className="size-3.5" />
                    <span className="font-bold">{formatNumber(QUIZ_DATA.reduce((a, q) => a + q.xpReward, 0))} XP</span>
                  </div>
                </div>
                <Button
                  onClick={startQuiz}
                  className="mt-5 gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
                >
                  <Play className="size-4" />
                  شروع آزمون
                </Button>
              </CardContent>
            </Card>
          ) : quizDone ? (
            /* Quiz Results */
            <Card className="overflow-hidden border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 to-transparent">
              <CardContent className="flex flex-col items-center py-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#D4AF37]/20">
                  <Trophy className="size-8 text-[#D4AF37]" />
                </div>
                <h2 className="mt-4 text-base font-bold text-foreground">آزمون تمام شد!</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  {quizScore === QUIZ_DATA.length ? 'عالی! همه سؤالات را درست پاسخ دادید 🎉' :
                   quizScore >= QUIZ_DATA.length / 2 ? 'خوب بود! ادامه دهید 💪' :
                   'تلاش بیشتر، دوباره تلاش کنید!'}
                </p>
                <div className="mt-4 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-black tabular-nums text-[#D4AF37]">
                      {formatNumber(quizScore)}/{formatNumber(QUIZ_DATA.length)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">پاسخ درست</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-black tabular-nums text-orange-500">
                      +{formatNumber(earnedXP)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">XP کسب شده</p>
                  </div>
                </div>

                {quizScore === QUIZ_DATA.length && (
                  <Badge className="mt-4 gap-1 bg-[#D4AF37]/20 text-[#D4AF37]">
                    <Medal className="size-3.5" />
                    نشان طلایی آزمون
                  </Badge>
                )}

                <div className="mt-5 flex gap-2">
                  <Button
                    onClick={resetQuiz}
                    variant="outline"
                    className="border-border"
                  >
                    <Play className="ml-1 size-3.5" />
                    آزمون مجدد
                  </Button>
                  <Button
                    onClick={() => setActiveTab('courses')}
                    className="bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
                  >
                    مشاهده دوره‌ها
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Active Quiz */
            <Card className="overflow-hidden border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37]">
                  سؤال {formatNumber(currentQ + 1)} از {formatNumber(QUIZ_DATA.length)}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Zap className="size-2.5 text-[#D4AF37]" />
                  {formatNumber(earnedXP)} XP
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-bold leading-relaxed text-foreground">
                  {QUIZ_DATA[currentQ].question}
                </p>
                <div className="space-y-2">
                  {QUIZ_DATA[currentQ].options.map((option, idx) => {
                    const isCorrect = idx === QUIZ_DATA[currentQ].correctIndex;
                    const isSelected = idx === selectedAnswer;

                    let optionClass = 'border-border bg-background hover:border-[#D4AF37]/40 text-foreground';
                    if (showResult && isCorrect) {
                      optionClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
                    } else if (showResult && isSelected && !isCorrect) {
                      optionClass = 'border-red-500 bg-red-500/10 text-red-600';
                    } else if (isSelected && !showResult) {
                      optionClass = 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedAnswer !== null}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all',
                          optionClass,
                          selectedAnswer !== null && 'cursor-default',
                        )}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-muted-foreground">
                          {formatNumber(idx + 1)}
                        </span>
                        <span className="flex-1 text-start text-xs font-medium">{option}</span>
                        {showResult && isCorrect && <CheckCircle className="size-4 text-emerald-500" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="size-4 text-red-500" />}
                      </button>
                    );
                  })}
                </div>

                {showResult && (
                  <Button
                    onClick={nextQuestion}
                    className="w-full gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]"
                  >
                    {currentQ < QUIZ_DATA.length - 1 ? (
                      <>
                        سؤال بعدی
                        <ChevronLeft className="size-3.5" />
                      </>
                    ) : (
                      <>
                        <Trophy className="size-3.5" />
                        مشاهده نتیجه
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
