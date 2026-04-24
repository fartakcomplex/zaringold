---
Task ID: 5
Agent: full-stack-developer
Task: Enhance HowItWorks, Calculator, Security landing page sections

Work Log:
- Read /home/z/my-project/worklog.md for previous agent context
- Read existing components: HowItWorksSection.tsx (327 lines), CalculatorSection.tsx (346 lines), SecuritySection.tsx (151 lines)
- Analyzed all available CSS utilities (60+ classes in globals.css): gold-gradient-text, glass-card-enhanced, card-spotlight, shimmer-border, badge-gold, gold-separator, gold-icon-circle, hover-lift-lg, dot-pattern, radial-gold-fade, pulse-glow, float-animation, gold-coin, cta-pulse-ring, btn-gold-gradient, btn-gold-shine, input-gold-focus, select-gold, gold-pulse, gold-sparkle, gradient-animate, etc.
- Confirmed framer-compat.tsx provides motion.div/motion.span (CSS-based transitions, no real framer-motion)
- Confirmed useTranslation() provides all needed i18n keys in both fa/en

**HowItWorksSection.tsx** — Complete rewrite (~280 lines):
  1. **StepNumberCircle component**: Larger gold gradient circles (64px desktop, 28px mobile) with outer pulsing ring, inner highlight, and dramatic shadow
  2. **GoldConnector component**: Animated gold gradient connecting lines with traveling particle (CSS keyframe animation for horizontal/vertical)
  3. **GoldSparkles component**: 6 floating gold sparkle particles with staggered delays
  4. **DesktopStepCard component**: Cards with shimmer-border, card-spotlight, floating step number on top (-top-7), larger icon containers (48px with gradient bg + border), bottom gold accent bar that expands on hover
  5. **Enhanced background**: dot-pattern + radial-gold-fade + GoldSparkles overlay
  6. **Better header**: badge-gold with pulsing green dot, larger title (up to 5xl), gold-text-shadow
  7. **Mobile timeline**: Clean vertical layout with step number circles and animated vertical GoldConnector between cards

**CalculatorSection.tsx** — Complete rewrite (~320 lines):
  1. **GoldCoinVisual component**: SVG gold coin with gradient body, inner ring, "Z" letter, highlight arc, and floating animation (gold-coin class + drop-shadow)
  2. **InfoCard component**: Reusable card with icon, title, desc, card-spotlight, hover-lift-lg
  3. **Enhanced tab bar**: Larger rounded-2xl container with border, icons in each tab (Scale, Coins, Gem), larger active gradient tab with shadow-lg
  4. **Enhanced input**: Rounded-2xl with gold/15 border, backdrop-blur-sm, gold/15 background swap icon with its own container
  5. **Animated result display**: Shimmer gradient background when result exists, animated scale-in number, decorative gradient divider lines flanking unit text
  6. **Gold coin centerpiece**: SVG GoldCoinVisual (100px) centered above info cards on desktop
  7. **Enhanced calculator card**: shimmer-border wrapper, glass-card-enhanced, rounded-3xl, stronger CTA button with shadow-xl

**SecuritySection.tsx** — Complete rewrite (~310 lines):
  1. **CentralShield component**: Large 200px central visual with rotating dashed outer ring, counter-rotating inner ring, pulsing radial glow, gradient circle with ShieldCheck icon, 4 orbiting gold dots
  2. **SecurityCard component**: shimmer-border cards with card-spotlight overlay, larger icon containers (48px with gradient bg), animated stat badge (appears on hover from top), bottom gold accent divider with Fingerprint icon, dramatic hover glow (box-shadow with 30px/60px spread)
  3. **TrustBadge component**: Animated badges with lucide icons (Building2, Award, BadgeCheck, Shield)
  4. **Trust badges strip**: Each badge has its own icon, staggered entrance animations
  5. **Bottom guarantee bar**: Gradient background strip with pulse-glow icon, insurance title+description
  6. **Enhanced header**: Shield icon in badge, larger title (up to 5xl), gold-text-shadow
  7. **Background layers**: radial-gold-fade + dot-pattern

All components:
- Keep RTL direction (dir="rtl")
- Use motion from '@/lib/framer-compat'
- Use useTranslation() for all text
- Use cn() from '@/lib/utils'
- Dev server compiled successfully (✓ Compiled in XXXms)
- All pre-existing TypeScript errors are in mini-services/telegram-bot (not our files)

Stage Summary:
- Three landing page sections dramatically enhanced with premium visual effects
- HowItWorksSection: Animated gold gradient connectors with traveling particles, larger floating step number circles, shimmer-border cards, gold sparkle particles background
- CalculatorSection: SVG gold coin illustration, enhanced glass-morphism calculator card with shimmer border, icon-enhanced tabs, animated result display with gradient background
- SecuritySection: Central animated shield visual with rotating rings and orbiting dots, dramatic shimmer-border security cards with hover glow, icon-enriched trust badges, bottom guarantee bar
- All components maintain RTL, i18n, and use project's extensive CSS utility classes
- Dev server compiles without errors
