

/* ═══════════════════════════════════════════════════════════════════════════
 *  security/index.ts — Security Hub
 *  صادرکننده اصلی تمام ماژول‌های امنیتی
 * ═══════════════════════════════════════════════════════════════════════════ */

export { sanitizeInput, sanitizeSql, sanitizeXss, sanitizePath, validateEmail, validatePhone, validatePassword, generateHmacSignature, verifyHmacSignature, sanitizeObject } from './sanitizer';
export { encryptField, decryptField, hashData, generateSecureToken, generateDeviceFingerprint, maskSensitiveData } from './encryption';
export { createRateLimiter, loginLimiter, registerLimiter, otpLimiter, apiLimiter, adminLimiter, passwordLimiter } from './rate-limiter';
export { isLikelyBot, HONEYPOT_FIELD_NAME, validateHoneypot, analyzeRequestTiming, BOT_USER_AGENTS, HEADLESS_PATTERNS } from './bot-detector';
export { requireAuth, requireAdmin, createSession, rotateSession, revokeSession, revokeAllUserSessions, isSessionValid, extractTokenFromRequest } from './auth-guard';
export { logSecurityEvent, getSecurityEvents, getSecurityStats } from './audit-logger';
export { checkLoginAttempts, recordFailedAttempt, recordSuccessfulLogin, shouldFreezeAccount, checkMultiCountryLogin, CHALLENGE_THRESHOLD, FREEZE_THRESHOLD } from './suspicious-behavior';
export { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, validateFileUpload, generateSafeFilename } from './file-security';
export { getSecurityHeaders } from './security-headers';
