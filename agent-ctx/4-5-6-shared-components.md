# Tasks 4, 5, 6 — Shared Components

## Summary

Created three new components for the ZarinGold project:

### 1. Cookie Consent Banner (`src/components/shared/CookieConsent.tsx`)
- Bottom banner with gold-themed design
- Three buttons: Accept All, Essential Only, Customize
- Customize opens Dialog with toggle switches for 4 cookie categories
- Saves to localStorage with key `zaringold_cookie_consent`
- Framer Motion slide-up animation
- RTL support (Persian/English)

### 2. Enhanced 404 Page (`src/app/not-found.tsx`)
- Animated gold coin with CSS rotate animation
- Gold gradient "۴۰۴" text
- Persian + English messages
- Search bar, Go Home button, Back button
- 25 floating gold particles
- Framer Motion staggered entrance animations

### 3. Share/Invite Component (`src/components/shared/ShareInvite.tsx`)
- Referral code display with copy button
- Social sharing: Telegram, WhatsApp, Twitter/X, Copy
- Message preview (Persian + English)
- QR code SVG placeholder
- Framer Motion animations

## Files Created
- `src/components/shared/CookieConsent.tsx` (334 lines)
- `src/app/not-found.tsx` (272 lines)
- `src/components/shared/ShareInvite.tsx` (365 lines)

## Lint: No errors for any new files
