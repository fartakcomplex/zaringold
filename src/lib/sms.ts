/**
 * SMS Provider System — Zarrin Gold (زرین گلد)
 *
 * Supports 3 Iranian SMS gateways:
 * - Kavenegar (کاوه‌نگار)
 * - Melipayamak (ملی پیامک)
 * - Sms.ir (اس‌ام‌اس‌آی‌آر)
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BalanceResult {
  balance: number;
  unit: string;
}

export interface SMSProvider {
  name: string;
  sendSMS(to: string, message: string): Promise<SMSResult>;
  sendOTP(to: string, code: string): Promise<SMSResult>;
  getBalance(): Promise<BalanceResult>;
}

export interface SMSConfig {
  provider: string;
  apiKey: string;
  senderNumber: string;
  otpTemplate: string;
}

// ─── Helper: Normalize Iranian phone numbers ────────────────────────

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+98')) return cleaned;
  if (cleaned.startsWith('09')) return '98' + cleaned.slice(1);
  if (cleaned.startsWith('98')) return cleaned;
  return '98' + cleaned;
}

// ─── Kavenegar Provider (کاوه‌نگار) ─────────────────────────────────

class KavenegarProvider implements SMSProvider {
  name = 'kavenegar';
  private apiKey: string;
  private sender: string;

  constructor(config: SMSConfig) {
    this.apiKey = config.apiKey;
    this.sender = config.senderNumber;
  }

  private baseUrl(): string {
    return `https://api.kavenegar.com/v1/${this.apiKey}`;
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const phone = normalizePhone(to);
      const res = await fetch(`${this.baseUrl()}/sms/send.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptor: phone,
          message,
          sender: this.sender,
        }),
      });
      const data = await res.json();
      if (data.return?.status === 200) {
        return { success: true, messageId: data.entries?.[0]?.messageid };
      }
      return { success: false, error: data.return?.message || 'Failed to send SMS via Kavenegar' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async sendOTP(to: string, code: string): Promise<SMSResult> {
    try {
      const phone = normalizePhone(to);
      const res = await fetch(`${this.baseUrl()}/verify/lookup.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptor: phone,
          token: code,
          template: this.apiKey ? 'zarringold' : 'default',
        }),
      });
      const data = await res.json();
      if (data.return?.status === 200) {
        return { success: true, messageId: data.entries?.[0]?.messageid };
      }
      return { success: false, error: data.return?.message || 'Failed to send OTP via Kavenegar' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getBalance(): Promise<BalanceResult> {
    try {
      const res = await fetch(`${this.baseUrl()}/account/info.json`);
      const data = await res.json();
      return {
        balance: data.entries?.remaincredit ?? 0,
        unit: 'اعتبار پیامکی',
      };
    } catch {
      return { balance: -1, unit: 'نامشخص' };
    }
  }
}

// ─── Melipayamak Provider (ملی پیامک) ──────────────────────────────

class MelipayamakProvider implements SMSProvider {
  name = 'melipayamak';
  private apiKey: string;
  private sender: string;

  constructor(config: SMSConfig) {
    this.apiKey = config.apiKey;
    this.sender = config.senderNumber;
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const phone = normalizePhone(to);
      const res = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.apiKey,
          password: this.apiKey,
          to: [phone],
          from: this.sender,
          text: message,
        }),
      });
      const data = await res.json();
      if (data.Value || data.RetStatus === 1) {
        return { success: true, messageId: data.Value };
      }
      return { success: false, error: data.StrError || 'Failed to send SMS via Melipayamak' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async sendOTP(to: string, code: string): Promise<SMSResult> {
    try {
      const phone = normalizePhone(to);
      const res = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendOTP', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.apiKey,
          password: this.apiKey,
          to: phone,
          bodyID: parseInt(this.apiKey.split('').reverse().join('').slice(0, 6), 10) || 0,
        }),
      });
      const data = await res.json();
      if (data.Status === 1 || data.Value) {
        return { success: true, messageId: String(data.Value) };
      }
      return { success: false, error: data.Message || 'Failed to send OTP via Melipayamak' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getBalance(): Promise<BalanceResult> {
    try {
      const res = await fetch('https://rest.payamak-panel.com/api/SendSMS/GetCredit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.apiKey,
          password: this.apiKey,
        }),
      });
      const data = await res.json();
      return {
        balance: data.Credit ?? data.Value ?? -1,
        unit: 'اعتبار',
      };
    } catch {
      return { balance: -1, unit: 'نامشخص' };
    }
  }
}

// ─── Sms.ir Provider (اس‌ام‌اس‌آی‌آر) ──────────────────────────────

class SmsIrProvider implements SMSProvider {
  name = 'smsir';
  private apiKey: string;
  private sender: string;
  private otpTemplate: string;

  constructor(config: SMSConfig) {
    this.apiKey = config.apiKey;
    this.sender = config.senderNumber;
    this.otpTemplate = config.otpTemplate;
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const phone = normalizePhone(to);
      const res = await fetch('https://api.sms.ir/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          MobileNumbers: [phone],
          Messages: [message],
          LinNumber: this.sender,
        }),
      });
      const data = await res.json();
      if (data.isSuccessful) {
        return { success: true, messageId: data.MessageId };
      }
      return { success: false, error: data.Message || 'Failed to send SMS via Sms.ir' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async sendOTP(to: string, code: string): Promise<SMSResult> {
    try {
      const phone = normalizePhone(to);
      const res = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          Mobile: phone,
          TemplateId: parseInt(this.otpTemplate, 10) || 0,
          Parameters: [
            { Name: 'Code', Value: code },
          ],
        }),
      });
      const data = await res.json();
      if (data.isSuccessful) {
        return { success: true, messageId: data.MessageId };
      }
      return { success: false, error: data.Message || 'Failed to send OTP via Sms.ir' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getBalance(): Promise<BalanceResult> {
    try {
      const res = await fetch('https://api.sms.ir/v1/credit', {
        method: 'GET',
        headers: { 'x-api-key': this.apiKey },
      });
      const data = await res.json();
      return {
        balance: data.Credit ?? data.Data ?? -1,
        unit: 'اعتبار پیامکی',
      };
    } catch {
      return { balance: -1, unit: 'نامشخص' };
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

const providerMap: Record<string, new (config: SMSConfig) => SMSProvider> = {
  kavenegar: KavenegarProvider,
  melipayamak: MelipayamakProvider,
  smsir: SmsIrProvider,
};

export function createSMSProvider(config: SMSConfig): SMSProvider {
  const ProviderClass = providerMap[config.provider] || KavenegarProvider;
  return new ProviderClass(config);
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
