
import React, { useState, useEffect, useCallback } from 'react';
import {useAppStore} from '@/lib/store';
import {cn} from '@/lib/utils';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Switch} from '@/components/ui/switch';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Plus, Trash2, Edit3, Eye, EyeOff, ChevronUp, ChevronDown, FileText, Globe, Settings, ArrowLeft, Loader2, GripVertical, Home, Type, Image, Link, HelpCircle, Sparkles, Star, DollarSign, Save, ExternalLink, X, CheckCircle} from 'lucide-react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription} from '@/components/ui/dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CMSPageItem {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
  components?: CMSComponentItem[];
  content?: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
}

interface CMSComponentItem {
  id: string;
  pageId: string;
  type: string;
  order: number;
  props: string;
}

interface ComponentTypeConfig {
  type: string;
  label: string;
  icon: React.ElementType;
  emoji: string;
  defaultProps: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Component Type Definitions                                         */
/* ------------------------------------------------------------------ */

const COMPONENT_TYPES: ComponentTypeConfig[] = [
  {
    type: 'hero',
    label: 'بخش اصلی',
    icon: Home,
    emoji: '🏠',
    defaultProps: { title: 'عنوان اصلی', subtitle: 'زیرعنوان', ctaText: 'شروع کنید', ctaLink: '#', bgImageUrl: '' },
  },
  {
    type: 'text',
    label: 'بلوک متنی',
    icon: Type,
    emoji: '📝',
    defaultProps: { content: 'محتوای متنی خود را وارد کنید...' },
  },
  {
    type: 'image',
    label: 'بخش تصویر',
    icon: Image,
    emoji: '🖼️',
    defaultProps: { imageUrl: '', alt: '', caption: '' },
  },
  {
    type: 'cta',
    label: 'دکمه اقدام',
    icon: Link,
    emoji: '🔗',
    defaultProps: { buttonText: 'کلیک کنید', link: '#', description: '' },
  },
  {
    type: 'faq',
    label: 'سوالات متداول',
    icon: HelpCircle,
    emoji: '❓',
    defaultProps: { items: [{ question: 'سوال؟', answer: 'پاسخ.' }] },
  },
  {
    type: 'features',
    label: 'ویژگی‌ها',
    icon: Sparkles,
    emoji: '✨',
    defaultProps: { items: [{ icon: '⭐', title: 'ویژگی', description: 'توضیحات' }] },
  },
  {
    type: 'testimonials',
    label: 'نظرات مشتریان',
    icon: Star,
    emoji: '⭐',
    defaultProps: { items: [{ name: 'نام', role: 'نقش', text: 'متن نظر', avatar: '' }] },
  },
  {
    type: 'pricing',
    label: 'برنامه‌های قیمت‌گذاری',
    icon: DollarSign,
    emoji: '💰',
    defaultProps: { items: [{ name: 'پایه', price: 'رایگان', features: 'ویژگی ۱, ویژگی ۲', isFeatured: false }] },
  },
];

function getComponentConfig(type: string): ComponentTypeConfig | undefined {
  return COMPONENT_TYPES.find((c) => c.type === type);
}

function parseProps(propsStr: string): Record<string, unknown> {
  try {
    return JSON.parse(propsStr);
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Component Palette                                                  */
/* ------------------------------------------------------------------ */

function ComponentPalette({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-muted-foreground mb-3">کامپوننت‌ها</h3>
      <div className="grid grid-cols-2 gap-2">
        {COMPONENT_TYPES.map((ct) => {
          const Icon = ct.icon;
          return (
            <button
              key={ct.type}
              type="button"
              onClick={() => onAdd(ct.type)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-gold/40 hover:bg-gold/5 transition-all text-center group"
            >
              <span className="text-xl">{ct.emoji}</span>
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-gold">{ct.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component Card Preview                                             */
/* ------------------------------------------------------------------ */

function ComponentCard({
  component,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  component: CMSComponentItem;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const config = getComponentConfig(component.type);
  const props = parseProps(component.props);

  return (
    <div className="group relative flex items-start gap-3 p-3 rounded-lg border border-border hover:border-gold/30 bg-card transition-all">
      <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded hover:bg-muted disabled:opacity-20"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded hover:bg-muted disabled:opacity-20"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <GripVertical className="size-3 text-muted-foreground" />
          <span className="text-sm">{config?.emoji}</span>
          <span className="text-sm font-medium">{config?.label}</span>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            #{index + 1}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {renderMiniPreview(component.type, props)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={onEdit} className="p-1.5 rounded hover:bg-muted">
          <Edit3 className="size-3.5 text-gold" />
        </button>
        <button type="button" onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/10">
          <Trash2 className="size-3.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function renderMiniPreview(type: string, props: Record<string, unknown>): string {
  switch (type) {
    case 'hero': return String(props.title || 'بدون عنوان') + ' — ' + String(props.subtitle || '');
    case 'text': return String(props.content || '').slice(0, 80) + '...';
    case 'image': return String(props.caption || props.alt || 'تصویر');
    case 'cta': return String(props.buttonText || 'دکمه') + ' → ' + String(props.link || '#');
    case 'faq': {
      const items = (props.items as Array<{ question: string }> | undefined) || [];
      return `${items.length} سوال`;
    }
    case 'features': {
      const items = (props.items as Array<unknown> | undefined) || [];
      return `${items.length} ویژگی`;
    }
    case 'testimonials': {
      const items = (props.items as Array<unknown> | undefined) || [];
      return `${items.length} نظر`;
    }
    case 'pricing': {
      const items = (props.items as Array<unknown> | undefined) || [];
      return `${items.length} برنامه`;
    }
    default: return type;
  }
}

/* ------------------------------------------------------------------ */
/*  Component Props Editor Dialog                                      */
/* ------------------------------------------------------------------ */

function ComponentEditorDialog({
  open,
  onOpenChange,
  component,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  component: CMSComponentItem | null;
  onSave: (id: string, props: Record<string, unknown>) => void;
}) {
  const [editProps, setEditProps] = useState<Record<string, unknown>>(
    () => component ? parseProps(component.props) : {}
  );
  const config = component ? getComponentConfig(component.type) : null;

  const handleSave = () => {
    if (component) {
      onSave(component.id, editProps);
      onOpenChange(false);
    }
  };

  if (!component || !config) return null;

  const props = editProps;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{config.emoji}</span>
            ویرایش {config.label}
          </DialogTitle>
          <DialogDescription>ویژگی‌های کامپوننت را تنظیم کنید</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Hero props */}
          {component.type === 'hero' && (
            <>
              <div className="space-y-2">
                <Label>عنوان اصلی</Label>
                <Input value={String(props.title || '')} onChange={(e) => setEditProps({ ...props, title: e.target.value })} className="input-gold-focus" />
              </div>
              <div className="space-y-2">
                <Label>زیرعنوان</Label>
                <Input value={String(props.subtitle || '')} onChange={(e) => setEditProps({ ...props, subtitle: e.target.value })} className="input-gold-focus" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>متن دکمه</Label>
                  <Input value={String(props.ctaText || '')} onChange={(e) => setEditProps({ ...props, ctaText: e.target.value })} className="input-gold-focus" />
                </div>
                <div className="space-y-2">
                  <Label>لینک دکمه</Label>
                  <Input value={String(props.ctaLink || '')} onChange={(e) => setEditProps({ ...props, ctaLink: e.target.value })} dir="ltr" className="input-gold-focus" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>آدرس تصویر پس‌زمینه</Label>
                <Input value={String(props.bgImageUrl || '')} onChange={(e) => setEditProps({ ...props, bgImageUrl: e.target.value })} dir="ltr" className="input-gold-focus" placeholder="https://..." />
              </div>
            </>
          )}

          {/* Text props */}
          {component.type === 'text' && (
            <div className="space-y-2">
              <Label>محتوا</Label>
              <Textarea value={String(props.content || '')} onChange={(e) => setEditProps({ ...props, content: e.target.value })} rows={6} className="input-gold-focus" />
            </div>
          )}

          {/* Image props */}
          {component.type === 'image' && (
            <>
              <div className="space-y-2">
                <Label>آدرس تصویر</Label>
                <Input value={String(props.imageUrl || '')} onChange={(e) => setEditProps({ ...props, imageUrl: e.target.value })} dir="ltr" className="input-gold-focus" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>متن جایگزین</Label>
                  <Input value={String(props.alt || '')} onChange={(e) => setEditProps({ ...props, alt: e.target.value })} className="input-gold-focus" />
                </div>
                <div className="space-y-2">
                  <Label>عنوان</Label>
                  <Input value={String(props.caption || '')} onChange={(e) => setEditProps({ ...props, caption: e.target.value })} className="input-gold-focus" />
                </div>
              </div>
            </>
          )}

          {/* CTA props */}
          {component.type === 'cta' && (
            <>
              <div className="space-y-2">
                <Label>متن دکمه</Label>
                <Input value={String(props.buttonText || '')} onChange={(e) => setEditProps({ ...props, buttonText: e.target.value })} className="input-gold-focus" />
              </div>
              <div className="space-y-2">
                <Label>لینک</Label>
                <Input value={String(props.link || '')} onChange={(e) => setEditProps({ ...props, link: e.target.value })} dir="ltr" className="input-gold-focus" />
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea value={String(props.description || '')} onChange={(e) => setEditProps({ ...props, description: e.target.value })} rows={3} className="input-gold-focus" />
              </div>
            </>
          )}

          {/* FAQ props */}
          {component.type === 'faq' && (
            <div className="space-y-3">
              <Label>سوال و جواب‌ها</Label>
              {(props.items as Array<{ question: string; answer: string }> | undefined)?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2 border border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                    <button type="button" onClick={() => {
                      const items = [...((props.items as Array<unknown>) || [])];
                      items.splice(idx, 1);
                      setEditProps({ ...props, items });
                    }}>
                      <X className="size-3 text-red-400" />
                    </button>
                  </div>
                  <Input value={item.question} onChange={(e) => {
                    const items = [...((props.items as Array<{ question: string; answer: string }>) || [])];
                    items[idx] = { ...items[idx], question: e.target.value };
                    setEditProps({ ...props, items });
                  }} placeholder="سوال" className="input-gold-focus text-sm" />
                  <Textarea value={item.answer} onChange={(e) => {
                    const items = [...((props.items as Array<{ question: string; answer: string }>) || [])];
                    items[idx] = { ...items[idx], answer: e.target.value };
                    setEditProps({ ...props, items });
                  }} placeholder="پاسخ" rows={2} className="input-gold-focus text-sm" />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => {
                  const items = [...((props.items as Array<{ question: string; answer: string }>) || []), { question: '', answer: '' }];
                  setEditProps({ ...props, items });
                }}
              >
                <Plus className="size-4 ml-1" /> افزودن سوال
              </Button>
            </div>
          )}

          {/* Features props */}
          {component.type === 'features' && (
            <div className="space-y-3">
              <Label>ویژگی‌ها</Label>
              {(props.items as Array<{ icon: string; title: string; description: string }> | undefined)?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2 border border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                    <button type="button" onClick={() => {
                      const items = [...((props.items as Array<unknown>) || [])];
                      items.splice(idx, 1);
                      setEditProps({ ...props, items });
                    }}>
                      <X className="size-3 text-red-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={item.icon} onChange={(e) => {
                      const items = [...((props.items as Array<{ icon: string; title: string; description: string }>) || [])];
                      items[idx] = { ...items[idx], icon: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="آیکون" className="input-gold-focus text-sm" />
                    <Input value={item.title} onChange={(e) => {
                      const items = [...((props.items as Array<{ icon: string; title: string; description: string }>) || [])];
                      items[idx] = { ...items[idx], title: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="عنوان" className="input-gold-focus text-sm" />
                    <Input value={item.description} onChange={(e) => {
                      const items = [...((props.items as Array<{ icon: string; title: string; description: string }>) || [])];
                      items[idx] = { ...items[idx], description: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="توضیح" className="input-gold-focus text-sm" />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => {
                  const items = [...((props.items as Array<unknown>) || []), { icon: '⭐', title: '', description: '' }];
                  setEditProps({ ...props, items });
                }}
              >
                <Plus className="size-4 ml-1" /> افزودن ویژگی
              </Button>
            </div>
          )}

          {/* Testimonials props */}
          {component.type === 'testimonials' && (
            <div className="space-y-3">
              <Label>نظرات</Label>
              {(props.items as Array<{ name: string; role: string; text: string; avatar: string }> | undefined)?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2 border border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                    <button type="button" onClick={() => {
                      const items = [...((props.items as Array<unknown>) || [])];
                      items.splice(idx, 1);
                      setEditProps({ ...props, items });
                    }}>
                      <X className="size-3 text-red-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={item.name} onChange={(e) => {
                      const items = [...((props.items as Array<{ name: string; role: string; text: string; avatar: string }>) || [])];
                      items[idx] = { ...items[idx], name: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="نام" className="input-gold-focus text-sm" />
                    <Input value={item.role} onChange={(e) => {
                      const items = [...((props.items as Array<{ name: string; role: string; text: string; avatar: string }>) || [])];
                      items[idx] = { ...items[idx], role: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="نقش" className="input-gold-focus text-sm" />
                  </div>
                  <Textarea value={item.text} onChange={(e) => {
                    const items = [...((props.items as Array<{ name: string; role: string; text: string; avatar: string }>) || [])];
                    items[idx] = { ...items[idx], text: e.target.value };
                    setEditProps({ ...props, items });
                  }} placeholder="متن نظر" rows={2} className="input-gold-focus text-sm" />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => {
                  const items = [...((props.items as Array<unknown>) || []), { name: '', role: '', text: '', avatar: '' }];
                  setEditProps({ ...props, items });
                }}
              >
                <Plus className="size-4 ml-1" /> افزودن نظر
              </Button>
            </div>
          )}

          {/* Pricing props */}
          {component.type === 'pricing' && (
            <div className="space-y-3">
              <Label>برنامه‌ها</Label>
              {(props.items as Array<{ name: string; price: string; features: string; isFeatured: boolean }> | undefined)?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2 border border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                    <button type="button" onClick={() => {
                      const items = [...((props.items as Array<unknown>) || [])];
                      items.splice(idx, 1);
                      setEditProps({ ...props, items });
                    }}>
                      <X className="size-3 text-red-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={item.name} onChange={(e) => {
                      const items = [...((props.items as Array<{ name: string; price: string; features: string; isFeatured: boolean }>) || [])];
                      items[idx] = { ...items[idx], name: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="نام برنامه" className="input-gold-focus text-sm" />
                    <Input value={item.price} onChange={(e) => {
                      const items = [...((props.items as Array<{ name: string; price: string; features: string; isFeatured: boolean }>) || [])];
                      items[idx] = { ...items[idx], price: e.target.value };
                      setEditProps({ ...props, items });
                    }} placeholder="قیمت" className="input-gold-focus text-sm" />
                  </div>
                  <Textarea value={item.features} onChange={(e) => {
                    const items = [...((props.items as Array<{ name: string; price: string; features: string; isFeatured: boolean }>) || [])];
                    items[idx] = { ...items[idx], features: e.target.value };
                    setEditProps({ ...props, items });
                  }} placeholder="ویژگی‌ها (با کاما جدا)" rows={2} className="input-gold-focus text-sm" />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.isFeatured}
                      onCheckedChange={(v) => {
                        const items = [...((props.items as Array<{ name: string; price: string; features: string; isFeatured: boolean }>) || [])];
                        items[idx] = { ...items[idx], isFeatured: v };
                        setEditProps({ ...props, items });
                      }}
                      className="data-[state=checked]:bg-[#D4AF37]"
                    />
                    <Label className="text-xs">برنامه پیشنهادی</Label>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => {
                  const items = [...((props.items as Array<unknown>) || []), { name: '', price: '', features: '', isFeatured: false }];
                  setEditProps({ ...props, items });
                }}
              >
                <Plus className="size-4 ml-1" /> افزودن برنامه
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button className="btn-gold-gradient" onClick={handleSave}>
            <Save className="size-4 ml-1" /> ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Page Dialog                                                 */
/* ------------------------------------------------------------------ */

function CreatePageDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (slug: string, title: string) => void;
}) {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (slug.trim() && title.trim()) {
      onCreate(slug.trim(), title.trim());
      setSlug('');
      setTitle('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-gold" />
            ایجاد صفحه جدید
          </DialogTitle>
          <DialogDescription>عنوان و شناسه صفحه را وارد کنید</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>عنوان صفحه</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: درباره ما" className="input-gold-focus" />
          </div>
          <div className="space-y-2">
            <Label>شناسه صفحه (Slug)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-us" dir="ltr" className="input-gold-focus text-left" />
            <p className="text-xs text-muted-foreground">فقط حروف انگلیسی، عدد و خط تیره مجاز است</p>
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button className="btn-gold-gradient" onClick={handleCreate} disabled={!slug.trim() || !title.trim()}>
            <Plus className="size-4 ml-1" /> ایجاد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Editor                                                        */
/* ------------------------------------------------------------------ */

function PageEditor({
  page,
  onBack,
}: {
  page: CMSPageItem;
  onBack: () => void;
}) {
  const { addToast } = useAppStore();
  const [components, setComponents] = useState<CMSComponentItem[]>(page.components || []);
  const [pageTitle, setPageTitle] = useState(page.title);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || '');
  const [seoDesc, setSeoDesc] = useState(page.seoDesc || '');
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<CMSComponentItem | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddComponent = async (type: string) => {
    try {
      const ct = COMPONENT_TYPES.find((c) => c.type === type);
      const res = await fetch('/api/cms/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: page.id,
          type,
          props: ct?.defaultProps || {},
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setComponents((prev) => [...prev, data.component]);
        }
      }
    } catch {
      addToast('خطا در افزودن کامپوننت', 'error');
    }
  };

  const handleDeleteComponent = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/components?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComponents((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      addToast('خطا در حذف کامپوننت', 'error');
    }
  };

  const handleMoveComponent = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= components.length) return;

    const updated = [...components];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((c, i) => ({ ...c, order: i }));
    setComponents(reordered);

    try {
      await fetch('/api/cms/components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: reordered }),
      });
    } catch {
      // ignore
    }
  };

  const handleSaveComponentProps = async (id: string, props: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/cms/components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: [{ id, order: 0, props }] }),
      });
      if (res.ok) {
        setComponents((prev) =>
          prev.map((c) => (c.id === id ? { ...c, props: JSON.stringify(props) } : c))
        );
        addToast('کامپوننت بروزرسانی شد', 'success');
      }
    } catch {
      addToast('خطا در بروزرسانی کامپوننت', 'error');
    }
  };

  const handleSavePage = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageTitle,
          seoTitle,
          seoDesc,
          isPublished,
        }),
      });
      if (res.ok) {
        addToast('صفحه ذخیره شد', 'success');
      }
    } catch {
      addToast('خطا در ذخیره صفحه', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gold">
          <ArrowLeft className="size-4 ml-1" /> بازگشت
        </Button>
        <div className="flex-1">
          <Input
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="text-lg font-bold input-gold-focus border-transparent bg-transparent focus:border-gold/30 p-0 h-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              className="data-[state=checked]:bg-emerald-500"
            />
            <Label className="text-xs">{isPublished ? 'منتشر شده' : 'پیش‌نویس'}</Label>
          </div>
          <Button onClick={handleSavePage} disabled={saving} className="btn-gold-gradient" size="sm">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 ml-1" />}
            ذخیره
          </Button>
        </div>
      </div>

      {/* SEO Section */}
      <Card className="card-gold-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="size-4 text-gold" />
            تنظیمات SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">عنوان SEO</Label>
            <Input value={seoTitle || ''} onChange={(e) => setSeoTitle(e.target.value)} placeholder="عنوان صفحه در موتور جستجو" className="input-gold-focus" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">توضیحات SEO</Label>
            <Textarea value={seoDesc || ''} onChange={(e) => setSeoDesc(e.target.value)} placeholder="توضیحات متا صفحه" rows={2} className="input-gold-focus" />
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Component Palette (left) */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="card-gold-border">
            <CardContent className="p-4">
              <ComponentPalette onAdd={handleAddComponent} />
            </CardContent>
          </Card>
        </div>

        {/* Components List (main) */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <Card className="card-gold-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="size-4 text-gold" />
                  محتوای صفحه
                </span>
                <Badge variant="outline" className="text-xs">{components.length} کامپوننت</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {components.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="size-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">هنوز کامپوننتی اضافه نشده</p>
                  <p className="text-xs mt-1">از پالت سمت چپ کامپوننت اضافه کنید</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map((comp, idx) => (
                    <ComponentCard
                      key={comp.id}
                      component={comp}
                      index={idx}
                      total={components.length}
                      onEdit={() => {
                        setEditingComponent(comp);
                        setEditDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteComponent(comp.id)}
                      onMoveUp={() => handleMoveComponent(idx, 'up')}
                      onMoveDown={() => handleMoveComponent(idx, 'down')}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Component Editor Dialog */}
      <ComponentEditorDialog
        key={editingComponent?.id ?? 'none'}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        component={editingComponent}
        onSave={handleSaveComponentProps}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main PageBuilderView                                               */
/* ------------------------------------------------------------------ */

export default function PageBuilderView() {
  const { user } = useAppStore();
  const [pages, setPages] = useState<CMSPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPageItem | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/pages');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPages(data.pages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchPages();
  }, []);

  const handleCreatePage = async (slug: string, title: string) => {
    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPages((prev) => [data.page, ...prev]);
          useAppStore.getState().addToast('صفحه ایجاد شد', 'success');
        }
      }
    } catch {
      useAppStore.getState().addToast('خطا در ایجاد صفحه', 'error');
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id));
        useAppStore.getState().addToast('صفحه حذف شد', 'success');
      }
    } catch {
      useAppStore.getState().addToast('خطا در حذف صفحه', 'error');
    }
  };

  const handleTogglePublish = async (page: CMSPageItem) => {
    try {
      const res = await fetch(`/api/cms/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !page.isPublished }),
      });
      if (res.ok) {
        setPages((prev) =>
          prev.map((p) => (p.id === page.id ? { ...p, isPublished: !p.isPublished } : p))
        );
      }
    } catch { /* ignore */ }
  };

  const handleEditPage = async (page: CMSPageItem) => {
    try {
      const res = await fetch(`/api/cms/pages/${page.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEditingPage(data.page);
        }
      }
    } catch { /* ignore */ }
  };

  // Page editor mode
  if (editingPage) {
    return <PageEditor page={editingPage} onBack={() => setEditingPage(null)} />;
  }

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="text-center py-20">
        <Settings className="size-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground">دسترسی محدود</h2>
        <p className="text-sm text-muted-foreground mt-2">فقط مدیران به این بخش دسترسی دارند</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">سازنده صفحه</h1>
          <p className="text-sm text-muted-foreground">ساخت و مدیریت صفحات محتوایی</p>
        </div>
        <Button className="btn-gold-gradient" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4 ml-2" />
          صفحه جدید
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="size-16 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground">هنوز صفحه‌ای ایجاد نشده</h3>
          <p className="text-sm text-muted-foreground mt-2">اولین صفحه خود را بسازید</p>
          <Button className="btn-gold-gradient mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4 ml-2" /> ایجاد صفحه
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((p) => (
            <Card key={p.id} className="card-gold-border hover-lift-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Globe className="size-4 text-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{p.title}</CardTitle>
                      <p className="text-xs text-muted-foreground" dir="ltr">/{p.slug}</p>
                    </div>
                  </div>
                  <Badge className={p.isPublished ? 'badge-success-green' : 'badge-warning-amber'}>
                    {p.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString('fa-IR')}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gold/30 text-gold hover:bg-gold/10 text-xs"
                    onClick={() => handleEditPage(p)}
                  >
                    <Edit3 className="size-3 ml-1" /> ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'text-xs',
                      p.isPublished ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                    )}
                    onClick={() => handleTogglePublish(p)}
                  >
                    {p.isPublished ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                    onClick={() => handleDeletePage(p.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatePageDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreatePage}
      />
    </div>
  );
}
