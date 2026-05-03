
import React, { useState, useEffect, useCallback } from 'react';
import {cn} from '@/lib/utils';
import {Package, Download, Trash2, Plus, Database, HardDrive, FolderTree, GitBranch, Clock, CheckCircle2, XCircle, Loader2, ArrowDownToLine, Upload, Shield, Server, FileArchive, RefreshCw, AlertTriangle, Info, Zap, Copy, Check, Eye, MonitorPlay} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExportPackage {
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  type: 'full' | 'code-only';
  includes: string[];
  status: 'completed' | 'failed';
}

interface SystemInfo {
  projectSize: string;
  projectSizeBytes: number;
  dbSize: string;
  dbSizeBytes: number;
  fileCount: number;
  nodeModulesSize: string;
  hasGit: boolean;
  gitBranch: string;
  lastCommit?: string;
  diskFree: string;
  diskFreeBytes: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toPersianNum(n: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, d => persianDigits[parseInt(d)]);
}

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'همین الان';
  if (minutes < 60) return toPersianNum(minutes) + ' دقیقه پیش';
  if (hours < 24) return toPersianNum(hours) + ' ساعت پیش';
  if (days < 7) return toPersianNum(days) + ' روز پیش';

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatDateFull(dateStr: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dateStr));
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminEasyInstaller() {
  const [packages, setPackages] = useState<ExportPackage[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  /* -------- Fetch Data -------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/easy-installer');
      const json = await res.json();
      if (json.success) {
        setPackages(json.data.packages || []);
        setSystemInfo(json.data.systemInfo || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------- Create Export -------- */
  const handleCreateExport = async (type: 'full' | 'code-only') => {
    try {
      setCreating(true);
      setProgress('در حال آماده‌سازی بسته نصب...');
      setError('');

      const res = await fetch('/api/admin/easy-installer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          includeDatabase: type === 'full',
          includeUploads: false,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setProgress('بسته با موفقیت ایجاد شد!');
        await fetchData();
        setTimeout(() => setProgress(''), 3000);
      } else {
        setError(json.error || 'خطا در ایجاد بسته');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد بسته');
    } finally {
      setCreating(false);
    }
  };

  /* -------- Download -------- */
  const handleDownload = (filename: string) => {
    window.open(`/api/admin/easy-installer/${encodeURIComponent(filename)}`, '_blank');
  };

  /* -------- Delete -------- */
  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/admin/easy-installer/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setPackages(prev => prev.filter(p => p.filename !== filename));
      }
    } catch {}
    setDeleteTarget(null);
  };

  /* -------- Copy filename -------- */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  /* -------- Cleanup old packages -------- */
  const handleCleanup = async () => {
    try {
      const res = await fetch('/api/admin/easy-installer?action=cleanup&maxAge=30', {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Title ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
            <Package className="size-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ایزی اینستالر</h1>
            <p className="text-xs text-muted-foreground">
              خروجی، بسته‌بندی و انتقال سایت به سرور جدید
            </p>
          </div>
        </div>
        <Badge className="bg-gold/15 text-gold border-gold/20 hover:bg-gold/20">
          نسخه ۱.۰.۰
        </Badge>
      </div>

      {/* ─── Stats Cards ─── */}
      {systemInfo && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Project Size */}
          <Card className="border-gold/10 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <FolderTree className="size-4 text-amber-500" />
                </div>
                <span className="text-[11px] text-muted-foreground">حجم پروژه</span>
              </div>
              <p className="text-lg font-bold text-foreground">{toPersianNum(systemInfo.projectSize)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {toPersianNum(systemInfo.fileCount)} فایل
              </p>
            </CardContent>
          </Card>

          {/* Database Size */}
          <Card className="border-gold/10 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Database className="size-4 text-emerald-500" />
                </div>
                <span className="text-[11px] text-muted-foreground">حجم دیتابیس</span>
              </div>
              <p className="text-lg font-bold text-foreground">{toPersianNum(systemInfo.dbSize)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">SQLite</p>
            </CardContent>
          </Card>

          {/* Disk Free */}
          <Card className="border-gold/10 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <HardDrive className="size-4 text-blue-500" />
                </div>
                <span className="text-[11px] text-muted-foreground">فضای آزاد دیسک</span>
              </div>
              <p className="text-lg font-bold text-foreground">{toPersianNum(systemInfo.diskFree)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">در دسترس</p>
            </CardContent>
          </Card>

          {/* Git Info */}
          <Card className="border-gold/10 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <GitBranch className="size-4 text-purple-500" />
                </div>
                <span className="text-[11px] text-muted-foreground">وضعیت گیت</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {systemInfo.hasGit ? systemInfo.gitBranch || 'master' : 'بدون گیت'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {systemInfo.lastCommit || '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Create New Export ─── */}
      <Card className="border-gold/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gold/10">
              <Plus className="size-4 text-gold" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">ایجاد بسته نصب جدید</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                یک بسته نصب کامل ایجاد کنید و روی سرور جدید مستقر کنید
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-foreground/80">
                نوع بسته نصب را انتخاب کنید:
              </p>
              <div className="flex items-center gap-2">
                <Select defaultValue="full">
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">نصب کامل (کد + دیتابیس)</SelectItem>
                    <SelectItem value="code-only">فقط کد منبع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCreateExport('full')}
                disabled={creating || loading}
                className="bg-gradient-to-l from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-black font-semibold h-10 gap-2 shadow-lg shadow-gold/20"
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Package className="size-4" />
                )}
                {creating ? 'در حال ایجاد...' : 'ایجاد بسته کامل'}
              </Button>
              <Button
                onClick={() => handleCreateExport('code-only')}
                disabled={creating || loading}
                variant="outline"
                className="h-10 gap-2 border-gold/20 text-gold hover:bg-gold/5"
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileArchive className="size-4" />
                )}
                فقط کد
              </Button>
            </div>
          </div>

          {/* Progress message */}
          {progress && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {progress}
              </span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <XCircle className="size-4 text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── How It Works Guide ─── */}
      <Card className="border-gold/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Info className="size-4 text-blue-500" />
            </div>
            <CardTitle className="text-base">راهنمای استفاده</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative flex gap-3 rounded-xl border border-gold/10 bg-muted/30 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold text-black text-sm font-bold">
                ۱
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  ایجاد بسته نصب
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  از دکمه بالا یک بسته نصب کامل ایجاد کنید. فایل شامل کد منبع، دیتابیس و ویزارد نصب می‌شود.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-3 rounded-xl border border-gold/10 bg-muted/30 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold text-black text-sm font-bold">
                ۲
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  آپلود روی سرور
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  فایل .tar.gz را روی سرور هدف آپلود و اکسترکت کنید. سپس نصاب را اجرا کنید.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-3 rounded-xl border border-gold/10 bg-muted/30 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold text-black text-sm font-bold">
                ۳
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  اجرای نصاب
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  وارد پوشه installer شوید و دستور زیر را اجرا کنید:
                  <code className="mt-1 block rounded bg-background px-2 py-1 text-[11px] font-mono text-gold border border-border/50">
                    cd installer && node server.js
                  </code>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    سپس مرورگر را روی پورت ۳۳۳۳ باز کنید.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Terminal commands */}
          <div className="mt-4 rounded-xl border border-gold/10 bg-[#0d1117] p-4 font-mono text-xs leading-relaxed overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-muted-foreground text-[10px]">Terminal — سرور هدف</span>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">
                <span className="text-emerald-400">$</span> {' '}Upload miligold-*.tar.gz to your server
              </p>
              <p className="text-muted-foreground">
                <span className="text-emerald-400">$</span> tar -xzf miligold-*.tar.gz
              </p>
              <p className="text-muted-foreground">
                <span className="text-emerald-400">$</span> cd easy-installer/installer
              </p>
              <p className="text-muted-foreground">
                <span className="text-emerald-400">$</span> node server.js
              </p>
              <p className="text-gold">
                ✨ Installer running at http://localhost:3333
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: Shield, label: 'بررسی پیش‌نیازها', desc: 'Node.js, دیسک, دسترسی‌ها' },
              { icon: Database, label: 'راه‌اندازی دیتابیس', desc: 'SQLite, MySQL, PostgreSQL' },
              { icon: Zap, label: 'بیلد خودکار', desc: 'نصب وابستگی‌ها + بیلد' },
              { icon: Server, label: 'حذف خودکار', desc: 'پاکسازی فایل‌های نصب' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2.5">
                <f.icon className="size-4 text-gold shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Package List ─── */}
      <Card className="border-gold/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10">
                <FileArchive className="size-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base">
                  بسته‌های نصب
                  <Badge className="mr-2 bg-gold/10 text-gold border-gold/20 text-[10px]">
                    {toPersianNum(packages.length)}
                  </Badge>
                </CardTitle>
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={fetchData}
                    disabled={loading}
                  >
                    <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>بروزرسانی</TooltipContent>
              </Tooltip>
              {packages.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                      onClick={handleCleanup}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>حذف بسته‌های قدیمی (بیش از ۳۰ روز)</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 text-gold animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gold/5 border border-gold/10 mb-4">
                <Upload className="size-8 text-gold/30" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">هنوز بسته‌ای ایجاد نشده</p>
              <p className="text-xs text-muted-foreground/60">
                از دکمه &laquo;ایجاد بسته نصب&raquo; استفاده کنید
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {packages.map((pkg) => (
                <div
                  key={pkg.filename}
                  className="group flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-all hover:border-gold/20 hover:bg-muted/40"
                >
                  {/* Status icon */}
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                    pkg.status === 'completed' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {pkg.status === 'completed' ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : (
                      <XCircle className="size-5 text-red-500" />
                    )}
                  </div>

                  {/* Package info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {pkg.filename}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => copyToClipboard(pkg.filename)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copied === pkg.filename ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Copy className="size-3 text-muted-foreground hover:text-gold" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>کپی نام فایل</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="size-3" />
                        {toPersianNum(pkg.sizeFormatted)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatRelativeDate(pkg.createdAt)}
                      </span>
                      <Badge
                        className={`text-[9px] px-1.5 py-0 h-4 ${
                          pkg.type === 'full'
                            ? 'bg-gold/10 text-gold border-gold/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {pkg.type === 'full' ? 'کامل' : 'فقط کد'}
                      </Badge>
                    </div>
                    {pkg.includes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {pkg.includes.map((inc) => (
                          <span
                            key={inc}
                            className="rounded bg-gold/5 border border-gold/10 px-1.5 py-0.5 text-[9px] text-muted-foreground"
                          >
                            {inc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-gold hover:text-gold hover:bg-gold/10"
                          onClick={() => handleDownload(pkg.filename)}
                          disabled={pkg.status !== 'completed'}
                        >
                          <Download className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>دانلود بسته</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteTarget(pkg.filename)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>حذف بسته</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Security Tips ─── */}
      <Card className="border-amber-500/20 bg-amber-500/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                نکات امنیتی مهم
              </h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                  پس از نصب موفقیت‌آمیز روی سرور جدید، حتماً فایل‌های نصاب را حذف کنید
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                  بسته‌های نصب حاوی اطلاعات حساس دیتابیس هستند — از اشتراک‌گذاری خودداری کنید
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                  رمز عبور مدیر را پس از انتقال حتماً تغییر دهید
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                  بسته‌های قدیمی‌تر از ۳۰ روز را به صورت دوره‌ای پاکسازی کنید
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Installer Preview ─── */}
      <Card className="border-gold/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
              <MonitorPlay className="size-4 text-violet-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">پیش‌نمایش نصاب‌گر</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                مشاهده ظاهر ویزارد نصب قبل از خروجی
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="border-gold/20 text-gold hover:bg-gold/10 gap-2"
            >
              <Eye className="size-4" />
              مشاهده پیش‌نمایش
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mini preview of installer wizard steps */}
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { step: '۱', title: 'خوش آمدید', desc: 'معرفی پروژه و بررسی پیش‌نیازها', color: 'from-gold/20 to-gold/5', icon: '🚀' },
              { step: '۲', title: 'بررسی و پیکربندی', desc: 'تنظیمات دیتابیس و اطلاعات سایت', color: 'from-blue-500/20 to-blue-500/5', icon: '⚙️' },
              { step: '۳', title: 'نصب خودکار', desc: 'بیلد، مهاجرت داده‌ها و تست نهایی', color: 'from-emerald-500/20 to-emerald-500/5', icon: '✅' },
            ].map((s) => (
              <div key={s.step} className="relative rounded-xl border border-border/50 overflow-hidden">
                {/* Step number badge */}
                <div className={cn(
                  'absolute top-3 start-3 flex size-6 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-black',
                  s.color
                )}>
                  {s.step}
                </div>
                {/* Content */}
                <div className="pt-10 pb-4 px-4">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{s.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
                {/* Bottom gradient */}
                <div className={cn(
                  'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l',
                  s.step === '۱' ? 'from-gold to-transparent' : s.step === '۲' ? 'from-blue-500 to-transparent' : 'from-emerald-500 to-transparent'
                )} />
              </div>
            ))}
          </div>
          {/* Progress bar mockup */}
          <div className="mt-4 rounded-xl border border-gold/10 bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-foreground">نمونه نوار پیشرفت نصب</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
              <div className="absolute inset-y-0 right-0 w-[65%] rounded-full bg-gradient-to-l from-gold via-amber-500 to-gold-dark transition-all" />
              <div className="absolute inset-y-0 right-[65%] w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>پاکسازی و آماده‌سازی...</span>
              <span className="font-semibold text-gold">۶۵٪</span>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
            برای مشاهده نسخه کامل، بسته نصب را ایجاد و روی سرور اجرا کنید
          </p>
        </CardContent>
      </Card>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف بسته نصب</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئنید که می‌خواهید بسته{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget}
              </span>{' '}
              را حذف کنید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
