# Task 2: KYC Wizard Rewrite

## Summary
Completely rewrote `/home/z/my-project/src/components/profile/KYCWizard.tsx` to create an awesome camera-only KYC verification system for the Mili Gold Persian RTL fintech app.

## What was done

### Architecture
- Simplified from 5 steps to 3 steps: ID Card Front, ID Card Back, Selfie Video
- Camera-first design with big prominent gold gradient camera button as primary action
- Gallery upload as secondary text link (not button)
- Full-screen camera overlay with specialized overlays for each step type

### Key Features Implemented

1. **3-Step Wizard**
   - Step 1: روی کارت ملی (ID Card Front) — environment camera
   - Step 2: پشت کارت ملی (ID Card Back) — environment camera  
   - Step 3: ویدئوی سلفی (Selfie Video) — user/front camera

2. **Camera-First Design**
   - Big gold gradient button (primary) for camera
   - Small text link for gallery upload (secondary)
   - `facingMode: 'environment'` for ID cards, `'user'` for selfie video

3. **Selfie Video Recording with Real-Time Guidance**
   - Full-screen camera overlay with pulsing face scan frame corners (oval)
   - Gold scanning line animation
   - Real-time step guide changing during recording:
     - 0-5s: "نام و نام خانوادگی خود را بگویید" (👋)
     - 5-12s: "کارت ملی را جلوی دوربین بگیرید — روی کارت" (🪪)
     - 12-19s: "کارت را بچرخانید — پشت کارت" (🔄)
     - 19-25s: "بگویید: این ویدئو برای احراز هویت در میلی گلد است" (🗣️)
     - 25s+: "عالی! دکمه قرمز را بزنید" (✅)
   - Timer (MM:SS), pulsing red REC indicator
   - Min 10s / Max 60s recording
   - Connected step progress circles

4. **Face/Card Scan Overlays**
   - Card-shaped golden corners for ID card steps with scanning line
   - Oval face frame with pulsing golden corners for selfie step
   - Flash effect on photo capture

5. **Beautiful UI**
   - Security banner (Lock + ShieldCheck icons)
   - Connected step progress tracker with gold gradient
   - Progress bar with gold gradient
   - Gold glass card design (#D4AF37, amber tones)
   - Preview Dialog for captured images (retake/confirm)
   - Summary review before final submit
   - All text in Persian (Farsi)

6. **Technical**
   - Uses `import { motion, AnimatePresence } from '@/lib/framer-compat'`
   - MediaRecorder API for video recording
   - getUserMedia for camera access
   - Canvas for photo capture
   - Stream cleanup on unmount
   - File size validation (images: 15MB, video: 50MB)
   - All refs properly managed
   - Props interface matches specification

### Lint Status
✅ All ESLint checks pass with zero errors

### Dev Server
✅ Compiles successfully (verified via dev.log)
