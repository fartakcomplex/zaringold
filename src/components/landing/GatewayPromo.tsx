'use client';

import { Zap, Percent, Code, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useCMSPage } from '@/hooks/useCMSPage';
import { useTranslation } from '@/lib/i18n';
import { type LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Component Props                                                    */
/* ------------------------------------------------------------------ */

interface GatewayPromoProps {
  onGetStarted: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GatewayPromo({ onGetStarted }: GatewayPromoProps) {
  const setLandingPage = useAppStore((s) => s.setLandingPage);
  const { content: cms } = useCMSPage('home');
  const { t } = useTranslation();

  // Icon lookup for CMS feature icons
  const iconLookup: Record<string, typeof Percent> = {
    Percent, Zap, Code,
  };

  // Build display features — CMS or fallback to i18n keys
  const displayFeatures = (() => {
    const raw = cms.gateway_features;
    if (Array.isArray(raw) && (raw as unknown[]).length > 0) {
      return (raw as Array<{ icon: string; label: string }>).map(f => ({
        icon: iconLookup[f.icon] || Percent,
        label: f.label,
      }));
    }
    return [
      { icon: Percent, label: t('gateway.feeLabel') },
      { icon: Zap, label: t('gateway.instantLabel') },
      { icon: Code, label: t('gateway.apiLabel') },
    ];
  })();

  // CMS text with fallback to i18n keys
  const gatewayBadge = (cms.gateway_badge as string) || t('gateway.badge');
  const gatewayTitle = (cms.gateway_title as string) || t('gateway.title');
  const gatewayDesc = (cms.gateway_desc as string) || t('gateway.desc');
  const gatewayButton = (cms.gateway_button as string) || t('gateway.button');

  const handleNavigate = () => {
    setLandingPage('gateway');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="glass-card overflow-hidden border-border/60">
          <div className="relative bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-6 sm:p-10">
            {/* Decorative border */}
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-gold/20" aria-hidden />

            <div className="relative text-center">
              <Badge variant="outline" className="mb-4 border-gold/30 bg-gold/10 text-gold">
                {gatewayBadge}
              </Badge>

              <h3 className="mb-3 text-xl font-extrabold sm:text-2xl">
                <span className="gold-gradient-text">{gatewayTitle}</span>
              </h3>

              <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {gatewayDesc}
              </p>

              {/* Mini feature icons */}
              <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                {displayFeatures.map((feat: { icon: LucideIcon; label: string }, i: number) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/20">
                      <feat.icon className="h-4 w-4 text-gold" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{feat.label}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={handleNavigate}
                className="h-11 rounded-xl bg-gradient-to-l from-gold-dark via-gold to-gold-light px-8 text-sm font-bold text-gray-950 shadow-lg shadow-gold/25 transition-all duration-300 hover:shadow-gold/40"
              >
                {gatewayButton}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
