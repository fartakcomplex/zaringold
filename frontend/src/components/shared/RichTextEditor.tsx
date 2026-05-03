
/* ═══════════════════════════════════════════════════════════════════════════
 *  RichTextEditor.tsx — ویرایشگر متن غنی (Word-like WYSIWYG)
 *  TipTap-based rich text editor with Persian RTL support
 *  Features: Bold, Italic, Underline, Strikethrough, Font size, Color,
 *  Highlight, Text align, Headings, Lists, Links, Undo/Redo
 * ═══════════════════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useState } from 'react';
import {useEditor, EditorContent, Editor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import {TextStyle, Color, FontSize, FontFamily} from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import {cn} from '@/lib/utils';
import {Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignRight, AlignCenter, AlignLeft, AlignJustify, List, ListOrdered, Link as LinkIcon, Unlink, Undo2, Redo2, Heading1, Heading2, Heading3, Type, Highlighter, Palette, Minus, ChevronDown, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Separator} from '@/components/ui/separator';

/* ═══════════════════════════════════════════════════════════════════════════
 *  Font Sizes
 * ═══════════════════════════════════════════════════════════════════════════ */

const FONT_SIZES = [
  { label: '۱۲', value: '12px' },
  { label: '۱۳', value: '13px' },
  { label: '۱۴', value: '14px' },
  { label: '۱۵', value: '15px' },
  { label: '۱۶', value: '16px' },
  { label: '۱۸', value: '18px' },
  { label: '۲۰', value: '20px' },
  { label: '۲۴', value: '24px' },
  { label: '۲۸', value: '28px' },
  { label: '۳۲', value: '32px' },
  { label: '۳۶', value: '36px' },
  { label: '۴۸', value: '48px' },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  Color Presets
 * ═══════════════════════════════════════════════════════════════════════════ */

const COLOR_PRESETS = [
  '#000000', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#991b1b', '#9a3412', '#854d0e', '#166534',
  '#b45309', '#1d4ed8', '#7c3aed', '#db2777',
];

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bae6fd', '#e9d5ff',
  '#fecaca', '#fed7aa', '#fbcfe8', '#e0e7ff',
  'transparent',
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  Toolbar Button Component
 * ═══════════════════════════════════════════════════════════════════════════ */

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  className,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'size-8 flex items-center justify-center rounded-md transition-all duration-150',
        'hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed',
        isActive && 'bg-gold/15 text-gold border border-gold/20',
        !isActive && 'text-foreground/60 hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="w-px h-5 bg-border mx-0.5" />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Link Dialog
 * ═══════════════════════════════════════════════════════════════════════════ */

function LinkDialog({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const prevUrl = editor.getAttributes('link').href;
  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to);
  const [url, setUrl] = useState(prevUrl || '');
  const [text, setText] = useState(selectedText || '');

  const handleApply = () => {
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div className="p-3 space-y-3 min-w-[280px]" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gold flex items-center gap-1.5">
          <LinkIcon className="size-4" />
          درج لینک
        </span>
        <button
          type="button"
          onClick={onClose}
          className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">متن نمایشی</Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن لینک..."
          className="h-8 text-sm"
          dir="rtl"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">آدرس لینک</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://..."
          className="h-8 text-sm"
          dir="ltr"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleApply}
          className="h-8 text-xs flex-1 bg-gold hover:bg-gold-dark text-white"
        >
          اعمال
        </Button>
        {editor.isActive('link') && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemove}
            className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
          >
            حذف لینک
          </Button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Toolbar Component
 * ═══════════════════════════════════════════════════════════════════════════ */

function EditorToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  const currentColor = editor.getAttributes('textStyle').color || '#000000';

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-muted/40 border-b border-border/50 rounded-t-xl">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="بازگشت (Ctrl+Z)"
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="پیش‌فرض (Ctrl+Y)"
      >
        <Redo2 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="عنوان ۱"
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="عنوان ۲"
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="عنوان ۳"
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Font Size */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="اندازه فونت"
            className="h-8 flex items-center gap-1 px-2 rounded-md text-xs text-foreground/60 hover:bg-gold/10 transition-colors min-w-[52px]"
          >
            <Type className="size-3.5" />
            <span>{FONT_SIZES.find(f => f.value === currentFontSize)?.label || '۱۶'}</span>
            <ChevronDown className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" side="bottom" align="start">
          <div className="grid grid-cols-4 gap-1">
            {FONT_SIZES.map((fs) => (
              <button
                key={fs.value}
                type="button"
                onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: fs.value }).run()}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs transition-colors',
                  currentFontSize === fs.value
                    ? 'bg-gold/15 text-gold font-medium'
                    : 'hover:bg-muted text-foreground/70'
                )}
                style={{ fontSize: fs.value }}
              >
                {fs.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="درشت (Bold)"
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="کج (Italic)"
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="زیرخط (Underline)"
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="خط‌خورده (Strikethrough)"
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Color */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="رنگ متن"
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gold/10 transition-colors relative"
          >
            <Type className="size-4 text-foreground/60" />
            <div
              className="absolute bottom-1 left-1.5 size-2.5 rounded-full border border-foreground/20"
              style={{ backgroundColor: currentColor }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="bottom" align="start">
          <div className="grid grid-cols-5 gap-1">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => editor.chain().focus().setColor(color).run()}
                className={cn(
                  'size-7 rounded-md border-2 transition-transform hover:scale-110',
                  currentColor === color ? 'border-gold scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 pt-2 border-t border-border/50">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">سفارشی:</Label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight Color */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="رنگ پس‌زمینه"
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gold/10 transition-colors"
          >
            <Highlighter className="size-4 text-foreground/60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="bottom" align="start">
          <div className="grid grid-cols-5 gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  if (color === 'transparent') {
                    editor.chain().focus().unsetHighlight().run();
                  } else {
                    editor.chain().focus().toggleHighlight({ color }).run();
                  }
                }}
                className={cn(
                  'size-7 rounded-md border-2 transition-transform hover:scale-110',
                  editor.isActive('highlight') && !color
                    ? 'border-gold'
                    : 'border-border/30'
                )}
                style={{
                  backgroundColor: color === 'transparent' ? 'white' : color,
                  backgroundImage: color === 'transparent'
                    ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
                    : 'none',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }}
                title={color === 'transparent' ? 'بدون رنگ' : color}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarDivider />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="راست‌چین"
      >
        <AlignRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="وسط‌چین"
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="چپ‌چین"
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="کشیده"
      >
        <AlignJustify className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="لیست نقطه‌ای"
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="لیست شماره‌ای"
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Horizontal Rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="خط افقی"
      >
        <Minus className="size-4" />
      </ToolbarButton>

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            title="لینک"
            className={cn(
              'size-8 flex items-center justify-center rounded-md transition-all duration-150',
              'hover:bg-gold/10',
              editor.isActive('link') && 'bg-gold/15 text-gold border border-gold/20',
              !editor.isActive('link') && 'text-foreground/60 hover:text-foreground',
            )}
          >
            <LinkIcon className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" side="bottom" align="start">
          <LinkDialog editor={editor} onClose={() => setLinkOpen(false)} />
        </PopoverContent>
      </Popover>

      {/* Unlink (quick) */}
      {editor.isActive('link') && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="حذف لینک"
          className="text-red-400 hover:text-red-500 hover:bg-red-50"
        >
          <Unlink className="size-4" />
        </ToolbarButton>
      )}

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => {
          editor.chain()
            .focus()
            .clearNodes()
            .unsetAllMarks()
            .run();
        }}
        title="پاک کردن فرمت"
      >
        <div className="size-4 flex items-center justify-center text-[10px] font-bold">
          Aa
        </div>
      </ToolbarButton>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Rich Text Editor Styles (injected via useEffect)
 * ═══════════════════════════════════════════════════════════════════════════ */

function useEditorStyles() {
  useEffect(() => {
    const styleId = 'rte-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Rich Text Editor Base Styles */
      .rte-editor .tiptap {
        min-height: 120px;
        padding: 12px 14px;
        outline: none;
        font-size: 14px;
        line-height: 1.8;
        color: var(--foreground);
        direction: rtl;
        text-align: right;
      }

      .rte-editor .tiptap p {
        margin: 0 0 0.5em 0;
      }

      .rte-editor .tiptap p:last-child {
        margin-bottom: 0;
      }

      .rte-editor .tiptap h1 {
        font-size: 1.75em;
        font-weight: 700;
        margin: 1em 0 0.5em 0;
        line-height: 1.3;
      }

      .rte-editor .tiptap h2 {
        font-size: 1.4em;
        font-weight: 700;
        margin: 0.8em 0 0.4em 0;
        line-height: 1.3;
      }

      .rte-editor .tiptap h3 {
        font-size: 1.2em;
        font-weight: 600;
        margin: 0.6em 0 0.3em 0;
        line-height: 1.4;
      }

      .rte-editor .tiptap ul,
      .rte-editor .tiptap ol {
        padding-right: 1.5em;
        padding-left: 0;
        margin: 0.5em 0;
      }

      .rte-editor .tiptap ul {
        list-style-type: disc;
      }

      .rte-editor .tiptap ol {
        list-style-type: decimal;
      }

      .rte-editor .tiptap li {
        margin: 0.25em 0;
      }

      .rte-editor .tiptap li p {
        margin: 0;
      }

      .rte-editor .tiptap a {
        color: var(--gold);
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
      }

      .rte-editor .tiptap a:hover {
        opacity: 0.8;
      }

      .rte-editor .tiptap hr {
        border: none;
        border-top: 1px solid var(--border);
        margin: 1em 0;
      }

      .rte-editor .tiptap blockquote {
        border-right: 3px solid var(--gold);
        padding-right: 1em;
        margin-right: 0;
        margin-left: 1em;
        color: var(--muted-foreground);
        font-style: italic;
      }

      .rte-editor .tiptap mark {
        border-radius: 2px;
        padding: 1px 3px;
      }

      /* Placeholder */
      .rte-editor .tiptap p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: right;
        color: var(--muted-foreground);
        pointer-events: none;
        height: 0;
        opacity: 0.5;
      }

      /* Selection */
      .rte-editor .tiptap ::selection {
        background-color: rgba(212, 175, 55, 0.2);
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Main RichTextEditor Component
 * ═══════════════════════════════════════════════════════════════════════════ */

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'متن خود را بنویسید...',
  minHeight = '120px',
  dir = 'rtl',
  className,
  readOnly = false,
}: RichTextEditorProps) {
  useEditorStyles();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false, // We use the heading extension below
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: dir === 'rtl' ? 'right' : 'left',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        dir,
      },
    },
    editable: !readOnly,
  });

  // Sync external value changes to editor (only if different)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const handleHtmlToggle = useCallback(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const textContent = editor.getText();
    // Simple toggle: if content looks like HTML, convert to text; otherwise, wrap in <p>
    if (current.startsWith('<') && current !== '<p></p>') {
      editor.commands.setContent(textContent ? `<p>${textContent}</p>` : '');
    }
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="border border-gold/20 rounded-xl bg-background animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={cn('rte-editor border border-gold/20 rounded-xl overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      {!readOnly && <EditorToolbar editor={editor} />}

      {/* Editor Content */}
      <div
        className="overflow-y-auto"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Exports
 * ═══════════════════════════════════════════════════════════════════════════ */

export { EditorToolbar, LinkDialog };
