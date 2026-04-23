'use client'

import { LEVELS, LEVEL_ORDER, type UserLevel } from '@/lib/level-system'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LevelBadgeProps {
  level: string // 'none' | 'bronze' | 'silver' | 'gold' | 'diamond'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showProgress?: boolean
  onClick?: () => void
}

/* ───────────────────────── CSS Keyframe Animations ───────────────────────── */

const levelBadgeStyles = `
  /* ── badge-appear: entrance animation ── */
  @keyframes badge-appear {
    0%   { opacity: 0; transform: scale(0.6); }
    60%  { transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }

  /* ── glow-pulse: warm golden halo ── */
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 6px 2px rgba(234, 179, 8, 0.35); }
    50%      { box-shadow: 0 0 18px 6px rgba(234, 179, 8, 0.55); }
  }

  /* ── sparkle: tiny floating white dots (diamond) ── */
  @keyframes sparkle {
    0%   { opacity: 0; transform: translateY(0) scale(0); }
    30%  { opacity: 1; transform: translateY(-6px) scale(1); }
    100% { opacity: 0; transform: translateY(-18px) scale(0); }
  }

  /* ── shine: metallic light streak (silver) ── */
  @keyframes shine {
    0%   { left: -60%; }
    100% { left: 140%; }
  }
` as string // injected once via <style>

/* ───────────────────────── Helper: size map ──────────────────────────────── */

const SIZE_MAP = {
  sm: { wrapper: 'w-7 h-7 text-sm', icon: 'text-base', ring: 'ring-0' },
  md: { wrapper: 'w-9 h-9 text-lg', icon: 'text-xl', ring: 'ring-2' },
  lg: { wrapper: '', icon: 'text-3xl', ring: '' },
} as const

/* ───────────────────────── Sparkle Dots (diamond only) ───────────────────── */

function SparkleDots() {
  const dots = Array.from({ length: 5 })
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((_, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white"
          style={{
            top: `${15 + i * 18}%`,
            left: `${20 + i * 14}%`,
            animation: `sparkle ${1.4 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

/* ───────────────────────── Shine Overlay (silver only) ───────────────────── */

function ShineOverlay() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      <span
        className="absolute top-0 h-full w-1/2 -translate-y-1/2 skew-x-[-20deg]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          animation: 'shine 3s ease-in-out infinite',
        }}
      />
    </span>
  )
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════ */

export default function LevelBadge({
  level,
  size = 'md',
  showLabel = false,
  showProgress = false,
  onClick,
}: LevelBadgeProps) {
  const safeLevel = (LEVEL_ORDER.includes(level as UserLevel)
    ? (level as UserLevel)
    : 'none') as UserLevel

  const info = LEVELS[safeLevel]
  const idx = LEVEL_ORDER.indexOf(safeLevel)
  const progress = ((idx) / (LEVEL_ORDER.length - 1)) * 100
  const nextLevel =
    idx < LEVEL_ORDER.length - 1 ? LEVELS[LEVEL_ORDER[idx + 1]] : null
  const isDiamond = safeLevel === 'diamond'
  const isGold = safeLevel === 'gold'
  const isSilver = safeLevel === 'silver'
  const isBronze = safeLevel === 'bronze'

  /* ── animation class per level ── */
  const animClass = (() => {
    if (isGold) return 'animate-[glow-pulse_2.5s_ease-in-out_infinite]'
    if (isDiamond) return 'animate-[glow-pulse_2s_ease-in-out_infinite]'
    return 'animate-[badge-appear_0.5s_ease-out_both]'
  })()

  /* ── border / bg per level ── */
  const levelStyle = (() => {
    switch (safeLevel) {
      case 'none':
        return 'border-gray-600 bg-gray-800/60'
      case 'bronze':
        return 'border-amber-600 bg-gradient-to-br from-amber-900/70 to-amber-800/50'
      case 'silver':
        return 'border-gray-400 bg-gradient-to-br from-gray-500/70 to-gray-600/50'
      case 'gold':
        return 'border-yellow-500 bg-gradient-to-br from-yellow-600/70 to-amber-700/50'
      case 'diamond':
        return 'border-cyan-400 bg-gradient-to-br from-cyan-600/60 to-blue-700/60'
    }
  })()

  /* ══════════════ Small Badge ══════════════ */
  if (size === 'sm') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: levelBadgeStyles }} />
        <span
          role="img"
          aria-label={info.labelFa}
          className={`inline-flex items-center justify-center rounded-full border ${SIZE_MAP.sm.wrapper} ${levelStyle} ${animClass}`}
        >
          {info.icon}
        </span>
      </>
    )
  }

  /* ══════════════ Medium Badge (circle + tooltip) ══════════════ */
  if (size === 'md') {
    const inner = (
      <span
        role="img"
        aria-label={info.labelFa}
        onClick={onClick}
        className={`relative inline-flex cursor-pointer items-center justify-center rounded-full border ${SIZE_MAP.md.wrapper} ${SIZE_MAP.md.ring} ${levelStyle} ring-offset-2 ring-offset-background ${animClass} transition-transform hover:scale-110 active:scale-95`}
      >
        {isSilver && <ShineOverlay />}
        {isDiamond && <SparkleDots />}
        <span className={SIZE_MAP.md.icon}>{info.icon}</span>
      </span>
    )

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: levelBadgeStyles }} />
        {showLabel ? (
          <div className="animate-[badge-appear_0.5s_ease-out_both] flex items-center gap-2">
            {inner}
            <span className={`text-sm font-medium ${info.textColor}`}>
              {info.labelFa}
            </span>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>{inner}</TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <p className="font-semibold">{info.labelFa}</p>
              <p className="mt-0.5 text-[11px] opacity-80">{info.description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </>
    )
  }

  /* ══════════════ Large Badge (full card) ══════════════ */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: levelBadgeStyles }} />
      <div
        dir="rtl"
        onClick={onClick}
        className={`animate-[badge-appear_0.5s_ease-out_both] w-full cursor-pointer overflow-hidden rounded-2xl border ${levelStyle} p-5 backdrop-blur-sm transition-transform hover:scale-[1.02] active:scale-[0.98] ${animClass}`}
      >
        {/* header: icon + level name */}
        <div className="flex items-center gap-3">
          <span
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-current ${levelStyle}`}
          >
            {isSilver && <ShineOverlay />}
            {isDiamond && <SparkleDots />}
            <span className={SIZE_MAP.lg.icon}>{info.icon}</span>
          </span>
          <div className="flex-1 text-right">
            <h3 className={`text-lg font-bold ${info.textColor}`}>
              سطح {info.labelFa}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {info.description}
            </p>
          </div>
        </div>

        {/* progress bar */}
        {(showProgress || showLabel) && (
          <div className="mt-4 space-y-2">
            {/* bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-gradient-to-l from-yellow-400 to-amber-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* label row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {nextLevel ? (
                  <>
                    سطح بعدی:{' '}
                    <span className={nextLevel.textColor}>
                      {nextLevel.labelFa}
                    </span>
                  </>
                ) : (
                  <span className="text-yellow-400">بالاترین سطح ✨</span>
                )}
              </span>
              <span>
                {idx + 1} / {LEVEL_ORDER.length}
              </span>
            </div>

            {/* next level requirements */}
            {nextLevel && (
              <ul className="mr-1 mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                {nextLevel.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="mt-px text-yellow-500">◆</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  )
}
