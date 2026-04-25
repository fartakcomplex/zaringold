'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowRight, Monitor, Tablet, Smartphone, Save, Eye, EyeOff,
  ChevronDown, ChevronUp, GripVertical, Trash2, Plus, X,
  Settings, Type, Image, Video, MousePointerClick, Minus,
  List, Star, BarChart3, LayoutGrid, Users, MessageSquareQuote,
  CreditCard, Clock, GalleryHorizontalEnd, Layers, MapPin,
  Home, Sparkles, ListOrdered, Shield, Handshake, Newspaper,
  CircleHelp, Megaphone, Copy, MoveUp, MoveDown, ArrowLeft,
  Loader2, Check, Undo2, Search, AlignCenter, AlignLeft, AlignRight,
  Palette, ToggleLeft, Square, Grip,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export interface CMSPageItem {
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

export interface CMSComponentItem {
  id: string;
  pageId: string;
  type: string;
  order: number;
  props: string;
}

interface BuilderSection {
  id: string;
  type: string;
  order: number;
  props: Record<string, unknown>;
  isVisible: boolean;
}

interface PropFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'color';
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface RepeaterFieldDef {
  key: string;
  label: string;
  type: 'repeater';
  itemLabel: string;
  fields: PropFieldDef[];
  defaultItem: Record<string, unknown>;
}

interface WidgetDef {
  type: string;
  label: string;
  category: string;
  icon: React.ElementType;
  emoji: string;
  defaultProps: Record<string, unknown>;
  propFields: (PropFieldDef | RepeaterFieldDef)[];
}

interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface ElementorBuilderProps {
  page: CMSPageItem;
  onBack: () => void;
  onSave?: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  CATEGORIES                                                                */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const CATEGORIES: CategoryDef[] = [
  { id: 'basic', label: 'پایه', emoji: '🔹', color: 'text-gold' },
  { id: 'content', label: 'محتوا', emoji: '🔹', color: 'text-emerald-400' },
  { id: 'landing', label: 'لندینگ', emoji: '🔹', color: 'text-amber-400' },
  { id: 'media', label: 'رسانه', emoji: '🔹', color: 'text-rose-400' },
];

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  WIDGET REGISTRY (33 widgets)                                              */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const WIDGET_REGISTRY: WidgetDef[] = [
  // ── BASIC (13) ──
  {
    type: 'heading', label: 'عنوان', category: 'basic', icon: Type, emoji: '🔤',
    defaultProps: { text: 'عنوان بخش', tag: 'h2', alignment: 'center', color: '#ffffff', fontSize: '24' },
    propFields: [
      { key: 'text', label: 'متن عنوان', type: 'text', placeholder: 'عنوان را وارد کنید' },
      { key: 'tag', label: 'تگ', type: 'select', options: [
        { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' }, { label: 'H6', value: 'h6' },
      ]},
      { key: 'alignment', label: 'تراز', type: 'select', options: [
        { label: 'چپ', value: 'left' }, { label: 'وسط', value: 'center' }, { label: 'راست', value: 'right' },
      ]},
      { key: 'color', label: 'رنگ', type: 'color' },
      { key: 'fontSize', label: 'اندازه فونت (px)', type: 'number', min: 12, max: 72 },
    ],
  },
  {
    type: 'text-editor', label: 'ویرایشگر متن', category: 'basic', icon: AlignLeft, emoji: '📝',
    defaultProps: { content: '<p>متن خود را اینجا بنویسید...</p>', fontSize: '16', color: '#e2e8f0', alignment: 'right' },
    propFields: [
      { key: 'content', label: 'محتوا (HTML)', type: 'textarea', placeholder: '<p>متن...</p>' },
      { key: 'fontSize', label: 'اندازه فونت (px)', type: 'number', min: 10, max: 32 },
      { key: 'color', label: 'رنگ متن', type: 'color' },
      { key: 'alignment', label: 'تراز', type: 'select', options: [
        { label: 'چپ', value: 'left' }, { label: 'وسط', value: 'center' }, { label: 'راست', value: 'right' },
      ]},
    ],
  },
  {
    type: 'image', label: 'تصویر', category: 'basic', icon: Image, emoji: '🖼️',
    defaultProps: { url: '', alt: 'تصویر', caption: '', link: '', objectFit: 'cover', borderRadius: '12' },
    propFields: [
      { key: 'url', label: 'آدرس تصویر', type: 'text', placeholder: 'https://...' },
      { key: 'alt', label: 'متن جایگزین', type: 'text' },
      { key: 'caption', label: 'عنوان', type: 'text' },
      { key: 'link', label: 'لینک', type: 'text', placeholder: 'https://...' },
      { key: 'objectFit', label: 'نمایش', type: 'select', options: [
        { label: 'پر کردن', value: 'cover' }, { label: 'جای‌گیری', value: 'contain' }, { label: 'کشیده', value: 'fill' },
      ]},
      { key: 'borderRadius', label: 'گردی گوشه (px)', type: 'number', min: 0, max: 50 },
    ],
  },
  {
    type: 'video', label: 'ویدئو', category: 'basic', icon: Video, emoji: '🎬',
    defaultProps: { url: '', autoplay: false, muted: true, aspectRatio: '16/9' },
    propFields: [
      { key: 'url', label: 'آدرس ویدئو', type: 'text', placeholder: 'YouTube/Vimeo/MP4 URL' },
      { key: 'autoplay', label: 'پخش خودکار', type: 'switch' },
      { key: 'muted', label: 'بی‌صدا', type: 'switch' },
      { key: 'aspectRatio', label: 'نسبت تصویر', type: 'select', options: [
        { label: '16:9', value: '16/9' }, { label: '4:3', value: '4/3' }, { label: '1:1', value: '1/1' },
      ]},
    ],
  },
  {
    type: 'button', label: 'دکمه', category: 'basic', icon: MousePointerClick, emoji: '🔘',
    defaultProps: { text: 'کلیک کنید', link: '#', variant: 'solid', size: 'md', fullWidth: false, rounded: true },
    propFields: [
      { key: 'text', label: 'متن دکمه', type: 'text' },
      { key: 'link', label: 'لینک', type: 'text', placeholder: 'https://...' },
      { key: 'variant', label: 'سبک', type: 'select', options: [
        { label: 'توپر', value: 'solid' }, { label: 'حاشیه‌ای', value: 'outline' }, { label: 'شیشه‌ای', value: 'ghost' },
      ]},
      { key: 'size', label: 'اندازه', type: 'select', options: [
        { label: 'کوچک', value: 'sm' }, { label: 'متوسط', value: 'md' }, { label: 'بزرگ', value: 'lg' },
      ]},
      { key: 'fullWidth', label: 'عرض کامل', type: 'switch' },
      { key: 'rounded', label: 'گردی گوشه', type: 'switch' },
    ],
  },
  {
    type: 'spacer', label: 'فاصله‌گذار', category: 'basic', icon: Minus, emoji: '↕️',
    defaultProps: { height: '40' },
    propFields: [
      { key: 'height', label: 'ارتفاع (px)', type: 'number', min: 8, max: 200 },
    ],
  },
  {
    type: 'divider', label: 'خط جداکننده', category: 'basic', icon: Minus, emoji: '➖',
    defaultProps: { style: 'solid', color: '#D4AF37', weight: '1', width: '100' },
    propFields: [
      { key: 'style', label: 'سبک', type: 'select', options: [
        { label: 'پیوسته', value: 'solid' }, { label: 'خط‌چین', value: 'dashed' }, { label: 'نقطه‌چین', value: 'dotted' },
      ]},
      { key: 'color', label: 'رنگ', type: 'color' },
      { key: 'weight', label: 'ضخامت (px)', type: 'number', min: 1, max: 5 },
      { key: 'width', label: 'عرض (%)', type: 'number', min: 10, max: 100 },
    ],
  },
  {
    type: 'icon', label: 'آیکون', category: 'basic', icon: Star, emoji: '⭐',
    defaultProps: { name: 'Star', size: '24', color: '#D4AF37', alignment: 'center' },
    propFields: [
      { key: 'name', label: 'نام آیکون (Lucide)', type: 'text', placeholder: 'Star, Shield, Heart...' },
      { key: 'size', label: 'اندازه (px)', type: 'number', min: 12, max: 96 },
      { key: 'color', label: 'رنگ', type: 'color' },
      { key: 'alignment', label: 'تراز', type: 'select', options: [
        { label: 'چپ', value: 'left' }, { label: 'وسط', value: 'center' }, { label: 'راست', value: 'right' },
      ]},
    ],
  },
  {
    type: 'icon-list', label: 'لیست آیکون', category: 'basic', icon: List, emoji: '📋',
    defaultProps: { items: [{ icon: 'Check', text: 'مورد اول' }, { icon: 'Check', text: 'مورد دوم' }], color: '#D4AF37', iconSize: '18' },
    propFields: [
      { key: 'color', label: 'رنگ', type: 'color' },
      { key: 'iconSize', label: 'اندازه آیکون (px)', type: 'number', min: 12, max: 48 },
      {
        key: 'items', label: 'آیتم‌ها', type: 'repeater', itemLabel: 'آیتم',
        defaultItem: { icon: 'Check', text: '' },
        fields: [
          { key: 'icon', label: 'آیکون', type: 'text', placeholder: 'Check, Star...' },
          { key: 'text', label: 'متن', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'counter', label: 'شمارنده', category: 'basic', icon: BarChart3, emoji: '🔢',
    defaultProps: { startValue: '0', endValue: '1000', suffix: '+', prefix: '', duration: '2', color: '#D4AF37' },
    propFields: [
      { key: 'startValue', label: 'مقدار شروع', type: 'number' },
      { key: 'endValue', label: 'مقدار پایان', type: 'number' },
      { key: 'prefix', label: 'پیشوند', type: 'text' },
      { key: 'suffix', label: 'پسوند', type: 'text' },
      { key: 'duration', label: 'مدت زمان (ثانیه)', type: 'number', min: 1, max: 10 },
      { key: 'color', label: 'رنگ', type: 'color' },
    ],
  },
  {
    type: 'progress-bar', label: 'نوار پیشرفت', category: 'basic', icon: BarChart3, emoji: '📊',
    defaultProps: { value: '75', color: '#D4AF37', label: 'پیشرفت', height: '8', showPercentage: true },
    propFields: [
      { key: 'value', label: 'مقدار (0-100)', type: 'number', min: 0, max: 100 },
      { key: 'color', label: 'رنگ', type: 'color' },
      { key: 'label', label: 'برچسب', type: 'text' },
      { key: 'height', label: 'ارتفاع (px)', type: 'number', min: 4, max: 24 },
      { key: 'showPercentage', label: 'نمایش درصد', type: 'switch' },
    ],
  },
  {
    type: 'table', label: 'جدول', category: 'basic', icon: LayoutGrid, emoji: '📊',
    defaultProps: { headers: 'ستون ۱,ستون ۲,ستون ۳', rows: 'سلول ۱,سلول ۲,سلول ۳\nسلول ۴,سلول ۵,سلول ۶', bordered: true, striped: true },
    propFields: [
      { key: 'headers', label: 'سرستون‌ها (با کاما)', type: 'text' },
      { key: 'rows', label: 'ردیف‌ها (هر ردیف در خط جدید، سلول‌ها با کاما)', type: 'textarea' },
      { key: 'bordered', label: 'حاشیه‌دار', type: 'switch' },
      { key: 'striped', label: 'خط‌دار', type: 'switch' },
    ],
  },
  {
    type: 'alert', label: 'جعبه پیام', category: 'basic', icon: CircleHelp, emoji: '⚠️',
    defaultProps: { alertType: 'info', title: 'اطلاع', content: 'این یک پیام اطلاع‌رسانی است.' },
    propFields: [
      { key: 'alertType', label: 'نوع', type: 'select', options: [
        { label: 'اطلاع', value: 'info' }, { label: 'موفقیت', value: 'success' },
        { label: 'هشدار', value: 'warning' }, { label: 'خطا', value: 'error' },
      ]},
      { key: 'title', label: 'عنوان', type: 'text' },
      { key: 'content', label: 'محتوا', type: 'textarea' },
    ],
  },

  // ── CONTENT (10) ──
  {
    type: 'card', label: 'کارت', category: 'content', icon: Square, emoji: '🃏',
    defaultProps: { title: 'عنوان کارت', description: 'توضیحات کارت', image: '', link: '', showButton: true, buttonText: 'بیشتر بخوانید' },
    propFields: [
      { key: 'title', label: 'عنوان', type: 'text' },
      { key: 'description', label: 'توضیحات', type: 'textarea' },
      { key: 'image', label: 'تصویر', type: 'text', placeholder: 'https://...' },
      { key: 'link', label: 'لینک', type: 'text' },
      { key: 'showButton', label: 'نمایش دکمه', type: 'switch' },
      { key: 'buttonText', label: 'متن دکمه', type: 'text' },
    ],
  },
  {
    type: 'team-member', label: 'عضو تیم', category: 'content', icon: Users, emoji: '👤',
    defaultProps: { name: 'نام شخص', role: 'مدیر عامل', image: '', bio: 'بیوگرافی کوتاه...', socialLinks: [{ platform: 'linkedin', url: '#' }] },
    propFields: [
      { key: 'name', label: 'نام', type: 'text' },
      { key: 'role', label: 'نقش', type: 'text' },
      { key: 'image', label: 'تصویر', type: 'text', placeholder: 'https://...' },
      { key: 'bio', label: 'بیوگرافی', type: 'textarea' },
      {
        key: 'socialLinks', label: 'لینک‌های اجتماعی', type: 'repeater', itemLabel: 'شبکه اجتماعی',
        defaultItem: { platform: 'linkedin', url: '#' },
        fields: [
          { key: 'platform', label: 'پلتفرم', type: 'select', options: [
            { label: 'لینکدین', value: 'linkedin' }, { label: 'توییتر', value: 'twitter' },
            { label: 'اینستاگرام', value: 'instagram' }, { label: 'تلگرام', value: 'telegram' },
          ]},
          { key: 'url', label: 'لینک', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'testimonial', label: 'نظر مشتری', category: 'content', icon: MessageSquareQuote, emoji: '💬',
    defaultProps: { name: 'نام شخص', role: 'کاربر', text: 'نظر بسیار عالی بود!', rating: '5', avatar: '' },
    propFields: [
      { key: 'name', label: 'نام', type: 'text' },
      { key: 'role', label: 'نقش', type: 'text' },
      { key: 'text', label: 'متن نظر', type: 'textarea' },
      { key: 'rating', label: 'امتیاز (1-5)', type: 'number', min: 1, max: 5 },
      { key: 'avatar', label: 'آواتار', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    type: 'testimonials-carousel', label: 'کاروسل نظرات', category: 'content', icon: MessageSquareQuote, emoji: '💬',
    defaultProps: { items: [{ name: 'نام ۱', role: 'کاربر', text: 'نظر اول', rating: '5', avatar: '' }, { name: 'نام ۲', role: 'کاربر', text: 'نظر دوم', rating: '4', avatar: '' }] },
    propFields: [
      {
        key: 'items', label: 'نظرات', type: 'repeater', itemLabel: 'نظر',
        defaultItem: { name: '', role: '', text: '', rating: '5', avatar: '' },
        fields: [
          { key: 'name', label: 'نام', type: 'text' },
          { key: 'role', label: 'نقش', type: 'text' },
          { key: 'text', label: 'متن', type: 'textarea' },
          { key: 'rating', label: 'امتیاز', type: 'number', min: 1, max: 5 },
          { key: 'avatar', label: 'آواتار', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'accordion', label: 'آکاردئون', category: 'content', icon: Layers, emoji: '📚',
    defaultProps: { items: [{ title: 'سوال اول؟', content: 'پاسخ سوال اول' }, { title: 'سوال دوم؟', content: 'پاسخ سوال دوم' }], allowMultiple: false },
    propFields: [
      { key: 'allowMultiple', label: 'باز شدن همزمان', type: 'switch' },
      {
        key: 'items', label: 'آیتم‌ها', type: 'repeater', itemLabel: 'سوال/پاسخ',
        defaultItem: { title: '', content: '' },
        fields: [
          { key: 'title', label: 'عنوان', type: 'text' },
          { key: 'content', label: 'محتوا', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'pricing-card', label: 'کارت قیمت', category: 'content', icon: CreditCard, emoji: '💎',
    defaultProps: { name: 'پرو حرفه‌ای', price: '۹۹', period: 'ماهانه', features: 'ویژگی ۱\nویژگی ۲\nویژگی ۳', isFeatured: true, buttonText: 'شروع کنید', link: '#' },
    propFields: [
      { key: 'name', label: 'نام پلن', type: 'text' },
      { key: 'price', label: 'قیمت', type: 'text' },
      { key: 'period', label: 'دوره', type: 'text' },
      { key: 'features', label: 'ویژگی‌ها (هر خط یک ویژگی)', type: 'textarea' },
      { key: 'isFeatured', label: 'پیشنهادی', type: 'switch' },
      { key: 'buttonText', label: 'متن دکمه', type: 'text' },
      { key: 'link', label: 'لینک', type: 'text' },
    ],
  },
  {
    type: 'pricing-table', label: 'جدول قیمت', category: 'content', icon: CreditCard, emoji: '💰',
    defaultProps: { items: [{ name: 'پایه', price: 'رایگان', period: 'ماهانه', features: 'ویژگی ۱', isFeatured: false, buttonText: 'شروع', link: '#' }] },
    propFields: [
      {
        key: 'items', label: 'پلن‌ها', type: 'repeater', itemLabel: 'پلن',
        defaultItem: { name: '', price: '', period: '', features: '', isFeatured: false, buttonText: '', link: '#' },
        fields: [
          { key: 'name', label: 'نام', type: 'text' },
          { key: 'price', label: 'قیمت', type: 'text' },
          { key: 'period', label: 'دوره', type: 'text' },
          { key: 'features', label: 'ویژگی‌ها (هر خط یک مورد)', type: 'textarea' },
          { key: 'isFeatured', label: 'پیشنهادی', type: 'switch' },
          { key: 'buttonText', label: 'متن دکمه', type: 'text' },
          { key: 'link', label: 'لینک', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'timeline', label: 'تایم‌لاین', category: 'content', icon: Clock, emoji: '📅',
    defaultProps: { items: [{ title: 'گام اول', description: 'توضیح گام اول', date: '۱۴۰۴/۰۱', icon: 'Check' }], direction: 'vertical' },
    propFields: [
      { key: 'direction', label: 'جهت', type: 'select', options: [
        { label: 'عمودی', value: 'vertical' }, { label: 'افقی', value: 'horizontal' },
      ]},
      {
        key: 'items', label: 'مراحل', type: 'repeater', itemLabel: 'مرحله',
        defaultItem: { title: '', description: '', date: '', icon: 'Check' },
        fields: [
          { key: 'title', label: 'عنوان', type: 'text' },
          { key: 'description', label: 'توضیحات', type: 'textarea' },
          { key: 'date', label: 'تاریخ', type: 'text' },
          { key: 'icon', label: 'آیکون', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'gallery', label: 'گالری تصاویر', category: 'content', icon: GalleryHorizontalEnd, emoji: '🖼️',
    defaultProps: { items: [{ url: '', caption: 'تصویر ۱' }], columns: '3', gap: '8' },
    propFields: [
      { key: 'columns', label: 'تعداد ستون', type: 'select', options: [
        { label: '۲ ستون', value: '2' }, { label: '۳ ستون', value: '3' }, { label: '۴ ستون', value: '4' },
      ]},
      { key: 'gap', label: 'فاصله (px)', type: 'number', min: 0, max: 24 },
      {
        key: 'items', label: 'تصاویر', type: 'repeater', itemLabel: 'تصویر',
        defaultItem: { url: '', caption: '' },
        fields: [
          { key: 'url', label: 'آدرس تصویر', type: 'text' },
          { key: 'caption', label: 'عنوان', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'tabs', label: 'تب‌ها', category: 'content', icon: LayoutGrid, emoji: '📑',
    defaultProps: { items: [{ title: 'تب اول', content: 'محتوای تب اول' }, { title: 'تب دوم', content: 'محتوای تب دوم' }], style: 'line' },
    propFields: [
      { key: 'style', label: 'سبک', type: 'select', options: [
        { label: 'خطی', value: 'line' }, { label: 'قرصی', value: 'pill' },
      ]},
      {
        key: 'items', label: 'تب‌ها', type: 'repeater', itemLabel: 'تب',
        defaultItem: { title: '', content: '' },
        fields: [
          { key: 'title', label: 'عنوان', type: 'text' },
          { key: 'content', label: 'محتوا', type: 'textarea' },
        ],
      },
    ],
  },

  // ── LANDING (8) ──
  {
    type: 'hero-section', label: 'بخش اصلی', category: 'landing', icon: Home, emoji: '🏠',
    defaultProps: { heading: 'عنوان اصلی سایت', subtitle: 'زیرعنوان توصیفی', badge: '🔥 محبوب‌ترین', primaryCtaText: 'شروع کنید', primaryCtaLink: '#', secondaryCtaText: 'بیشتر بدانید', secondaryCtaLink: '#', backgroundStyle: 'gradient', showStats: true, bgImage: '' },
    propFields: [
      { key: 'heading', label: 'عنوان اصلی', type: 'text' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'textarea' },
      { key: 'badge', label: 'برچسب', type: 'text' },
      { key: 'primaryCtaText', label: 'متن دکمه اصلی', type: 'text' },
      { key: 'primaryCtaLink', label: 'لینک دکمه اصلی', type: 'text' },
      { key: 'secondaryCtaText', label: 'متن دکمه ثانویه', type: 'text' },
      { key: 'secondaryCtaLink', label: 'لینک دکمه ثانویه', type: 'text' },
      { key: 'backgroundStyle', label: 'پس‌زمینه', type: 'select', options: [
        { label: 'گرادیان', value: 'gradient' }, { label: 'تک‌رنگ', value: 'solid' }, { label: 'تصویر', value: 'image' },
      ]},
      { key: 'showStats', label: 'نمایش آمار', type: 'switch' },
      { key: 'bgImage', label: 'تصویر پس‌زمینه', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    type: 'features-grid', label: 'ویژگی‌ها', category: 'landing', icon: Sparkles, emoji: '✨',
    defaultProps: { heading: 'ویژگی‌های ما', subtitle: 'چرا ما را انتخاب کنید؟', columns: '3', items: [{ icon: 'Shield', title: 'امنیت بالا', description: 'توضیح امنیت' }, { icon: 'Zap', title: 'سرعت بالا', description: 'توضیح سرعت' }, { icon: 'Headphones', title: 'پشتیبانی ۲۴/۷', description: 'توضیح پشتیبانی' }] },
    propFields: [
      { key: 'heading', label: 'عنوان بخش', type: 'text' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text' },
      { key: 'columns', label: 'تعداد ستون', type: 'select', options: [
        { label: '۲ ستون', value: '2' }, { label: '۳ ستون', value: '3' }, { label: '۴ ستون', value: '4' },
      ]},
      {
        key: 'items', label: 'ویژگی‌ها', type: 'repeater', itemLabel: 'ویژگی',
        defaultItem: { icon: 'Star', title: '', description: '' },
        fields: [
          { key: 'icon', label: 'آیکون (Lucide)', type: 'text' },
          { key: 'title', label: 'عنوان', type: 'text' },
          { key: 'description', label: 'توضیحات', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'steps', label: 'مراحل', category: 'landing', icon: ListOrdered, emoji: '👣',
    defaultProps: { heading: 'نحوه شروع', subtitle: 'در ۳ قدم ساده شروع کنید', items: [{ number: '1', title: 'ثبت‌نام', description: 'حساب خود را بسازید' }, { number: '2', title: 'شارژ', description: 'حساب خود را شارژ کنید' }, { number: '3', title: 'معامله', description: 'شروع به معامله کنید' }] },
    propFields: [
      { key: 'heading', label: 'عنوان بخش', type: 'text' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text' },
      {
        key: 'items', label: 'مراحل', type: 'repeater', itemLabel: 'مرحله',
        defaultItem: { number: '1', title: '', description: '' },
        fields: [
          { key: 'number', label: 'شماره', type: 'text' },
          { key: 'title', label: 'عنوان', type: 'text' },
          { key: 'description', label: 'توضیحات', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'stats-counter', label: 'آمار', category: 'landing', icon: BarChart3, emoji: '📈',
    defaultProps: { heading: 'آمار و ارقام', items: [{ value: '10000', label: 'کاربر فعال', suffix: '+', prefix: '' }], backgroundStyle: 'solid' },
    propFields: [
      { key: 'heading', label: 'عنوان بخش', type: 'text' },
      { key: 'backgroundStyle', label: 'پس‌زمینه', type: 'select', options: [
        { label: 'تک‌رنگ', value: 'solid' }, { label: 'گرادیان', value: 'gradient' },
      ]},
      {
        key: 'items', label: 'آمارها', type: 'repeater', itemLabel: 'آمار',
        defaultItem: { value: '0', label: '', suffix: '', prefix: '' },
        fields: [
          { key: 'value', label: 'مقدار', type: 'text' },
          { key: 'label', label: 'برچسب', type: 'text' },
          { key: 'prefix', label: 'پیشوند', type: 'text' },
          { key: 'suffix', label: 'پسوند', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'partners-logos', label: 'لوگوی شرکا', category: 'landing', icon: Handshake, emoji: '🤝',
    defaultProps: { heading: 'شرکای ما', columns: '4', items: [{ name: 'شرکت ۱', logo: '', link: '#' }] },
    propFields: [
      { key: 'heading', label: 'عنوان', type: 'text' },
      { key: 'columns', label: 'تعداد ستون', type: 'select', options: [
        { label: '۳ ستون', value: '3' }, { label: '۴ ستون', value: '4' },
        { label: '۵ ستون', value: '5' }, { label: '۶ ستون', value: '6' },
      ]},
      {
        key: 'items', label: 'شرکا', type: 'repeater', itemLabel: 'شریک',
        defaultItem: { name: '', logo: '', link: '#' },
        fields: [
          { key: 'name', label: 'نام', type: 'text' },
          { key: 'logo', label: 'لوگو (URL)', type: 'text' },
          { key: 'link', label: 'لینک', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'cta-section', label: 'دعوت به اقدام', category: 'landing', icon: Megaphone, emoji: '📢',
    defaultProps: { heading: 'آماده‌اید شروع کنید؟', subtitle: 'همین الان ثبت‌نام کنید', buttonText: 'شروع رایگان', buttonLink: '#', backgroundStyle: 'gradient', bgImage: '' },
    propFields: [
      { key: 'heading', label: 'عنوان', type: 'text' },
      { key: 'subtitle', label: 'زیرعنوان', type: 'text' },
      { key: 'buttonText', label: 'متن دکمه', type: 'text' },
      { key: 'buttonLink', label: 'لینک دکمه', type: 'text' },
      { key: 'backgroundStyle', label: 'پس‌زمینه', type: 'select', options: [
        { label: 'گرادیان', value: 'gradient' }, { label: 'تک‌رنگ', value: 'solid' }, { label: 'تصویر', value: 'image' },
      ]},
      { key: 'bgImage', label: 'تصویر پس‌زمینه', type: 'text' },
    ],
  },
  {
    type: 'blog-posts', label: 'مقالات وبلاگ', category: 'landing', icon: Newspaper, emoji: '📰',
    defaultProps: { heading: 'آخرین مقالات', count: '3', columns: '3' },
    propFields: [
      { key: 'heading', label: 'عنوان بخش', type: 'text' },
      { key: 'count', label: 'تعداد', type: 'select', options: [
        { label: '۳ مقاله', value: '3' }, { label: '۶ مقاله', value: '6' }, { label: '۹ مقاله', value: '9' },
      ]},
      { key: 'columns', label: 'تعداد ستون', type: 'select', options: [
        { label: '۱ ستون', value: '1' }, { label: '۲ ستون', value: '2' }, { label: '۳ ستون', value: '3' },
      ]},
    ],
  },
  {
    type: 'faq-section', label: 'سوالات متداول', category: 'landing', icon: CircleHelp, emoji: '❓',
    defaultProps: { heading: 'سوالات متداول', items: [{ question: 'سوال اول؟', answer: 'پاسخ سوال اول' }, { question: 'سوال دوم؟', answer: 'پاسخ سوال دوم' }] },
    propFields: [
      { key: 'heading', label: 'عنوان بخش', type: 'text' },
      {
        key: 'items', label: 'سوالات', type: 'repeater', itemLabel: 'سوال',
        defaultItem: { question: '', answer: '' },
        fields: [
          { key: 'question', label: 'سوال', type: 'text' },
          { key: 'answer', label: 'پاسخ', type: 'textarea' },
        ],
      },
    ],
  },

  // ── MEDIA (2) ──
  {
    type: 'image-carousel', label: 'کاروسل تصاویر', category: 'media', icon: GalleryHorizontalEnd, emoji: '🎠',
    defaultProps: { items: [{ url: '', caption: 'تصویر ۱' }, { url: '', caption: 'تصویر ۲' }], autoplay: true, interval: '3', showDots: true },
    propFields: [
      { key: 'autoplay', label: 'پخش خودکار', type: 'switch' },
      { key: 'interval', label: 'فاصله (ثانیه)', type: 'number', min: 1, max: 10 },
      { key: 'showDots', label: 'نمایش نقاط', type: 'switch' },
      {
        key: 'items', label: 'تصاویر', type: 'repeater', itemLabel: 'تصویر',
        defaultItem: { url: '', caption: '' },
        fields: [
          { key: 'url', label: 'آدرس تصویر', type: 'text' },
          { key: 'caption', label: 'عنوان', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'google-map', label: 'نقشه', category: 'media', icon: MapPin, emoji: '📍',
    defaultProps: { embedUrl: '', height: '400', borderRadius: '12' },
    propFields: [
      { key: 'embedUrl', label: 'آدرس Embed', type: 'text', placeholder: 'https://www.google.com/maps/embed?...' },
      { key: 'height', label: 'ارتفاع (px)', type: 'number', min: 200, max: 800 },
      { key: 'borderRadius', label: 'گردی گوشه (px)', type: 'number', min: 0, max: 24 },
    ],
  },
];

function getWidgetDef(type: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find(w => w.type === type);
}

function getCategoryDef(id: string): CategoryDef | undefined {
  return CATEGORIES.find(c => c.id === id);
}

function getWidgetsByCategory(categoryId: string): WidgetDef[] {
  return WIDGET_REGISTRY.filter(w => w.category === categoryId);
}

function parseComponentProps(propsStr: string): Record<string, unknown> {
  try { return JSON.parse(propsStr); }
  catch { return {}; }
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  CUSTOM SCROLLBAR                                                          */
/* ═══════════════════════════════════════════════════════════════════════════════ */

const scrollbarStyles = `
  .eb-scroll::-webkit-scrollbar { width: 5px; }
  .eb-scroll::-webkit-scrollbar-track { background: transparent; }
  .eb-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 10px; }
  .eb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
`;

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  PROP FIELD EDITOR                                                         */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function PropFieldEditor({
  field,
  value,
  onChange,
}: {
  field: PropFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const strVal = String(value ?? '');

  if (field.type === 'switch') {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
        <Label className="text-sm font-medium">{field.label}</Label>
        <Switch checked={strVal === 'true'} onCheckedChange={(v) => onChange(String(v))} />
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strVal || '#D4AF37'}
            onChange={(e) => onChange(e.target.value)}
            className="size-8 rounded-md border border-border cursor-pointer bg-transparent"
          />
          <Input
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#D4AF37"
            className="flex-1 font-mono text-xs"
            dir="ltr"
          />
        </div>
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
        >
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="min-h-[72px] resize-y text-sm"
          dir="rtl"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        <Input
          type="number"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          className="text-sm"
          dir="ltr"
        />
      </div>
    );
  }

  /* text (default) */
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{field.label}</Label>
      <Input
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="text-sm"
        dir={field.key === 'url' || field.key === 'link' || field.key === 'embedUrl' ? 'ltr' : 'rtl'}
      />
    </div>
  );
}

/* ── Repeater Editor ── */

function RepeaterEditor({
  field,
  value,
  onChange,
}: {
  field: RepeaterFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];

  const addItem = () => {
    const newItem = { ...field.defaultItem };
    onChange([...items, newItem]);
  };

  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onChange(newItems);
  };

  const updateItem = (idx: number, key: string, val: unknown) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [key]: val };
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold">{field.label}</Label>
        <Badge variant="outline" className="text-[10px] text-gold border-gold/30">
          {items.length} مورد
        </Badge>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {field.itemLabel} #{idx + 1}
            </span>
            <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-red-500/10 transition-colors">
              <X className="size-3.5 text-red-400" />
            </button>
          </div>
          {field.fields.map(f => (
            <PropFieldEditor
              key={f.key}
              field={f}
              value={item[f.key]}
              onChange={(val) => updateItem(idx, f.key, val)}
            />
          ))}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-gold/30 text-gold hover:bg-gold/10 text-xs"
        onClick={addItem}
      >
        <Plus className="size-3.5 ml-1" />
        افزودن {field.itemLabel}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  CANVAS WIDGET PREVIEW RENDERERS                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CanvasWidgetPreview({ section }: { section: BuilderSection }) {
  const { type, props } = section;
  const p = props;

  switch (type) {
    case 'heading': {
      const Tag = (p.tag as string || 'h2') as keyof JSX.IntrinsicElements;
      const fontSize = Number(p.fontSize) || 24;
      return (
        <div style={{ textAlign: (p.alignment as string) || 'center' }} className="py-4 px-6">
          <Tag
            className="font-bold leading-tight"
            style={{ color: (p.color as string) || '#fff', fontSize: `${Math.min(fontSize, 36)}px` }}
          >
            {String(p.text || 'عنوان')}
          </Tag>
        </div>
      );
    }

    case 'text-editor':
      return (
        <div
          className="py-3 px-6"
          style={{ textAlign: (p.alignment as string) || 'right', fontSize: `${Math.min(Number(p.fontSize) || 16, 18)}px`, color: (p.color as string) || '#e2e8f0' }}
          dangerouslySetInnerHTML={{ __html: String(p.content || '<p>متن...</p>') }}
        />
      );

    case 'image':
      return (
        <div className="py-3 px-6">
          {p.url ? (
            <img src={String(p.url)} alt={String(p.alt || '')} className="w-full max-h-48 object-cover mx-auto" style={{ borderRadius: `${p.borderRadius || 12}px` }} />
          ) : (
            <div className="w-full h-32 bg-muted/40 rounded-xl flex items-center justify-center border border-dashed border-border">
              <Image className="size-8 text-muted-foreground/30" />
            </div>
          )}
          {p.caption && <p className="text-center text-xs text-muted-foreground mt-2">{String(p.caption)}</p>}
        </div>
      );

    case 'video':
      return (
        <div className="py-3 px-6">
          <div className="w-full aspect-video bg-muted/30 rounded-xl flex items-center justify-center border border-border/50">
            <div className="text-center">
              <Video className="size-10 text-gold/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{p.url ? 'ویدئو بارگذاری می‌شود' : 'URL ویدئو وارد نشده'}</p>
            </div>
          </div>
        </div>
      );

    case 'button': {
      const variant = p.variant as string || 'solid';
      const size = p.size as string || 'md';
      const sizeClass = size === 'sm' ? 'px-4 py-1.5 text-xs' : size === 'lg' ? 'px-8 py-3 text-base' : 'px-6 py-2 text-sm';
      const variantClass = variant === 'outline' ? 'border border-gold/40 text-gold bg-transparent' : variant === 'ghost' ? 'text-gold bg-transparent' : 'bg-gold text-black font-bold';
      return (
        <div className="py-4 px-6 flex justify-center">
          <button className={`${sizeClass} ${variantClass} rounded-lg transition-all hover:opacity-90 ${p.fullWidth ? 'w-full' : ''}`} style={p.rounded ? {} : { borderRadius: '4px' }}>
            {String(p.text || 'دکمه')}
          </button>
        </div>
      );
    }

    case 'spacer':
      return (
        <div className="py-1 px-6">
          <div className="border-t border-dashed border-gold/20 my-1" />
          <p className="text-[10px] text-center text-muted-foreground/50">{p.height}px</p>
          <div className="border-t border-dashed border-gold/20 my-1" />
          <div style={{ height: `${Math.min(Number(p.height) || 40, 100)}px` }} />
        </div>
      );

    case 'divider':
      return (
        <div className="py-3 px-6 flex justify-center">
          <hr
            style={{
              width: `${p.width || 100}%`,
              borderTop: `${p.weight || 1}px ${p.style || 'solid'} ${p.color || '#D4AF37'}`,
            }}
          />
        </div>
      );

    case 'icon':
      return (
        <div className="py-3 px-6 flex justify-center">
          <Star className="text-gold" style={{ fontSize: `${Math.min(Number(p.size) || 24, 48)}px`, color: p.color || '#D4AF37' }} />
        </div>
      );

    case 'icon-list': {
      const items = (p.items as Array<{ icon: string; text: string }>) || [];
      return (
        <div className="py-3 px-6 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="size-4 text-gold shrink-0" />
              <span className="text-sm">{item.text || 'مورد'}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'counter':
      return (
        <div className="py-6 px-6 text-center">
          <div className="text-3xl font-bold" style={{ color: p.color || '#D4AF37' }}>
            {String(p.prefix || '')}{p.endValue || '0'}{String(p.suffix || '')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">شمارنده</p>
        </div>
      );

    case 'progress-bar': {
      const val = Number(p.value) || 0;
      return (
        <div className="py-3 px-6">
          <div className="flex justify-between mb-1">
            <span className="text-xs">{String(p.label || 'پیشرفت')}</span>
            {p.showPercentage && <span className="text-xs text-gold">{val}%</span>}
          </div>
          <div className="w-full bg-muted/50 rounded-full overflow-hidden" style={{ height: `${Math.max(Number(p.height) || 8, 4)}px` }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: p.color || '#D4AF37' }} />
          </div>
        </div>
      );
    }

    case 'table': {
      const headers = String(p.headers || '').split(',');
      const rows = String(p.rows || '').split('\n').map(r => r.split(','));
      return (
        <div className="py-3 px-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gold/20">
                {headers.map((h, i) => <th key={i} className="p-2 text-right text-gold font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                  {row.map((cell, j) => <td key={j} className="p-2">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'alert': {
      const alertType = (p.alertType as string) || 'info';
      const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'ℹ️' },
        success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '✅' },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: '⚠️' },
        error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: '❌' },
      };
      const style = colorMap[alertType] || colorMap.info;
      return (
        <div className="py-3 px-6">
          <div className={`${style.bg} ${style.border} border rounded-xl p-4`}>
            <div className="flex items-start gap-2">
              <span>{style.icon}</span>
              <div>
                <p className={`font-bold text-sm ${style.text}`}>{String(p.title || 'اطلاع')}</p>
                <p className="text-xs text-muted-foreground mt-1">{String(p.content || '')}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'card':
      return (
        <div className="py-3 px-6">
          <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
            {p.image && <img src={String(p.image)} alt={String(p.title || 'card image')} className="w-full h-24 object-cover rounded-lg mb-3" />}
            <h4 className="font-bold text-sm mb-1">{String(p.title || 'عنوان کارت')}</h4>
            <p className="text-xs text-muted-foreground mb-3">{String(p.description || 'توضیحات')}</p>
            {p.showButton && (
              <span className="text-gold text-xs font-medium">{String(p.buttonText || 'بیشتر بخوانید')} ←</span>
            )}
          </div>
        </div>
      );

    case 'team-member':
      return (
        <div className="py-3 px-6">
          <div className="text-center bg-muted/20 rounded-xl p-6 border border-border/50">
            <div className="w-16 h-16 rounded-full bg-gold/20 mx-auto mb-3 flex items-center justify-center">
              <Users className="size-6 text-gold/60" />
            </div>
            <h4 className="font-bold text-sm">{String(p.name || 'نام')}</h4>
            <p className="text-xs text-gold mb-2">{String(p.role || 'نقش')}</p>
            <p className="text-xs text-muted-foreground">{String(p.bio || '').slice(0, 60)}...</p>
          </div>
        </div>
      );

    case 'testimonial':
      return (
        <div className="py-3 px-6">
          <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <p className="text-sm font-bold">{String(p.name || 'نام')}</p>
                <p className="text-xs text-muted-foreground">{String(p.role || 'نقش')}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">"{String(p.text || 'متن نظر')}"</p>
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-3 ${i < Number(p.rating || 0) ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </div>
        </div>
      );

    case 'testimonials-carousel': {
      const items = (p.items as Array<Record<string, unknown>>) || [];
      return (
        <div className="py-3 px-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {items.slice(0, 3).map((item, i) => (
              <div key={i} className="min-w-[200px] bg-muted/20 rounded-xl p-3 border border-border/50">
                <p className="text-xs text-muted-foreground italic mb-2">"{String(item.text || '')}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gold/20" />
                  <span className="text-xs font-medium">{String(item.name || '')}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-center text-muted-foreground/50 mt-2">کاروسل — {items.length} نظر</p>
        </div>
      );
    }

    case 'accordion': {
      const items = (p.items as Array<{ title: string; content: string }>) || [];
      return (
        <div className="py-3 px-6 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/20">
                <span className="text-sm font-medium">{item.title || `سوال ${i + 1}`}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {item.content || 'پاسخ...'}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'pricing-card':
      return (
        <div className="py-3 px-6">
          <div className={`rounded-xl p-4 border text-center ${p.isFeatured ? 'border-gold/40 bg-gold/5' : 'border-border/50 bg-muted/20'}`}>
            {p.isFeatured && <Badge className="bg-gold text-black text-[10px] mb-2">پیشنهادی</Badge>}
            <h4 className="font-bold text-lg">{String(p.name || 'پلن')}</h4>
            <div className="text-2xl font-bold text-gold my-2">{String(p.price || '0')}<span className="text-xs text-muted-foreground mr-1">{String(p.period || '')}</span></div>
            <div className="space-y-1 text-xs text-left">
              {String(p.features || '').split('\n').map((f, i) => (
                <div key={i} className="flex items-center gap-1"><Check className="size-3 text-gold shrink-0" /><span>{f}</span></div>
              ))}
            </div>
            <button className="mt-3 w-full py-1.5 bg-gold text-black rounded-lg text-xs font-bold">{String(p.buttonText || 'شروع')}</button>
          </div>
        </div>
      );

    case 'pricing-table': {
      const items = (p.items as Array<Record<string, unknown>>) || [];
      return (
        <div className="py-3 px-6">
          <div className="grid grid-cols-3 gap-3">
            {items.slice(0, 3).map((item, i) => (
              <div key={i} className={`rounded-xl p-3 border text-center ${item.isFeatured ? 'border-gold/40 bg-gold/5' : 'border-border/50 bg-muted/20'}`}>
                <p className="text-sm font-bold">{String(item.name || '')}</p>
                <p className="text-lg font-bold text-gold">{String(item.price || '')}</p>
                <p className="text-[10px] text-muted-foreground">{String(item.period || '')}</p>
              </div>
            ))}
          </div>
          {items.length > 3 && <p className="text-[10px] text-center text-muted-foreground/50 mt-2">+{items.length - 3} پلن دیگر</p>}
        </div>
      );
    }

    case 'timeline': {
      const items = (p.items as Array<{ title: string; description: string; date: string }>) || [];
      return (
        <div className="py-3 px-6">
          <div className="relative space-y-4 border-r-2 border-gold/20 pr-4">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -right-[21px] top-1 size-3 rounded-full bg-gold/40 border-2 border-card" />
                <p className="text-xs text-muted-foreground">{item.date || ''}</p>
                <p className="text-sm font-medium">{item.title || ''}</p>
                <p className="text-xs text-muted-foreground">{String(item.description || '').slice(0, 60)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'gallery': {
      const items = (p.items as Array<{ url: string }>) || [];
      const cols = Number(p.columns) || 3;
      return (
        <div className="py-3 px-6">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {items.length > 0 ? items.slice(0, cols * 2).map((item, i) => (
              <div key={i} className="aspect-square bg-muted/30 rounded-lg overflow-hidden">
                {item.url ? <img src={item.url} alt={String(item.caption || 'gallery image')} className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center"><Image className="size-4 text-muted-foreground/30" /></div>
                )}
              </div>
            )) : Array.from({ length: cols * 2 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center">
                <Image className="size-4 text-muted-foreground/20" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'tabs': {
      const items = (p.items as Array<{ title: string; content: string }>) || [];
      return (
        <div className="py-3 px-6">
          <div className="flex gap-1 mb-3">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-md text-xs ${i === 0 ? 'bg-gold/10 text-gold' : 'text-muted-foreground'}`}>
                {item.title || `تب ${i + 1}`}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{items[0]?.content || 'محتوای تب...'}</p>
        </div>
      );
    }

    case 'hero-section':
      return (
        <div className="py-8 px-6 text-center bg-gradient-to-b from-gold/5 to-transparent rounded-xl">
          {p.badge && <Badge className="bg-gold/10 text-gold text-[10px] mb-3">{String(p.badge)}</Badge>}
          <h1 className="text-xl font-bold mb-2">{String(p.heading || 'عنوان اصلی')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{String(p.subtitle || 'زیرعنوان')}</p>
          <div className="flex justify-center gap-2">
            <button className="px-4 py-1.5 bg-gold text-black rounded-lg text-xs font-bold">{String(p.primaryCtaText || 'شروع')}</button>
            {p.secondaryCtaText && <button className="px-4 py-1.5 border border-border rounded-lg text-xs">{String(p.secondaryCtaText)}</button>}
          </div>
        </div>
      );

    case 'features-grid': {
      const items = (p.items as Array<{ icon: string; title: string; description: string }>) || [];
      const cols = Number(p.columns) || 3;
      return (
        <div className="py-3 px-6">
          <h3 className="text-center font-bold text-sm mb-1">{String(p.heading || 'ویژگی‌ها')}</h3>
          <p className="text-center text-xs text-muted-foreground mb-4">{String(p.subtitle || '')}</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)` }}>
            {items.slice(0, 6).map((item, i) => (
              <div key={i} className="bg-muted/20 rounded-xl p-3 border border-border/30 text-center">
                <Sparkles className="size-5 text-gold mx-auto mb-2" />
                <p className="text-xs font-bold mb-1">{item.title || 'ویژگی'}</p>
                <p className="text-[10px] text-muted-foreground">{String(item.description || '').slice(0, 40)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'steps': {
      const items = (p.items as Array<{ number: string; title: string; description: string }>) || [];
      return (
        <div className="py-3 px-6">
          <h3 className="text-center font-bold text-sm mb-4">{String(p.heading || 'مراحل')}</h3>
          <div className="flex items-center justify-center gap-4">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className="text-center flex-1">
                <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 mx-auto flex items-center justify-center text-gold font-bold text-sm mb-2">
                  {item.number || i + 1}
                </div>
                <p className="text-xs font-bold">{item.title || 'مرحله'}</p>
                <p className="text-[10px] text-muted-foreground">{String(item.description || '').slice(0, 30)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'stats-counter': {
      const items = (p.items as Array<{ value: string; label: string; suffix: string; prefix: string }>) || [];
      return (
        <div className="py-4 px-6 bg-gold/5 rounded-xl">
          <h3 className="text-center font-bold text-sm mb-4">{String(p.heading || 'آمار')}</h3>
          <div className="grid grid-cols-2 gap-4">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-bold text-gold">{item.prefix || ''}{item.value || '0'}{item.suffix || ''}</p>
                <p className="text-[10px] text-muted-foreground">{item.label || ''}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'partners-logos': {
      const items = (p.items as Array<{ name: string; logo: string }>) || [];
      const cols = Number(p.columns) || 4;
      return (
        <div className="py-3 px-6 text-center">
          <h3 className="font-bold text-sm mb-4">{String(p.heading || 'شرکا')}</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 6)}, 1fr)` }}>
            {items.slice(0, 6).map((item, i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-3 flex items-center justify-center border border-border/30">
                <span className="text-[10px] text-muted-foreground">{item.name || 'شریک'}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'cta-section':
      return (
        <div className="py-6 px-6 bg-gradient-to-l from-gold/10 via-gold/5 to-transparent rounded-xl text-center">
          <h3 className="font-bold text-lg mb-2">{String(p.heading || 'دعوت به اقدام')}</h3>
          <p className="text-xs text-muted-foreground mb-4">{String(p.subtitle || '')}</p>
          <button className="px-6 py-2 bg-gold text-black rounded-lg text-sm font-bold">{String(p.buttonText || 'شروع')}</button>
        </div>
      );

    case 'blog-posts':
      return (
        <div className="py-3 px-6">
          <h3 className="font-bold text-sm mb-4">{String(p.heading || 'مقالات')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: Number(p.count) || 3 }).map((_, i) => (
              <div key={i} className="bg-muted/20 rounded-xl p-3 border border-border/30">
                <div className="w-full h-16 bg-muted/40 rounded-lg mb-2" />
                <div className="h-3 bg-muted/40 rounded w-3/4 mb-1.5" />
                <div className="h-2 bg-muted/30 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq-section': {
      const items = (p.items as Array<{ question: string; answer: string }>) || [];
      return (
        <div className="py-3 px-6">
          <h3 className="text-center font-bold text-sm mb-4">{String(p.heading || 'سوالات متداول')}</h3>
          <div className="space-y-2">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className="border border-border/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CircleHelp className="size-4 text-gold shrink-0" />
                  <span className="text-xs font-medium">{item.question || `سوال ${i + 1}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'image-carousel': {
      const items = (p.items as Array<{ url: string; caption: string }>) || [];
      return (
        <div className="py-3 px-6">
          <div className="flex gap-2 overflow-x-auto">
            {items.length > 0 ? items.slice(0, 4).map((item, i) => (
              <div key={i} className="min-w-[150px] h-24 bg-muted/30 rounded-lg flex items-center justify-center shrink-0">
                {item.url ? <img src={item.url} alt={String(item.caption || 'carousel image')} className="w-full h-full object-cover rounded-lg" /> : (
                  <Image className="size-6 text-muted-foreground/30" />
                )}
              </div>
            )) : <div className="w-full h-24 bg-muted/20 rounded-lg flex items-center justify-center"><Image className="size-8 text-muted-foreground/20" /></div>}
          </div>
          <div className="flex justify-center gap-1 mt-2">
            {items.slice(0, 4).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-gold' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>
        </div>
      );
    }

    case 'google-map':
      return (
        <div className="py-3 px-6">
          <div className="w-full rounded-xl overflow-hidden border border-border/50" style={{ height: `${Math.min(Number(p.height) || 200, 300)}px` }}>
            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="size-8 text-gold/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{p.embedUrl ? 'نقشه بارگذاری می‌شود' : 'URL نقشه وارد نشده'}</p>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="py-4 px-6 text-center text-xs text-muted-foreground">
          ویدجت ناشناخته: {type}
        </div>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  LEFT PANEL — WIDGET PALETTE                                               */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function WidgetPalette({ onDragStart }: { onDragStart: (e: React.DragEvent, type: string) => void }) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['basic']));

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="جستجوی ویدجت..."
          className="h-8 text-xs pr-8 bg-muted/30 border-border/50"
        />
      </div>

      {CATEGORIES.map(cat => {
        const widgets = getWidgetsByCategory(cat.id);
        const isOpen = openCategories.has(cat.id);
        return (
          <div key={cat.id}>
            <button
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <span className={`text-xs font-bold ${cat.color}`}>
                {cat.emoji} {cat.label}
              </span>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px] text-muted-foreground">{widgets.length}</Badge>
                {isOpen ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
              </div>
            </button>

            {isOpen && (
              <div className="grid grid-cols-2 gap-1.5 mt-1.5 ml-1">
                {widgets.map(widget => (
                  <TooltipProvider key={widget.type} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, widget.type)}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-transparent hover:border-gold/30 hover:bg-gold/5 cursor-grab active:cursor-grabbing transition-all group"
                        >
                          <span className="text-lg">{widget.emoji}</span>
                          <span className="text-[10px] text-muted-foreground group-hover:text-gold text-center leading-tight font-medium">
                            {widget.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        <p>{widget.emoji} {widget.label}</p>
                        <p className="text-muted-foreground">بکشید و رها کنید</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  CANVAS WIDGET ITEM                                                        */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function CanvasWidget({
  section,
  index,
  total,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onDuplicate,
}: {
  section: BuilderSection;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
}) {
  const widgetDef = getWidgetDef(section.type);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative group/canvas-widget transition-all duration-200',
        isSelected ? 'ring-2 ring-gold/60 ring-offset-1 ring-offset-background' : '',
        !section.isVisible && 'opacity-40',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Widget Toolbar */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-0 right-0 left-0 z-20 flex items-center justify-between px-1">
          <div className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm rounded-b-lg rounded-t-none border border-t-0 border-border/50 px-1 py-0.5 shadow-lg">
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ fromIndex: index }));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <GripVertical className="size-3 text-muted-foreground" />
            </div>
            <button type="button" onClick={onSelect} className="p-1 hover:bg-gold/10 rounded" title="ویرایش">
              <Settings className="size-3 text-gold" />
            </button>
            <button type="button" onClick={onDuplicate} className="p-1 hover:bg-muted/50 rounded" title="کپی">
              <Copy className="size-3 text-muted-foreground" />
            </button>
            <button type="button" onClick={onToggleVisibility} className="p-1 hover:bg-muted/50 rounded" title={section.isVisible ? 'مخفی' : 'نمایش'}>
              {section.isVisible ? <Eye className="size-3 text-muted-foreground" /> : <EyeOff className="size-3 text-muted-foreground" />}
            </button>
            <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-1 hover:bg-muted/50 rounded disabled:opacity-20" title="بالا">
              <MoveUp className="size-3 text-muted-foreground" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="p-1 hover:bg-muted/50 rounded disabled:opacity-20" title="پایین">
              <MoveDown className="size-3 text-muted-foreground" />
            </button>
            <button type="button" onClick={onDelete} className="p-1 hover:bg-red-500/10 rounded" title="حذف">
              <Trash2 className="size-3 text-red-400" />
            </button>
          </div>

          <div className="bg-gold/90 text-black rounded-b-lg rounded-t-none px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
            <span>{widgetDef?.emoji}</span>
            <span>{widgetDef?.label || section.type}</span>
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div
        className="bg-card/50 border border-border/30 rounded-xl overflow-hidden min-h-[40px] cursor-pointer hover:border-border/60 transition-all"
        onClick={onSelect}
      >
        <CanvasWidgetPreview section={section} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  RIGHT PANEL — PROPERTIES EDITOR                                           */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function PropertiesPanel({
  section,
  onUpdate,
  onDelete,
}: {
  section: BuilderSection | null;
  onUpdate: (key: string, value: unknown) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Settings className="size-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">ویدجتی انتخاب نشده</p>
        <p className="text-xs text-muted-foreground/60 mt-1">یک ویدجت از بوم انتخاب کنید</p>
      </div>
    );
  }

  const widgetDef = getWidgetDef(section.type);
  if (!widgetDef) return null;

  return (
    <div className="space-y-4">
      {/* Widget Header */}
      <div className="p-3 rounded-xl bg-gold/5 border border-gold/15">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{widgetDef.emoji}</span>
          <span className="text-sm font-bold">{widgetDef.label}</span>
        </div>
        <Badge variant="outline" className="text-[10px] text-gold border-gold/30">
          {getCategoryDef(widgetDef.category)?.label}
        </Badge>
      </div>

      <Separator />

      {/* Prop Fields */}
      <div className="space-y-3">
        {widgetDef.propFields.map(field => (
          <div key={field.key}>
            {field.type === 'repeater' ? (
              <RepeaterEditor
                field={field as RepeaterFieldDef}
                value={section.props[field.key]}
                onChange={(val) => onUpdate(field.key, val)}
              />
            ) : (
              <PropFieldEditor
                field={field as PropFieldDef}
                value={section.props[field.key]}
                onChange={(val) => onUpdate(field.key, val)}
              />
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Visibility Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
        <Label className="text-sm font-medium">نمایش در صفحه</Label>
        <Switch checked={section.isVisible} onCheckedChange={(v) => onUpdate('__visible', v)} />
      </div>

      {/* Delete */}
      {confirmDelete ? (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 mb-2">آیا از حذف مطمئنید؟</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="flex-1 text-xs h-7" onClick={() => { onDelete(); setConfirmDelete(false); }}>
              حذف شود
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setConfirmDelete(false)}>
              انصراف
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-red-500/20 text-red-400 hover:bg-red-500/5 text-xs"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-3.5 ml-1" />
          حذف ویدجت
        </Button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  TOP BAR                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function TopBar({
  pageTitle,
  onPageTitleChange,
  deviceMode,
  onDeviceChange,
  saving,
  onBack,
  onSave,
  sectionCount,
  isPublished,
  onTogglePublish,
}: {
  pageTitle: string;
  onPageTitleChange: (v: string) => void;
  deviceMode: DeviceMode;
  onDeviceChange: (m: DeviceMode) => void;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  sectionCount: number;
  isPublished: boolean;
  onTogglePublish: () => void;
}) {
  return (
    <div className="h-14 bg-card/90 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 shrink-0 z-30">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-gold hover:bg-gold/10 shrink-0" onClick={onBack}>
                <ArrowRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>بازگشت</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="min-w-0">
          <input
            value={pageTitle}
            onChange={(e) => onPageTitleChange(e.target.value)}
            className="text-sm font-bold bg-transparent border-none outline-none w-full max-w-[200px] truncate"
            dir="rtl"
          />
          <p className="text-[10px] text-muted-foreground">{sectionCount} ویدجت</p>
        </div>
      </div>

      {/* Center: Device Toggle */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
        {([
          { mode: 'desktop' as DeviceMode, icon: Monitor, label: 'دسکتاپ' },
          { mode: 'tablet' as DeviceMode, icon: Tablet, label: 'تبلت' },
          { mode: 'mobile' as DeviceMode, icon: Smartphone, label: 'موبایل' },
        ]).map(({ mode, icon: Icon, label }) => (
          <TooltipProvider key={mode} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onDeviceChange(mode)}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    deviceMode === mode ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Right: Publish + Save */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 mr-2">
          <Switch
            checked={isPublished}
            onCheckedChange={onTogglePublish}
            className="data-[state=checked]:bg-emerald-500"
          />
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {isPublished ? 'منتشر شده' : 'پیش‌نویس'}
          </span>
        </div>

        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="bg-gold hover:bg-gold-dark text-black font-bold text-xs h-8 px-4"
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ذخیره...
            </span>
          ) : (
            <>
              <Save className="size-3.5 ml-1.5" />
              ذخیره
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  PREVIEW DIALOG                                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

function PreviewDialog({
  open,
  onOpenChange,
  sections,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sections: BuilderSection[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir="rtl">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <DialogTitle className="text-sm font-bold">پیش‌نمایش صفحه</DialogTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            <X className="size-4 ml-1" /> بستن
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] eb-scroll bg-background p-6 space-y-4">
          {sections.filter(s => s.isVisible).length === 0 ? (
            <div className="text-center py-20">
              <Eye className="size-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">صفحه خالی است</p>
            </div>
          ) : (
            sections.filter(s => s.isVisible).map(section => (
              <div key={section.id} className="min-h-[40px]">
                <CanvasWidgetPreview section={section} />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function ElementorBuilder({ page, onBack, onSave }: ElementorBuilderProps) {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [sections, setSections] = useState<BuilderSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [saving, setSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState(page.title);
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const selectedSection = sections.find(s => s.id === selectedId) || null;

  /* ── Load Components ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/cms/components?pageId=${page.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const built: BuilderSection[] = (data.components || []).map((c: CMSComponentItem) => ({
              id: c.id,
              type: c.type,
              order: c.order,
              props: parseComponentProps(c.props),
              isVisible: true,
            }));
            setSections(built);
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [page.id]);

  /* ── Add Widget ── */
  const addWidget = useCallback((type: string, atIndex?: number) => {
    const widgetDef = getWidgetDef(type);
    if (!widgetDef) return;

    const newSection: BuilderSection = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      order: atIndex ?? sections.length,
      props: { ...widgetDef.defaultProps },
      isVisible: true,
    };

    setSections(prev => {
      const next = [...prev];
      if (atIndex !== undefined) {
        next.splice(atIndex, 0, newSection);
      } else {
        next.push(newSection);
      }
      return next.map((s, i) => ({ ...s, order: i }));
    });
    setSelectedId(newSection.id);
  }, [sections.length]);

  /* ── Update Section Prop ── */
  const updateSectionProp = useCallback((sectionId: string, key: string, value: unknown) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      if (key === '__visible') return { ...s, isVisible: value as boolean };
      return { ...s, props: { ...s.props, [key]: value } };
    }));
  }, []);

  /* ── Delete Section ── */
  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId).map((s, i) => ({ ...s, order: i })));
    if (selectedId === sectionId) setSelectedId(null);
  }, [selectedId]);

  /* ── Duplicate Section ── */
  const duplicateSection = useCallback((sectionId: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx === -1) return prev;
      const src = prev[idx];
      const dup: BuilderSection = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: src.type,
        order: idx + 1,
        props: JSON.parse(JSON.stringify(src.props)),
        isVisible: src.isVisible,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  /* ── Move Section ── */
  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, [sections.length]);

  /* ── Toggle Visibility ── */
  const toggleVisibility = useCallback((sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s));
  }, []);

  /* ── Drag & Drop Handlers ── */
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ widgetType: type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
  };

  const handleCanvasDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setDropIndicatorIndex(null);
      dragCounterRef.current = 0;
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDropIndicatorIndex(null);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(rawData);

      if (data.widgetType) {
        /* New widget from palette */
        const dropIdx = dropIndicatorIndex ?? sections.length;
        addWidget(data.widgetType, dropIdx);
      } else if (data.fromIndex !== undefined) {
        /* Reorder existing widget */
        const toIdx = dropIndicatorIndex ?? sections.length;
        if (data.fromIndex !== toIdx) {
          moveSection(data.fromIndex, data.fromIndex < toIdx ? toIdx - 1 : toIdx);
        }
      }
    } catch { /* ignore */ }
  };

  const handleDropZoneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicatorIndex(index);
  };

  const handleDropZoneDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicatorIndex(null);
    dragCounterRef.current = 0;

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(rawData);

      if (data.widgetType) {
        addWidget(data.widgetType, index);
      } else if (data.fromIndex !== undefined) {
        if (data.fromIndex !== index) {
          moveSection(data.fromIndex, data.fromIndex < index ? index - 1 : index);
        }
      }
    } catch { /* ignore */ }
  };

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      /* Update page meta */
      await fetch(`/api/cms/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pageTitle, isPublished }),
      });

      /* Sync components to DB */
      /* First, get existing DB component IDs */
      const existingRes = await fetch(`/api/cms/components?pageId=${page.id}`);
      const existingData = existingRes.ok ? await existingRes.json() : { components: [] };
      const existingIds = new Set((existingData.components || []).map((c: CMSComponentItem) => c.id));

      /* Determine which local sections need to be created vs updated */
      const toCreate: BuilderSection[] = [];
      const toUpdate: { id: string; order: number; props: Record<string, unknown> }[] = [];
      const toDelete: string[] = [];

      for (const section of sections) {
        if (section.id.startsWith('local_')) {
          toCreate.push(section);
        } else if (existingIds.has(section.id)) {
          toUpdate.push({ id: section.id, order: section.order, props: section.props });
        }
      }

      /* Delete removed components */
      for (const existingId of existingIds) {
        if (!sections.find(s => s.id === existingId)) {
          toDelete.push(existingId);
        }
      }

      /* Execute updates */
      if (toUpdate.length > 0) {
        await fetch('/api/cms/components', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ components: toUpdate }),
        });
      }

      /* Execute creates */
      for (const sec of toCreate) {
        await fetch('/api/cms/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: page.id, type: sec.type, props: sec.props, order: sec.order }),
        });
      }

      /* Execute deletes */
      for (const id of toDelete) {
        await fetch(`/api/cms/components?id=${id}`, { method: 'DELETE' });
      }

      /* Reload to get fresh IDs */
      const reloadRes = await fetch(`/api/cms/components?pageId=${page.id}`);
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        if (reloadData.success) {
          const rebuilt: BuilderSection[] = (reloadData.components || []).map((c: CMSComponentItem) => ({
            id: c.id,
            type: c.type,
            order: c.order,
            props: parseComponentProps(c.props),
            isVisible: true,
          }));
          /* Preserve visibility states */
          const visibilityMap = new Map(sections.map(s => [s.type + s.order, s.isVisible]));
          rebuilt.forEach(r => {
            const vis = visibilityMap.get(r.type + r.order);
            if (vis !== undefined) r.isVisible = vis;
          });
          setSections(rebuilt);
        }
      }

      addToast('صفحه با موفقیت ذخیره شد', 'success');
      onSave?.();
    } catch {
      addToast('خطا در ذخیره‌سازی', 'error');
    }
    setSaving(false);
  }, [page.id, pageTitle, isPublished, sections, addToast, onSave]);

  /* ── Device width ── */
  const canvasMaxWidth = deviceMode === 'desktop' ? '100%' : deviceMode === 'tablet' ? '768px' : '375px';

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="size-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">بارگذاری ویرایشگر...</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <TooltipProvider delayDuration={200}>
      <style>{scrollbarStyles}</style>
      <div className="fixed inset-0 bg-background z-40 flex flex-col" dir="rtl">
        {/* ── Top Bar ── */}
        <TopBar
          pageTitle={pageTitle}
          onPageTitleChange={setPageTitle}
          deviceMode={deviceMode}
          onDeviceChange={setDeviceMode}
          saving={saving}
          onBack={onBack}
          onSave={handleSave}
          sectionCount={sections.length}
          isPublished={isPublished}
          onTogglePublish={() => setIsPublished(v => !v)}
        />

        {/* ── Main Content: 3 Panels ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Widget Palette */}
          <div className="w-60 lg:w-64 shrink-0 bg-card/50 border-l border-border/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/30">
              <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-gold" />
                ویدجت‌ها
              </h3>
            </div>
            <ScrollArea className="flex-1 eb-scroll">
              <div className="p-3">
                <WidgetPalette onDragStart={handleDragStart} />
              </div>
            </ScrollArea>

            {/* Quick Add Button */}
            <div className="p-3 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gold/20 text-gold hover:bg-gold/5 text-xs"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-3.5 ml-1" />
                پیش‌نمایش
              </Button>
            </div>
          </div>

          {/* CENTER PANEL: Canvas */}
          <div className="flex-1 bg-muted/20 overflow-hidden flex items-start justify-center">
            <div className="w-full h-full overflow-y-auto eb-scroll" onDragOver={handleCanvasDragOver} onDragEnter={handleCanvasDragEnter} onDragLeave={handleCanvasDragLeave} onDrop={handleCanvasDrop}>
              <div
                ref={canvasRef}
                className="mx-auto transition-all duration-300 py-6"
                style={{ maxWidth: canvasMaxWidth, padding: deviceMode !== 'desktop' ? '24px 16px' : undefined }}
              >
                {/* Device Frame for tablet/mobile */}
                <div className={cn(
                  deviceMode !== 'desktop' && 'border border-border/50 rounded-2xl bg-card shadow-2xl overflow-hidden',
                )}>
                  {/* Canvas Header */}
                  <div className="text-center py-4 px-6">
                    <h1 className="text-lg font-bold">{pageTitle || 'بدون عنوان'}</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sections.filter(s => s.isVisible).length} ویدجت فعال از {sections.length} ویدجت
                    </p>
                  </div>

                  {/* Sections */}
                  {sections.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-gold/20 rounded-2xl m-6 p-12 text-center transition-colors"
                      onDragOver={(e) => { e.preventDefault(); setDropIndicatorIndex(0); }}
                      onDrop={(e) => handleDropZoneDrop(e, 0)}
                    >
                      <div className={cn(
                        'transition-colors',
                        dropIndicatorIndex === 0 && 'border-gold/40 bg-gold/5',
                      )}>
                        <Layers className="size-12 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">بوم خالی است</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">ویدجت‌ها را از سمت راست بکشید و رها کنید</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 px-3">
                      {/* Drop zone at top */}
                      <div
                        className={cn(
                          'h-1 rounded-full transition-all duration-200',
                          dropIndicatorIndex === 0
                            ? 'h-2 bg-gold/40'
                            : 'bg-transparent hover:bg-gold/10',
                        )}
                        onDragOver={(e) => handleDropZoneDragOver(e, 0)}
                        onDrop={(e) => handleDropZoneDrop(e, 0)}
                      />

                      {sections.map((section, index) => (
                        <React.Fragment key={section.id}>
                          <CanvasWidget
                            section={section}
                            index={index}
                            total={sections.length}
                            isSelected={selectedId === section.id}
                            onSelect={() => setSelectedId(section.id)}
                            onDelete={() => deleteSection(section.id)}
                            onMoveUp={() => moveSection(index, index - 1)}
                            onMoveDown={() => moveSection(index, index + 1)}
                            onToggleVisibility={() => toggleVisibility(section.id)}
                            onDuplicate={() => duplicateSection(section.id)}
                          />
                          {/* Drop zone after widget */}
                          <div
                            className={cn(
                              'h-1 rounded-full transition-all duration-200',
                              dropIndicatorIndex === index + 1
                                ? 'h-2 bg-gold/40'
                                : 'bg-transparent hover:bg-gold/10',
                            )}
                            onDragOver={(e) => handleDropZoneDragOver(e, index + 1)}
                            onDrop={(e) => handleDropZoneDrop(e, index + 1)}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Bottom padding */}
                  <div className="h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Properties */}
          <div className="w-72 lg:w-80 shrink-0 bg-card/50 border-r border-border/50 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/30">
              <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Settings className="size-3.5 text-gold" />
                تنظیمات
              </h3>
            </div>
            <ScrollArea className="flex-1 eb-scroll">
              <div className="p-3">
                <PropertiesPanel
                  section={selectedSection}
                  onUpdate={(key, value) => {
                    if (selectedId) updateSectionProp(selectedId, key, value);
                  }}
                  onDelete={() => {
                    if (selectedId) deleteSection(selectedId);
                  }}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Preview Dialog */}
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          sections={sections}
        />
      </div>
    </TooltipProvider>
  );
}
