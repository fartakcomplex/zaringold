
import React, { useEffect, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Framer Motion Compatibility Layer (CSS-based)                           */
/*  Converts initial/animate props to CSS transitions + inline styles.       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const htmlTags = [
  'div', 'span', 'section', 'main', 'header', 'footer', 'nav', 'article', 'aside',
  'button', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'form', 'input', 'label', 'img', 'figure', 'figcaption',
  'video', 'audio', 'canvas', 'svg', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code', 'hr', 'br', 'strong', 'em', 'small',
  'dialog', 'details', 'summary', 'time', 'mark', 'abbr',
];

const MOTION_PROPS = new Set([
  'transition', 'variants', 'ref',
  'whileInView', 'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileLoad',
  'layout', 'layoutId', 'layoutDependency', 'layoutScroll', 'layoutGroup',
  'drag', 'dragConstraints', 'dragElastic', 'dragMomentum', 'dragDirectionLock',
  'dragSnapToOrigin', 'dragPropagation', 'dragTransition', 'dragListener',
  'onDrag', 'onDragStart', 'onDragEnd', 'onDirectionLock', 'onAnimationStart',
  'onAnimationComplete', 'onAnimationUpdate', 'onHoverStart', 'onHoverEnd',
  'onTap', 'onTapStart', 'onTapCancel', 'onPan', 'onPanStart', 'onPanEnd',
  'onViewportEnter', 'onViewportLeave', 'viewport',
  'custom', 'inherit', 'transformTemplate',
  'as', 'onUpdate', 'onMotionStart', 'onMotionEnd',
]);

function motionStyleToCSS(style?: Record<string, any>): React.CSSProperties {
  if (!style || typeof style !== 'object') return {};
  const result: React.CSSProperties = {};
  const transforms: string[] = [];

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    switch (key) {
      case 'opacity':
        result.opacity = value as number;
        break;
      case 'x':
        transforms.push(`translateX(${value}px)`);
        break;
      case 'y':
        transforms.push(`translateY(${value}px)`);
        break;
      case 'scale':
        transforms.push(`scale(${value})`);
        break;
      case 'scaleX':
        transforms.push(`scaleX(${value})`);
        break;
      case 'scaleY':
        transforms.push(`scaleY(${value})`);
        break;
      case 'rotate':
        transforms.push(`rotate(${value}deg)`);
        break;
      case 'width':
        result.width = typeof value === 'number' ? `${value}px` : value;
        break;
      case 'height':
        result.height = typeof value === 'number' ? `${value}px` : value;
        break;
      default:
        if (typeof value === 'string') {
          (result as any)[key] = value;
        }
    }
  }

  if (transforms.length > 0) {
    result.transform = transforms.join(' ');
  }
  return result;
}

function resolveVariant(
  value: string | Record<string, any> | undefined,
  variants?: Record<string, Record<string, any>>,
): Record<string, any> | undefined {
  if (!value) return undefined;
  if (typeof value === 'string' && variants && variants[value]) return variants[value];
  if (typeof value === 'object') return value;
  return undefined;
}

function getTransitionCSS(transition?: Record<string, any>): React.CSSProperties {
  if (!transition || typeof transition !== 'object') {
    return { transition: 'opacity 0.3s ease, transform 0.3s ease' };
  }
  const duration = (transition.duration ?? 0.3) * 1000;
  const ease = transition.ease === 'linear' ? 'linear'
    : transition.ease === 'easeIn' ? 'ease-in'
    : transition.ease === 'easeOut' ? 'ease-out'
    : typeof transition.ease === 'string' ? transition.ease
    : 'cubic-bezier(0.22, 1, 0.36, 1)';
  return { transition: `opacity ${duration}ms ${ease}, transform ${duration}ms ${ease}` };
}

/* MotionDiv — core component used by all motion.X */
function MotionDiv({ tag = 'div', ...rawProps }: { tag?: string; [key: string]: any }) {
  const clean: Record<string, any> = {};
  const motionP: Record<string, any> = {};
  const externalRef = rawProps.ref;

  for (const key of Object.keys(rawProps)) {
    if (key === 'initial' || key === 'animate' || key === 'exit' || MOTION_PROPS.has(key)) {
      motionP[key] = rawProps[key];
    } else {
      clean[key] = rawProps[key];
    }
  }

  const ri = resolveVariant(motionP.initial, motionP.variants);
  const ra = resolveVariant(motionP.animate, motionP.variants);
  const [el, setEl] = useState<HTMLElement | null>(null);

  const setRef = useCallback((node: HTMLElement | null) => {
    setEl(node);
  }, []);

  useEffect(() => {
    if (!el || !ra) return;
    const rafId = requestAnimationFrame(() => {
      Object.assign(el.style, getTransitionCSS(motionP.transition), motionStyleToCSS(ra));
    });
    return () => cancelAnimationFrame(rafId);
  }, [el, ra, motionP.transition]);

  const initialCSS = ri ? motionStyleToCSS(ri) : {};
  const hasAnim = !!ri && !!ra;

  return React.createElement(tag, {
    ...clean,
    ref: setRef,
    style: {
      ...initialCSS,
      ...(hasAnim ? { transition: 'none' } : {}),
      ...(clean.style || {}),
    },
  });
}

const motionComponents: Record<string, any> = {};
for (const tag of htmlTags) {
  motionComponents[tag] = function MotionTag(props: any) {
    return <MotionDiv tag={tag} {...props} />;
  };
  motionComponents[tag].displayName = `motion.${tag}`;
}

export const motion = new Proxy(motionComponents, {
  get(target, prop: string) {
    if (typeof prop === 'string' && target[prop]) return target[prop];
    if (typeof prop === 'string') {
      target[prop] = function MotionUnknown(props: any) {
        return <MotionDiv tag="div" {...props} />;
      };
      target[prop].displayName = `motion.${prop}`;
      return target[prop];
    }
    return undefined;
  },
}) as any;

export function AnimatePresence({ children }: { children?: React.ReactNode; [key: string]: any }) {
  return <>{children}</>;
}

export const useMotionValue = (initial: number) => ({ get: () => initial, set: () => {} });
export const useTransform = (value: any, _input?: any, _output?: any) => value;
export const useSpring = (value: any, _config?: any) => value;
export const useInView = () => [null, false];
export const useAnimation = () => ({ start: () => {}, set: () => {}, stop: () => {} });
export const useAnimate = () => [{ start: () => {}, stop: () => {} }, async () => {}];
export const animate = () => {};
export const stagger = (d: number) => d;
export const delay = (s: number) => s;
export const variants = { hidden: {}, visible: {}, enter: {}, exit: {} };
