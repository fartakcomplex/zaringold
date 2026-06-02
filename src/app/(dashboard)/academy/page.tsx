'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, BookOpen, Trophy, Award, CheckCircle, XCircle, Lock, Play, Clock, Zap, Flame,
  ChevronLeft, Brain, Shield, Target, BarChart3, Crown, Star, Video, FileText, Users, Timer,
  BadgeCheck, Sparkles, TrendingUp, Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Data                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz';
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalLessons: number;
  completedLessons: number;
  duration: string;
  xpReward: number;
  isCompleted: boolean;
  hasCertificate: boolean;
  isFeatured: boolean;
  lessons: Lesson[];
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  quiz: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  xpReward: number;
  explanation: string;
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  beginner: { label: 'مبتدی', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  intermediate: { label: 'متوسط', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  advanced: { label: 'پیشرفته', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800' },
};

const COURSES_DATA: Course[] = [
  {
    id: 'c1', title: 'آشنایی با بازار طلا', description: 'با ساختار بازار طلا، عوامل تأثیرگذار بر قیمت و اصول اولیه سرمایه‌گذاری در طلا آشنا شوید.',
    difficulty: 'beginner', totalLessons: 8, completedLessons: 5, duration: '۳ ساعت', xpReward: 500,
    isCompleted: false, hasCertificate: false, isFeatured: true, icon: '📊',
    gradientFrom: '#D4AF37', gradientTo: '#F5D76E',
    lessons: [
      { id: 'l1', title: 'ساختار بازار جهانی طلا', type: 'video', duration: 1200, isCompleted: true, isLocked: false },
      { id: 'l2', title: 'عوامل تأثیرگذار بر قیمت', type: 'video', duration: 1500, isCompleted: true, isLocked: false },
      { id: 'l3', title: 'عیار و واحدهای اندازه‌گیری طلا', type: 'article', duration: 900, isCompleted: true, isLocked: false },
      { id: 'l4', title: 'انواع سرمایه‌گذاری در طلا', type: 'video', duration: 1800, isCompleted: true, isLocked: false },
      { id: 'l5', title: 'مزایا و معایب طلا', type: 'article', duration: 600, isCompleted: true, isLocked: false },
      { id: 'l6', title: 'نکات طلایی خرید طلا', type: 'video', duration: 1200, isCompleted: false, isLocked: false },
      { id: 'l7', title: 'آزمون: مبانی بازار طلا', type: 'quiz', duration: 300, isCompleted: false, isLocked: false },
      { id: 'l8', title: 'پروژه عملی: بررسی سبد طلایی', type: 'article', duration: 900, isCompleted: false, isLocked: false },
    ],
    quiz: [
      { id: 'q1', question: 'کدام عامل بیشترین تأثیر را بر قیمت جهانی طلا دارد؟', options: ['نرخ بهره فدرال رزرو آمریکا', 'قیمت نفت', 'نرخ دلار در بازار ایران', 'قیمت مس'], correctIndex: 0, xpReward: 50, explanation: 'نرخ بهره آمریکا مهم‌ترین عامل تعیین‌کننده قیمت طلاست.' },
      { id: 'q2', question: 'عیار طلای سکه بهار آزادی چقدر است؟', options: ['۱۸ عیار', '۲۱ عیار', '۲۴ عیار', '۱۴ عیار'], correctIndex: 1, xpReward: 50, explanation: 'سکه بهار آزادی از طلای ۲۱ عیار ساخته شده است.' },
      { id: 'q3', question: 'بهترین زمان خرید طلا از نظر تاریخی کدام فصل است؟', options: ['بهار', 'تابستان', 'پاییز', 'زمستان'], correctIndex: 1, xpReward: 50, explanation: 'تابستان به دلیل کاهش تقاضای جهانی جواهرات، معمولاً قیمت پایین‌تری دارد.' },
    ],
  },
  {
    id: 'c2', title: 'تحلیل فنی طلای جهانی', description: 'یادگیری تحلیل تکنیکال شامل اندیکاتورها، الگوهای شمعی و خطوط روند برای معاملات طلا.',
    difficulty: 'advanced', totalLessons: 10, completedLessons: 0, duration: '۵ ساعت', xpReward: 800,
    isCompleted: false, hasCertificate: false, isFeatured: true, icon: '📈',
    gradientFrom: '#8B5CF6', gradientTo: '#C084FC',
    lessons: [
      { id: 'l11', title: 'مقدمه تحلیل تکنیکال', type: 'video', duration: 1800, isCompleted: false, isLocked: false },
      { id: 'l12', title: 'کندل‌ستیک‌ها و الگوها', type: 'video', duration: 2400, isCompleted: false, isLocked: false },
      { id: 'l13', title: 'اندیکاتور RSI', type: 'video', duration: 1500, isCompleted: false, isLocked: true },
      { id: 'l14', title: 'اندیکاتور MACD', type: 'video', duration: 2100, isCompleted: false, isLocked: true },
      { id: 'l15', title: 'باندهای بولینگر', type: 'video', duration: 1800, isCompleted: false, isLocked: true },
      { id: 'l16', title: 'خطوط روند و حمایت/مقاومت', type: 'video', duration: 1500, isCompleted: false, isLocked: true },
      { id: 'l17', title: 'الگوهای کلاسیک قیمت', type: 'article', duration: 1200, isCompleted: false, isLocked: true },
      { id: 'l18', title: 'فیبوناچی در بازار طلا', type: 'video', duration: 1800, isCompleted: false, isLocked: true },
      { id: 'l19', title: 'حجم معاملات و تأثیر آن', type: 'video', duration: 1200, isCompleted: false, isLocked: true },
      { id: 'l20', title: 'آزمون نهایی تحلیل فنی', type: 'quiz', duration: 600, isCompleted: false, isLocked: true },
    ],
    quiz: [
      { id: 'q4', question: 'RSI بالای ۷۰ نشان‌دهنده چیست؟', options: ['اشباع خرید', 'اشباع فروش', 'روند صعودی', 'روند نزولی'], correctIndex: 0, xpReward: 50, explanation: 'RSI بالای ۷۰ نشان‌دهنده اشباع خرید است.' },
      { id: 'q5', question: 'کدام اندیکاتور بر اساس میانگین متحرک است؟', options: ['RSI', 'MACD', 'بولینگر', 'تمام موارد'], correctIndex: 1, xpReward: 50, explanation: 'MACD بر اساس میانگین‌های متحرک ۱۲ و ۲۶ روزه است.' },
    ],
  },
  {
    id: 'c3', title: 'مدیریت ریسک در سرمایه‌گذاری', description: 'یادگیری استراتژی‌های مدیریت ریسک، تعیین حد ضرر و تنوع‌بخشی سبد سرمایه‌گذاری.',
    difficulty: 'intermediate', totalLessons: 6, completedLessons: 3, duration: '۲ ساعت', xpReward: 600,
    isCompleted: false, hasCertificate: false, isFeatured: false, icon: '🛡️',
    gradientFrom: '#F97316', gradientTo: '#FB923C',
    lessons: [
      { id: 'l21', title: 'مفاهیم پایه ریسک', type: 'video', duration: 1200, isCompleted: true, isLocked: false },
      { id: 'l22', title: 'نسبت ریسک به پاداش', type: 'video', duration: 1500, isCompleted: true, isLocked: false },
      { id: 'l23', title: 'تنظیم حد ضرر', type: 'video', duration: 1800, isCompleted: true, isLocked: false },
      { id: 'l24', title: 'حد سود و مدیریت معامله', type: 'video', duration: 1500, isCompleted: false, isLocked: false },
      { id: 'l25', title: 'تنوع‌بخشی سبد', type: 'article', duration: 900, isCompleted: false, isLocked: false },
      { id: 'l26', title: 'آزمون مدیریت ریسک', type: 'quiz', duration: 300, isCompleted: false, isLocked: false },
    ],
    quiz: [
      { id: 'q6', question: 'نسبت ریسک به پاداش ایده‌آل چقدر است؟', options: ['۱:۱', '۱:۲', '۱:۵', '۱:۱۰'], correctIndex: 1, xpReward: 50, explanation: 'نسبت ریسک به پاداش ۱:۲ یعنی سود دو برابر ریسک باشد.' },
    ],
  },
  {
    id: 'c4', title: 'ساخت سبد طلایی', description: 'چگونه یک سبد سرمایه‌گذاری طلایی متنوع و متوازن بسازید و مدیریت کنید.',
    difficulty: 'intermediate', totalLessons: 7, completedLessons: 7, duration: '۲.۵ ساعت', xpReward: 700,
    isCompleted: true, hasCertificate: true, isFeatured: true, icon: '💰',
    gradientFrom: '#10B981', gradientTo: '#34D399',
    lessons: [
      { id: 'l31', title: 'اصول سبد‌سازی', type: 'video', duration: 1500, isCompleted: true, isLocked: false },
      { id: 'l32', title: 'تناسب طلای فیزیکی و دیجیتال', type: 'article', duration: 900, isCompleted: true, isLocked: false },
      { id: 'l33', title: 'سرمایه‌گذاری در سکه', type: 'video', duration: 1800, isCompleted: true, isLocked: false },
      { id: 'l34', title: 'خرید خرد طلای آب‌شده', type: 'video', duration: 1200, isCompleted: true, isLocked: false },
      { id: 'l35', title: 'صندوق‌های طلایی', type: 'article', duration: 600, isCompleted: true, isLocked: false },
      { id: 'l36', title: 'میزان تخصیص طلا در سبد', type: 'video', duration: 1500, isCompleted: true, isLocked: false },
      { id: 'l37', title: 'آزمون سبد طلایی', type: 'quiz', duration: 300, isCompleted: true, isLocked: false },
    ],
    quiz: [
      { id: 'q7', question: 'چند درصد از سبد سرمایه‌گذاری باید به طلا اختصاص یابد؟', options: ['۵-۱۰٪', '۱۰-۲۰٪', '۵۰٪', '۸۰٪'], correctIndex: 1, xpReward: 50, explanation: 'معمولاً ۱۰-۲۰٪ سبد به طلا اختصاص می‌یابد.' },
    ],
  },
  {
    id: 'c5', title: 'اقتصاد کلان و تأثیر بر طلا', description: 'شناخت رابطه اقتصاد کلان با قیمت طلا شامل نرخ بهره، تورم، دلار و جی‌دی‌پی.',
    difficulty: 'advanced', totalLessons: 8, completedLessons: 0, duration: '۴ ساعت', xpReward: 900,
    isCompleted: false, hasCertificate: false, isFeatured: false, icon: '🌐',
    gradientFrom: '#0EA5E9', gradientTo: '#38BDF8',
    lessons: [
      { id: 'l41', title: 'نرخ بهره و طلا', type: 'video', duration: 1800, isCompleted: false, isLocked: false },
      { id: 'l42', title: 'تورم و طلای پناهگاه امن', type: 'video', duration: 1500, isCompleted: false, isLocked: false },
      { id: 'l43', title: 'قوی/ضعیف شدن دلار', type: 'article', duration: 900, isCompleted: false, isLocked: true },
      { id: 'l44', title: 'جلسات FOMC', type: 'video', duration: 2100, isCompleted: false, isLocked: true },
      { id: 'l45', title: 'تأثیر ژئوپلیتیک بر طلا', type: 'video', duration: 1500, isCompleted: false, isLocked: true },
      { id: 'l46', title: 'GDP و اشتغال آمریکا', type: 'article', duration: 1200, isCompleted: false, isLocked: true },
      { id: 'l47', title: 'ذخایر طلای بانک‌های مرکزی', type: 'video', duration: 1800, isCompleted: false, isLocked: true },
      { id: 'l48', title: 'آزمون اقتصاد کلان', type: 'quiz', duration: 450, isCompleted: false, isLocked: true },
    ],
    quiz: [
      { id: 'q8', question: 'افزایش نرخ بهره فدرال رزرو معمولاً چه تأثیری بر طلا دارد؟', options: ['افزایش قیمت', 'کاهش قیمت', 'بدون تأثیر', 'افزایش شدید'], correctIndex: 1, xpReward: 50, explanation: 'افزایش نرخ بهره هزینه فرصت نگهداری طلا را بالا می‌برد.' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Video Thumbnail SVG                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VideoThumbnail({ color, icon }: { color: string; icon: string }) {
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-t-xl" style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)` }}>
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 40%, ${color}40, transparent 60%)` }} />
      <span className="text-5xl opacity-60">{icon}</span>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
          <Play className="size-5 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Certificate Badge SVG                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CertificateBadge({ earned }: { earned: boolean }) {
  if (!earned) return null;
  return (
    <Badge className="gap-1 bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 border-[#D4AF37]/30 text-[10px]">
      <BadgeCheck className="size-3" />
      گواهی کسب‌شده
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GoldAcademyPage() {
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'featured'>('courses');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>(COURSES_DATA);
  const [totalXP, setTotalXP] = useState(1800);

  // Quiz state
  const [quizCourseId, setQuizCourseId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    if (selectedDifficulty) {
      filtered = filtered.filter((c) => c.difficulty === selectedDifficulty);
    }
    return filtered;
  }, [courses, selectedDifficulty]);

  const featuredCourses = courses.filter((c) => c.isFeatured);
  const completedCourses = courses.filter((c) => c.isCompleted);
  const activeQuiz = quizCourseId ? courses.find((c) => c.id === quizCourseId) : null;

  const handleStartQuiz = (courseId: string) => {
    setQuizCourseId(courseId);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
    setQuizDone(false);
    setEarnedXP(0);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !activeQuiz) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === activeQuiz.quiz[currentQ].correctIndex) {
      setQuizScore((s) => s + 1);
      setEarnedXP((xp) => xp + activeQuiz.quiz[currentQ].xpReward);
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQ < activeQuiz.quiz.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
      setTotalXP((xp) => xp + earnedXP);
      addToast(`آفرین! ${formatNumber(earnedXP)} XP کسب کردید 🎉`, 'success');
    }
  };

  const closeQuiz = () => {
    setQuizCourseId(null);
    setSelectedCourse(null);
  };

  const handleCompleteLesson = (courseId: string, lessonId: string) => {
    setCourses((prev) => prev.map((c) => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lessons: c.lessons.map((l) => l.id === lessonId ? { ...l, isCompleted: true } : l),
        completedLessons: c.lessons.some((l) => l.id === lessonId && !l.isCompleted) ? c.completedLessons + 1 : c.completedLessons,
      };
    }));
    addToast('درس تکمیل شد! +۲۰ XP', 'success');
    setTotalXP((xp) => xp + 20);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <GraduationCap className="size-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">آکادمی سرمایه‌گذاری طلا</h1>
          <p className="text-xs text-muted-foreground">یاد بگیرید، آزمون بدهید، گواهی بگیرید</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#D4AF37]/10 px-3 py-1.5">
          <Zap className="size-3.5 text-[#D4AF37]" />
          <span className="text-xs font-bold tabular-nums text-[#D4AF37]">{formatNumber(totalXP)}</span>
          <span className="text-[10px] text-muted-foreground">XP</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-black tabular-nums text-[#D4AF37]">{formatNumber(completedCourses.length)}</p>
            <p className="text-[10px] text-muted-foreground">دوره تکمیل‌شده</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-black tabular-nums text-emerald-500">{formatNumber(courses.reduce((s, c) => s + c.completedLessons, 0))}</p>
            <p className="text-[10px] text-muted-foreground">درس تکمیل‌شده</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-black tabular-nums text-amber-500">{formatNumber(courses.filter((c) => c.hasCertificate).length)}</p>
            <p className="text-[10px] text-muted-foreground">گواهی کسب‌شده</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <Button variant={activeTab === 'courses' ? 'default' : 'outline'} onClick={() => { setActiveTab('courses'); setSelectedCourse(null); }} className={cn('flex-1 gap-1.5 text-xs', activeTab === 'courses' ? 'bg-[#D4AF37] text-[#1a1a1a]' : '')}>
          <BookOpen className="size-3.5" />
          همه دوره‌ها
        </Button>
        <Button variant={activeTab === 'featured' ? 'default' : 'outline'} onClick={() => { setActiveTab('featured'); setSelectedCourse(null); }} className={cn('flex-1 gap-1.5 text-xs', activeTab === 'featured' ? 'bg-[#D4AF37] text-[#1a1a1a]' : '')}>
          <Sparkles className="size-3.5" />
          پیشنهاد ویژه
        </Button>
      </div>

      {/* ═══ QUIZ OVERLAY ═══ */}
      {activeQuiz && !quizDone ? (
        <Card className="overflow-hidden border-[#D4AF37]/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-[#D4AF37]" />
              <CardTitle className="text-sm font-bold">آزمون: {activeQuiz.title}</CardTitle>
            </div>
            <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-[10px]">
              سؤال {formatNumber(currentQ + 1)} از {formatNumber(activeQuiz.quiz.length)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-bold leading-relaxed text-foreground">{activeQuiz.quiz[currentQ].question}</p>
            <div className="space-y-2">
              {activeQuiz.quiz[currentQ].options.map((option, idx) => {
                const isCorrect = idx === activeQuiz.quiz[currentQ].correctIndex;
                const isSelected = idx === selectedAnswer;
                let cls = 'border-border bg-background hover:border-[#D4AF37]/40 text-foreground';
                if (showResult && isCorrect) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-700';
                else if (showResult && isSelected && !isCorrect) cls = 'border-red-500 bg-red-500/10 text-red-700';
                else if (isSelected && !showResult) cls = 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]';
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedAnswer !== null} className={cn('flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all', cls, selectedAnswer !== null && 'cursor-default')}>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-muted-foreground">{formatNumber(idx + 1)}</span>
                    <span className="flex-1 text-start text-xs font-medium">{option}</span>
                    {showResult && isCorrect && <CheckCircle className="size-4 text-emerald-500" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="size-4 text-red-500" />}
                  </button>
                );
              })}
            </div>
            {showResult && (
              <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                <p className="text-[11px] text-muted-foreground">{activeQuiz.quiz[currentQ].explanation}</p>
              </div>
            )}
            {showResult && (
              <Button onClick={handleNextQuestion} className="w-full gap-1.5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">
                {currentQ < activeQuiz.quiz.length - 1 ? <>سؤال بعدی <ChevronLeft className="size-3.5" /></> : <><Trophy className="size-3.5" /> مشاهده نتیجه</>}
              </Button>
            )}
            <Button variant="ghost" onClick={closeQuiz} className="w-full text-xs text-muted-foreground">انصراف</Button>
          </CardContent>
        </Card>
      ) : activeQuiz && quizDone ? (
        <Card className="overflow-hidden border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 to-transparent">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#D4AF37]/20"><Trophy className="size-8 text-[#D4AF37]" /></div>
            <h2 className="mt-4 text-base font-bold text-foreground">آزمون تمام شد!</h2>
            <p className="mt-1 text-xs text-muted-foreground">{quizScore === activeQuiz.quiz.length ? 'عالی! همه سؤالات درست 🎉' : quizScore >= activeQuiz.quiz.length / 2 ? 'خوب بود! ادامه دهید 💪' : 'تلاش بیشتر، دوباره تلاش کنید!'}</p>
            <div className="mt-4 flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black tabular-nums text-[#D4AF37]">{formatNumber(quizScore)}/{formatNumber(activeQuiz.quiz.length)}</p>
                <p className="text-[10px] text-muted-foreground">پاسخ درست</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-black tabular-nums text-orange-500">+{formatNumber(earnedXP)}</p>
                <p className="text-[10px] text-muted-foreground">XP کسب‌شده</p>
              </div>
            </div>
            {quizScore === activeQuiz.quiz.length && <Badge className="mt-4 gap-1 bg-[#D4AF37]/20 text-[#D4AF37]"><Medal className="size-3.5" />نشان طلایی آزمون</Badge>}
            <Button onClick={closeQuiz} className="mt-5 bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C249]">بازگشت به دوره‌ها</Button>
          </CardContent>
        </Card>
      ) : selectedCourse ? (
        /* ═══ COURSE DETAIL ═══ */
        <div className="space-y-3">
          <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="gap-1 text-xs text-muted-foreground"><ChevronLeft className="size-3" /> بازگشت</Button>
          <Card className="overflow-hidden">
            <VideoThumbnail color={selectedCourse.gradientFrom} icon={selectedCourse.icon} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-base font-bold text-foreground">{selectedCourse.title}</h2>
                <CertificateBadge earned={selectedCourse.hasCertificate} />
              </div>
              <p className="text-xs text-muted-foreground mb-3">{selectedCourse.description}</p>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={cn('text-[10px] border', DIFFICULTY_CONFIG[selectedCourse.difficulty].bg, DIFFICULTY_CONFIG[selectedCourse.difficulty].color)}>{DIFFICULTY_CONFIG[selectedCourse.difficulty].label}</Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]"><Video className="size-2.5" /> {selectedCourse.totalLessons} درس</Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]"><Clock className="size-2.5" /> {selectedCourse.duration}</Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]"><Zap className="size-2.5 text-[#D4AF37]" /> {formatNumber(selectedCourse.xpReward)} XP</Badge>
              </div>
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">پیشرفت دوره</span>
                  <span className="font-bold tabular-nums" style={{ color: selectedCourse.gradientFrom }}>{Math.round((selectedCourse.completedLessons / selectedCourse.totalLessons) * 100)}٪</span>
                </div>
                <Progress value={(selectedCourse.completedLessons / selectedCourse.totalLessons) * 100} className="h-2 bg-border" />
              </div>
              {/* Lessons List */}
              <div className="space-y-2">
                {selectedCourse.lessons.map((lesson, idx) => {
                  const isQuiz = lesson.type === 'quiz';
                  return (
                    <div key={lesson.id} className={cn('flex items-center gap-3 rounded-xl border p-3 transition-all', lesson.isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : lesson.isLocked ? 'border-border/50 bg-muted/30 opacity-60' : 'border-border bg-background hover:border-[#D4AF37]/30')}>
                      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold', lesson.isCompleted ? 'bg-emerald-500/20 text-emerald-500' : lesson.isLocked ? 'bg-muted text-muted-foreground' : 'bg-[#D4AF37]/10 text-[#D4AF37]')}>
                        {lesson.isCompleted ? <CheckCircle className="size-4" /> : lesson.isLocked ? <Lock className="size-4" /> : isQuiz ? <Brain className="size-4" /> : lesson.type === 'video' ? <Video className="size-4" /> : <FileText className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{lesson.title}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-2.5" />{formatNumber(Math.round(lesson.duration / 60))} دقیقه</p>
                      </div>
                      {isQuiz && !lesson.isLocked && !lesson.isCompleted && (
                        <Button size="sm" onClick={() => handleStartQuiz(selectedCourse.id)} className="gap-1 bg-[#D4AF37] text-[#1a1a1a] text-[10px] hover:bg-[#E5C249]"><Brain className="size-3" /> شروع آزمون</Button>
                      )}
                      {!lesson.isCompleted && !lesson.isLocked && !isQuiz && (
                        <Button size="sm" onClick={() => handleCompleteLesson(selectedCourse.id, lesson.id)} className="gap-1 bg-[#D4AF37] text-[#1a1a1a] text-[10px] hover:bg-[#E5C249]"><Play className="size-3" /> شروع</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Difficulty Filter */}
          {activeTab === 'courses' && (
            <div className="flex gap-2">
              {[
                { id: null, label: 'همه', icon: BookOpen },
                { id: 'beginner', label: 'مبتدی', icon: Shield },
                { id: 'intermediate', label: 'متوسط', icon: BarChart3 },
                { id: 'advanced', label: 'پیشرفته', icon: Crown },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <button key={d.id || 'all'} onClick={() => setSelectedDifficulty(d.id)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 transition-all text-xs', selectedDifficulty === d.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-border bg-background hover:border-[#D4AF37]/30 text-muted-foreground')}>
                    <Icon className="size-3.5" />
                    <span className="font-medium">{d.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Featured Section */}
          {activeTab === 'featured' && (
            <Card className="overflow-hidden border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="size-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-bold text-foreground">دوره‌های پیشنهاد ویژه</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">دوره‌های منتخب تیم آکادمی زرین‌گلد برای شروع بهترین نقطه</p>
              </CardContent>
            </Card>
          )}

          {/* Course Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(activeTab === 'featured' ? featuredCourses : filteredCourses).map((course) => {
              const progress = (course.completedLessons / course.totalLessons) * 100;
              const diff = DIFFICULTY_CONFIG[course.difficulty];
              return (
                <Card key={course.id} className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-[#D4AF37]/30" onClick={() => setSelectedCourse(course)}>
                  <VideoThumbnail color={course.gradientFrom} icon={course.icon} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground truncate">{course.title}</h3>
                      {course.hasCertificate && <CertificateBadge earned={true} />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <Badge className={cn('text-[9px] border px-1.5 py-0', diff.bg, diff.color)}>{diff.label}</Badge>
                      <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0"><Video className="size-2" /> {course.totalLessons} درس</Badge>
                      <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0"><Clock className="size-2" /> {course.duration}</Badge>
                      <Badge variant="secondary" className="text-[9px] gap-0.5 px-1.5 py-0"><Zap className="size-2 text-[#D4AF37]" /> {course.xpReward} XP</Badge>
                    </div>
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">{formatNumber(course.completedLessons)} / {formatNumber(course.totalLessons)}</span>
                        <span className="font-bold tabular-nums" style={{ color: course.gradientFrom }}>{formatNumber(Math.round(progress))}٪</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-border" />
                    </div>
                    {course.isFeatured && activeTab !== 'featured' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-[#D4AF37]">
                        <Sparkles className="size-3" />
                        <span>پیشنهاد ویژه</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(activeTab === 'featured' ? featuredCourses : filteredCourses).length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <BookOpen className="size-10 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">دوره‌ای یافت نشد</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
