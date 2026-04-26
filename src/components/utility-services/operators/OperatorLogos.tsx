'use client';

import React from 'react';

/* ═══════════════════════════════════════════════════════════════ */
/*  Iranian Mobile Operator Logos (SVG)                           */
/*  Each logo closely mirrors the real-world brand identity        */
/* ═══════════════════════════════════════════════════════════════ */

interface LogoProps {
  size?: number;
  className?: string;
}

/* ─── MCI (همراه اول) ─── */
export function MCILogo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="#FFD600" />
      {/* Inner ring */}
      <circle cx="40" cy="40" r="32" fill="none" stroke="#FFF" strokeWidth="1.5" opacity="0.3" />
      {/* "M" letter mark */}
      <path
        d="M22 52V28L32 42L42 28V52"
        stroke="#1A1A1A"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* "CI" text */}
      <text x="46" y="50" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="800" fill="#1A1A1A">
        CI
      </text>
      {/* Subtle shine */}
      <ellipse cx="32" cy="24" rx="16" ry="6" fill="white" opacity="0.15" />
    </svg>
  );
}

/* ─── Irancell (ایرانسل / MTN) ─── */
export function IrancellLogo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded rectangle */}
      <rect x="2" y="2" width="76" height="76" rx="18" fill="#FF6600" />
      {/* Inner rounded rect */}
      <rect x="8" y="8" width="64" height="64" rx="14" fill="none" stroke="white" strokeWidth="1.2" opacity="0.2" />
      {/* Signal wave pattern */}
      <circle cx="40" cy="38" r="6" fill="white" />
      <path
        d="M28 38C28 31.4 33.4 26 40 26"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M52 38C52 44.6 46.6 50 40 50"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 38C20 26.8 28.8 18 40 18"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M60 38C60 49.2 51.2 58 40 58"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
      {/* "irancell" text */}
      <text x="40" y="68" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="700" fill="white" opacity="0.9">
        irancell
      </text>
      {/* Subtle shine */}
      <ellipse cx="30" cy="20" rx="18" ry="7" fill="white" opacity="0.12" />
    </svg>
  );
}

/* ─── Rightel (رایتل) ─── */
export function RightelLogo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect x="2" y="2" width="76" height="76" rx="20" fill="#9C27B0" />
      {/* Gradient overlay */}
      <defs>
        <linearGradient id="rightelGrad" x1="0" y1="0" x2="80" y2="80">
          <stop offset="0%" stopColor="#AB47BC" />
          <stop offset="100%" stopColor="#7B1FA2" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="76" height="76" rx="20" fill="url(#rightelGrad)" />
      {/* "R" letter mark */}
      <text x="40" y="46" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="34" fontWeight="900" fill="white">
        R
      </text>
      {/* Signal dots */}
      <circle cx="22" cy="58" r="2.5" fill="white" opacity="0.8" />
      <circle cx="30" cy="58" r="2.5" fill="white" opacity="0.6" />
      <circle cx="38" cy="58" r="2.5" fill="white" opacity="0.4" />
      {/* "ightel" continuation text */}
      <text x="48" y="61" fontFamily="Arial, sans-serif" fontSize="7.5" fontWeight="600" fill="white" opacity="0.85">
        ightel
      </text>
      {/* Subtle shine */}
      <ellipse cx="30" cy="18" rx="16" ry="6" fill="white" opacity="0.12" />
    </svg>
  );
}

/* ─── Taliya (تالیا) ─── */
export function TaliyaLogo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="#00897B" />
      {/* Inner ring */}
      <circle cx="40" cy="40" r="33" fill="none" stroke="white" strokeWidth="1.2" opacity="0.2" />
      {/* "T" letter mark */}
      <text x="40" y="45" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="32" fontWeight="900" fill="white">
        T
      </text>
      {/* "aliya" continuation text */}
      <text x="40" y="60" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="600" fill="white" opacity="0.9">
        aliya
      </text>
      {/* Decorative signal arcs */}
      <path
        d="M22 30C24 22 32 16 40 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
      <path
        d="M58 30C56 22 48 16 40 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
      {/* Subtle shine */}
      <ellipse cx="30" cy="20" rx="14" ry="6" fill="white" opacity="0.12" />
    </svg>
  );
}

/* ─── Shatel Mobile (شاتل موبایل) ─── */
export function ShatelLogo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2" width="76" height="76" rx="18" fill="#1565C0" />
      <text x="40" y="45" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="900" fill="white">
        SHATEL
      </text>
      <text x="40" y="58" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="600" fill="white" opacity="0.8">
        MOBILE
      </text>
      {/* Signal icon */}
      <circle cx="40" cy="28" r="4" fill="white" />
      <ellipse cx="40" cy="28" rx="12" ry="8" stroke="white" strokeWidth="1.5" opacity="0.5" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Operator Logo Map                                               */
/* ═══════════════════════════════════════════════════════════════ */

const OPERATOR_LOGO_MAP: Record<string, React.FC<LogoProps>> = {
  mci: MCILogo,
  irancell: IrancellLogo,
  rightel: RightelLogo,
  taliya: TaliyaLogo,
  shatel: ShatelLogo,
};

export function getOperatorLogo(operatorId: string): React.FC<LogoProps> {
  return OPERATOR_LOGO_MAP[operatorId] || MCILogo;
}

export default OPERATOR_LOGO_MAP;
