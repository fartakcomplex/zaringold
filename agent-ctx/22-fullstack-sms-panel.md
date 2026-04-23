---
Task ID: 22
Agent: Full-Stack Developer (SMS Panel)
Task: Create SMS panel integration settings page

Work Log:
- Created src/components/sms/SmsSettings.tsx with 5 sections:
  1. API Configuration: provider selector (Kavenegar, Melipayamak, SMS.ir, Custom), API key, username, endpoint, test connection button
  2. OTP Settings: template ID, message template with variables, expiration time, code length, max attempts
  3. Notification Templates: welcome, transaction, price alert, deposit/withdrawal with enable/disable toggles and variable badges
  4. Sending Rules: daily SMS limit, event type toggles (OTP, transaction, price alert, marketing, security)
  5. Sending Logs: mock table with 10 rows showing date, masked phone, type, status badges, cost
- Updated SettingsView.tsx to import SmsSettings and replace inline SMS tab with the new component
- Renamed tab from "پیامکی" to "پنل پیامکی"
- Removed unused imports and state from SettingsView (SmsConfigData, sms-related state/functions)
- Used gold theme CSS classes: card-gold-border, input-gold-focus, btn-gold-gradient, btn-gold-outline
- All text in Persian RTL
- Responsive layout with grid breakpoints
- React Compiler safe patterns (useCallback for handlers, no set-state-in-effect)
- Lint passes clean

Stage Summary:
- SMS Panel settings page available in Settings > پنل پیامکی tab
- Comprehensive 5-section settings page for SMS panel integration
- All mock data, no real API calls
