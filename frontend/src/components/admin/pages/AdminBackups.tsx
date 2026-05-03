
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {getTimeAgo} from '@/lib/helpers';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {Database, Archive, Download, Trash2, Upload, Shield, RefreshCw, HardDrive, Clock, Calendar, AlertTriangle, CheckCircle, XCircle, Plus, Filter, Zap, Timer, CalendarClock} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BackupEntry {
  filename: string;
  type: 'daily' | 'weekly' | 'safety';
  size: number;
  createdAt: string;
  note?: string;
}

interface DbStats {
  dbSize: number;
  backupCount: number;
  totalBackupSize: number;
  lastBackupAt: string | null;
}

interface AutoBackupStatus {
  lastRun: string | null;
  lastDailyAt: string | null;
  lastWeeklyAt: string | null;
  nextDailyIn: string | null;
  nextWeeklyIn: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function typeLabel(type: string): string {
  switch (type) {
    case 'daily': return 'روزانه';
    case 'weekly': return 'هفتگی';
    case 'safety': return 'ایمنی';
    default: return type;
  }
}

function typeColor(type: string): string {
  switch (type) {
    case 'daily': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
    case 'weekly': return 'border-gold/30 text-gold bg-gold/10';
    case 'safety': return 'border-red-500/30 text-red-400 bg-red-500/10';
    default: return 'border-border text-muted-foreground bg-muted/50';
  }
}

function typeIcon(type: string) {
  switch (type) {
    case 'daily': return <Clock className="size-3" />;
    case 'weekly': return <Calendar className="size-3" />;
    case 'safety': return <Shield className="size-3" />;
    default: return <Archive className="size-3" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminBackups() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [stats, setStats] = useState<DbStats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoResult, setAutoResult] = useState<string | null>(null);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backups');
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات');
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
        setStats(data.stats || null);
      }
    } catch (err: any) {
      useAppStore.getState().addToast(err.message || 'خطا در دریافت اطلاعات بکاپ', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Create backup ── */
  const handleCreate = async (type: 'daily' | 'weekly') => {
    setCreating(type);
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        useAppStore.getState().addToast(
          type === 'daily' ? 'بکاپ روزانه با موفقیت ایجاد شد' : 'فول بکاپ هفتگی با موفقیت ایجاد شد',
          'success',
        );
        await fetchData();
      } else {
        useAppStore.getState().addToast(data.message || 'خطا در ایجاد بکاپ', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ایجاد بکاپ', 'error');
    } finally {
      setCreating(null);
    }
  };

  /* ── Run auto-backup now ── */
  const handleRunAutoBackup = async () => {
    setAutoRunning(true);
    setAutoResult(null);
    try {
      const res = await fetch('/api/admin/backups/auto', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const msgs: string[] = [];
        if (data.dailyCreated) msgs.push('بکاپ روزانه ایجاد شد');
        else msgs.push('بکاپ روزانه هنوز نیاز نیست');
        if (data.weeklyCreated) msgs.push('فول بکاپ هفتگی ایجاد شد');
        if (data.cleanedCount > 0) msgs.push(`${data.cleanedCount} بکاپ قدیمی پاکسازی شد`);
        setAutoResult(msgs.join(' | '));
        useAppStore.getState().addToast('بررسی بکاپ خودکار انجام شد', 'success');
        await fetchData();
      } else {
        setAutoResult(`خطا: ${data.message}`);
        useAppStore.getState().addToast(data.message || 'خطا', 'error');
      }
    } catch {
      setAutoResult('خطا در ارتباط با سرور');
    } finally {
      setAutoRunning(false);
    }
  };

  /* ── Download backup ── */
  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/backups/${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    useAppStore.getState().addToast('در حال دانلود بکاپ...', 'info');
  };

  /* ── Restore backup ── */
  const handleRestore = async (filename: string) => {
    setRestoring(filename);
    try {
      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.ok) {
        useAppStore.getState().addToast('بازیابی بکاپ با موفقیت انجام شد', 'success');
        await fetchData();
      } else {
        useAppStore.getState().addToast(data.message || data.error || 'خطا در بازیابی بکاپ', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در بازیابی بکاپ', 'error');
    } finally {
      setRestoring(null);
    }
  };

  /* ── Delete backup ── */
  const handleDelete = async (filename: string) => {
    setDeleting(filename);
    try {
      const res = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success || data.ok) {
        useAppStore.getState().addToast('بکاپ حذف شد', 'success');
        await fetchData();
      } else {
        useAppStore.getState().addToast(data.message || 'خطا در حذف بکاپ', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در حذف بکاپ', 'error');
    } finally {
      setDeleting(null);
    }
  };

  /* ── Filtered list ── */
  const filtered = filter === 'all'
    ? backups
    : backups.filter(b => b.type === filter);

  const dailyCount = backups.filter(b => b.type === 'daily').length;
  const weeklyCount = backups.filter(b => b.type === 'weekly').length;

  /* ── Storage usage percentage (simple heuristic) ── */
  const storagePercent = stats && stats.totalBackupSize > 0
    ? Math.min(100, Math.round((stats.totalBackupSize / (500 * 1024 * 1024)) * 100))
    : 0;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Database className="size-5 text-gold" />
          مدیریت بکاپ دیتابیس
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          بکاپ‌گیری خودکار روزانه و هفتگی از دیتابیس SQLite
        </p>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-gold">
          <CardContent className="p-4 text-center">
            <HardDrive className="size-5 mx-auto mb-2 text-gold" />
            <p className="text-[11px] text-muted-foreground">حجم دیتابیس</p>
            <p className="text-sm font-bold mt-1">
              {stats ? formatBytes(stats.dbSize) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Archive className="size-5 mx-auto mb-2 text-gold" />
            <p className="text-[11px] text-muted-foreground">تعداد بکاپ‌ها</p>
            <p className="text-sm font-bold mt-1">
              {stats ? stats.backupCount.toLocaleString('fa-IR') : '—'}
            </p>
            {backups.length > 0 && (
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {dailyCount.toLocaleString('fa-IR')} روزانه · {weeklyCount.toLocaleString('fa-IR')} هفتگی
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Database className="size-5 mx-auto mb-2 text-gold" />
            <p className="text-[11px] text-muted-foreground">حجم کل بکاپ‌ها</p>
            <p className="text-sm font-bold mt-1">
              {stats ? formatBytes(stats.totalBackupSize) : '—'}
            </p>
            {storagePercent > 0 && (
              <Progress value={storagePercent} className="h-1 mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="size-5 mx-auto mb-2 text-gold" />
            <p className="text-[11px] text-muted-foreground">آخرین بکاپ</p>
            <p className="text-sm font-bold mt-1">
              {stats?.lastBackupAt ? getTimeAgo(stats.lastBackupAt) : 'بدون بکاپ'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Auto Backup Schedule ─── */}
      <Card className="glass-gold">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="size-4 text-gold" />
            زمان‌بندی بکاپ خودکار
          </CardTitle>
          <CardDescription className="text-[11px]">
            بکاپ‌ها به صورت خودکار هر روز ساعت ۳ بامداد (به وقت تهران) بررسی و ایجاد می‌شوند
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Daily schedule */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">بکاپ روزانه</p>
                <p className="text-[10px] text-muted-foreground">
                  هر ۲۰ ساعت — نگهداری ۳۰ بکاپ آخر
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                فعال
              </Badge>
            </div>

            {/* Weekly schedule */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="size-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                <CalendarClock className="size-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">فول بکاپ هفتگی</p>
                <p className="text-[10px] text-muted-foreground">
                  هر شنبه — نگهداری ۸ بکاپ آخر
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] border-gold/30 text-gold">
                فعال
              </Badge>
            </div>
          </div>

          {/* Run auto-backup now */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleRunAutoBackup}
              disabled={autoRunning}
              variant="outline"
              size="sm"
              className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
            >
              {autoRunning ? (
                <><RefreshCw className="size-3.5 ml-1.5 animate-spin" />در حال بررسی...</>
              ) : (
                <><Zap className="size-3.5 ml-1.5" />اجبار اجرای بکاپ خودکار</>
              )}
            </Button>
            {autoResult && (
              <p className="text-[10px] text-muted-foreground">{autoResult}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Create Backup ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="size-4 text-gold" />
            ایجاد بکاپ دستی
          </CardTitle>
          <CardDescription className="text-[11px]">ایجاد بکاپ فوری از دیتابیس فعلی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleCreate('daily')}
              disabled={creating !== null}
              className="bg-gold hover:bg-gold-dark text-white text-xs"
            >
              {creating === 'daily' ? (
                <><RefreshCw className="size-3.5 ml-1.5 animate-spin" />در حال ایجاد...</>
              ) : (
                <><Clock className="size-3.5 ml-1.5" />بکاپ روزانه</>
              )}
            </Button>
            <Button
              onClick={() => handleCreate('weekly')}
              disabled={creating !== null}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
            >
              {creating === 'weekly' ? (
                <><RefreshCw className="size-3.5 ml-1.5 animate-spin" />در حال ایجاد...</>
              ) : (
                <><Calendar className="size-3.5 ml-1.5" />فول بکاپ هفتگی</>
              )}
            </Button>
            <Button
              onClick={fetchData}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-gold text-xs"
            >
              <RefreshCw className="size-3.5 ml-1.5" />بروزرسانی لیست
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Backup List ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Archive className="size-4 text-gold" />
                لیست بکاپ‌ها
              </CardTitle>
              <CardDescription className="text-[11px] mt-1">
                {filtered.length} بکاپ {filter !== 'all' ? `(${typeLabel(filter)})` : ''}
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 text-xs h-8">
                <Filter className="size-3 ml-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="daily">روزانه</SelectItem>
                <SelectItem value="weekly">هفتگی</SelectItem>
                <SelectItem value="safety">ایمنی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {backups.length === 0 ? 'بکاپی وجود ندارد' : 'بکاپی با این فیلتر یافت نشد'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-gold/20 transition-colors"
                >
                  {/* Type icon */}
                  <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    {typeIcon(backup.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate" dir="ltr">
                        {backup.filename}
                      </p>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${typeColor(backup.type)}`}>
                        {typeLabel(backup.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(backup.size)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {getTimeAgo(backup.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => handleDownload(backup.filename)}
                      title="دانلود"
                    >
                      <Download className="size-3.5" />
                    </Button>

                    {/* Restore Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-muted-foreground hover:text-gold hover:bg-gold/10"
                          title="بازیابی"
                        >
                          <Upload className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-gold">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="size-4 text-gold" />
                            بازیابی بکاپ
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs" dir="rtl">
                            <div className="space-y-2 mt-2">
                              <p>آیا از بازیابی بکاپ زیر مطمئن هستید؟</p>
                              <p className="font-mono text-[10px] p-2 rounded-lg bg-muted/50" dir="ltr">
                                {backup.filename}
                              </p>
                              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-red-500">
                                  <strong>هشدار:</strong> این عملیات دیتابیس فعلی را با محتوای این بکاپ جایگزین می‌کند.
                                  تمام تغییرات بعد از تاریخ این بکاپ از بین خواهند رفت.
                                  پیشنهاد می‌شود قبل از بازیابی، یک بکاپ جدید ایجاد کنید.
                                </p>
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs">انصراف</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRestore(backup.filename)}
                            disabled={restoring === backup.filename}
                            className="bg-gold hover:bg-gold-dark text-white text-xs"
                          >
                            {restoring === backup.filename ? (
                              <><RefreshCw className="size-3.5 ml-1 animate-spin" />در حال بازیابی...</>
                            ) : (
                              <><Upload className="size-3.5 ml-1" />بازیابی کن</>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          title="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-sm">
                            <Trash2 className="size-4 text-red-500" />
                            حذف بکاپ
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs" dir="rtl">
                            <p>آیا از حذف بکاپ زیر اطمینان دارید؟</p>
                            <p className="font-mono text-[10px] p-2 rounded-lg bg-muted/50 mt-2" dir="ltr">
                              {backup.filename}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              این عملیات قابل بازگشت نیست.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs">انصراف</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(backup.filename)}
                            disabled={deleting === backup.filename}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs"
                          >
                            {deleting === backup.filename ? (
                              <><RefreshCw className="size-3.5 ml-1 animate-spin" />در حال حذف...</>
                            ) : (
                              <><Trash2 className="size-3.5 ml-1" />حذف کن</>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Info Footer ─── */}
      <Card className="border-dashed border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="size-4 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium">نکات امنیتی</p>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>قبل از هر بازیابی، یک بکاپ ایمنی به صورت خودکار ایجاد می‌شود</li>
                <li>بکاپ‌های قدیمی‌تر از حد مجاز به صورت خودکار پاکسازی می‌شوند</li>
                <li>بکاپ‌ها در مسیر <code className="font-mono text-gold/70" dir="ltr">db/backups/</code> ذخیره می‌شوند</li>
                <li>برای امنیت بیشتر، بکاپ‌ها را به صورت دوره‌ای دانلود و در جای دیگری ذخیره کنید</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
