'use client';

/* ═══════════════════════════════════════════════════════════════════════════
 *  MediaPicker.tsx — انتخاب‌گر تصویر/رسانه
 *  قابلیت‌ها: آپلود فایل، مرور کتابخانه رسانه، انتخاب تصویر
 * ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload, Image, Film, Trash2, Plus, X, Search, FolderOpen,
  Check, Grid, Loader2, ExternalLink, ImageIcon, FileVideo
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
 *  Types
 * ═══════════════════════════════════════════════════════════════════════════ */

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  folder: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
  className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Helpers
 * ═══════════════════════════════════════════════════════════════════════════ */

function getToken(): string | undefined {
  return useAppStore.getState().user?.sessionToken;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MediaPicker Component
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function MediaPicker({
  value,
  onChange,
  folder = 'blog',
  accept = 'image/*',
  label = 'تصویر شاخص',
  className,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '20',
        folder,
        type: filterType,
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/media?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data.media || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setPage(p);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [folder, filterType, search]);

  const handleOpen = () => {
    setOpen(true);
    setUrlInput(value || '');
  };

  const handleClose = () => {
    setOpen(false);
    setSearch('');
    setFilterType('all');
  };

  React.useEffect(() => {
    if (open) fetchMedia();
  }, [open, fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      formData.append('folder', folder);

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const firstSuccess = data.results?.find((r: { success: boolean }) => r.success);
        if (firstSuccess) {
          onChange(firstSuccess.url);
          useAppStore.getState().addToast('فایل آپلود شد', 'success');
        }
        fetchMedia();
      } else {
        useAppStore.getState().addToast('خطا در آپلود', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در آپلود', 'error');
    }
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        useAppStore.getState().addToast('رسانه حذف شد', 'success');
        if (value === mediaItems.find(m => m.id === id)?.url) {
          onChange('');
        }
        fetchMedia();
      }
    } catch { useAppStore.getState().addToast('خطا در حذف', 'error'); }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      handleClose();
    }
  };

  const filteredItems = mediaItems.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.originalName.toLowerCase().includes(q);
  });

  return (
    <div className={cn('space-y-2', className)}>
      {/* Preview + Open Button */}
      <div className="relative group">
        {value ? (
          <div className="relative rounded-lg overflow-hidden border border-gold/20">
            {isImage('image/jpeg') ? (
              <img
                src={value}
                alt="تصویر شاخص"
                className="w-full h-40 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-40 bg-muted flex items-center justify-center">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleOpen}
                className="gap-1.5 text-xs"
              >
                <ExternalLink className="size-3" /> تغییر
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChange('')}
                className="gap-1.5 text-xs text-red-400"
              >
                <X className="size-3" /> حذف
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="w-full h-40 rounded-lg border-2 border-dashed border-gold/20 hover:border-gold/40 bg-muted/30 hover:bg-gold/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center">
              <Upload className="size-5 text-gold" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground/70">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">آپلود کنید یا از رسانه‌ها انتخاب کنید</p>
            </div>
          </button>
        )}
      </div>

      {/* Media Library Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden p-0" dir="rtl">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="size-5 text-gold" />
              کتابخانه رسانه
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[70vh]">
            {/* Upload Area */}
            <div className="px-4 pt-3">
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer',
                  dragOver
                    ? 'border-gold bg-gold/10'
                    : 'border-border/50 hover:border-gold/30 hover:bg-muted/30'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 text-gold animate-spin" />
                    <span className="text-sm text-gold">در حال آپلود...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Upload className="size-5 text-gold" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">کلیک کنید یا فایل بکشید اینجا رها کنید</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">فرمت‌های مجاز: JPG, PNG, GIF, WebP — حداکثر ۱۰ مگابایت</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* URL Input */}
            <div className="px-4 pt-2">
              <div className="flex items-center gap-2">
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="آدرس URL تصویر..."
                  dir="ltr"
                  className="h-8 text-xs flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(); }}
                />
                <Button size="sm" onClick={handleUrlSubmit} disabled={!urlInput.trim()} className="bg-gold hover:bg-gold-dark text-white text-xs shrink-0">
                  استفاده از URL
                </Button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 pt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="جستجو..."
                  className="pr-8 h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                {([
                  { key: 'all', label: 'همه', icon: Grid },
                  { key: 'image', label: 'تصاویر', icon: ImageIcon },
                  { key: 'video', label: 'ویدیو', icon: FileVideo },
                ] as const).map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => { setFilterType(f.key); setPage(1); }}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1',
                      filterType === f.key
                        ? 'bg-gold/15 text-gold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <f.icon className="size-3" /> {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Grid */}
            <div className="flex-1 min-h-0 px-4 pt-2">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          'relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                          value === item.url
                            ? 'border-gold ring-2 ring-gold/20'
                            : 'border-transparent hover:border-gold/30'
                        )}
                        onClick={() => {
                          onChange(item.url);
                          handleClose();
                        }}
                      >
                        {isImage(item.mimeType) ? (
                          <img
                            src={item.url}
                            alt={item.originalName}
                            className="w-full aspect-square object-cover"
                            loading="lazy"
                          />
                        ) : isVideo(item.mimeType) ? (
                          <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center gap-1">
                            <Film className="size-6 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">ویدیو</span>
                          </div>
                        ) : (
                          <div className="w-full aspect-square bg-muted flex items-center justify-center">
                            <FileVideo className="size-6 text-muted-foreground" />
                          </div>
                        )}

                        {/* Selected indicator */}
                        {value === item.url && (
                          <div className="absolute top-1 left-1 size-5 bg-gold rounded-full flex items-center justify-center">
                            <Check className="size-3 text-white" />
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onChange(item.url); handleClose(); }}
                              className="size-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                              title="انتخاب"
                            >
                              <Check className="size-3.5 text-white" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                              className="size-7 rounded-full bg-red-500/50 hover:bg-red-500/70 flex items-center justify-center transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="size-3 text-white" />
                            </button>
                          </div>
                        </div>

                        {/* File info */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3">
                          <p className="text-[8px] text-white/80 truncate">{item.originalName}</p>
                          <p className="text-[7px] text-white/50">{formatFileSize(item.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">رسانه‌ای یافت نشد</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">فایل آپلود کنید یا از URL استفاده کنید</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-2 border-t border-border/50 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => fetchMedia(page - 1)}
                  className="text-[10px] h-7"
                >
                  قبلی
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => fetchMedia(page + 1)}
                  className="text-[10px] h-7"
                >
                  بعدی
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
