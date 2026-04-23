// Utility functions for Zarrin Gold
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(num));
}

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `${formatNumber(millions)} میلیون`;
  }
  if (price >= 1_000) {
    const thousands = price / 1_000;
    return `${formatNumber(thousands)} هزار`;
  }
  return formatNumber(price);
}

export function formatToman(amount: number): string {
  return `${formatNumber(amount)} واحد طلایی`;
}

export function formatGoldValue(amount: number): string {
  return `${formatNumber(amount)} واحد طلایی`;
}

export function formatGrams(grams: number): string {
  if (grams < 1) {
    return `${formatNumber(grams * 1000)} میلی‌گرم`;
  }
  return `${formatNumber(grams)} گرم`;
}

export function toPersianDigits(str: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date().getTime();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${formatNumber(minutes)} دقیقه پیش`;
  if (hours < 24) return `${formatNumber(hours)} ساعت پیش`;
  return `${formatNumber(days)} روز پیش`;
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    deposit: "واریز",
    withdrawal: "برداشت",
    buy_gold: "خرید طلا",
    sell_gold: "فروش طلا",
    referral_reward: "جایزه دعوت",
    admin_adjustment: "تعدیل ادمین",
    cashback: "کش‌بک",
    transfer: "انتقال",
  };
  return labels[type] || type;
}

export function getTransactionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: "text-emerald-500",
    pending: "text-amber-500",
    failed: "text-red-500",
    cancelled: "text-gray-500",
  };
  return colors[status] || "text-gray-500";
}

export function getTransactionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    success: "موفق",
    pending: "در انتظار",
    failed: "ناموفق",
    cancelled: "لغو شده",
  };
  return labels[status] || status;
}

export function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    deposit: "ArrowDownLeft",
    withdrawal: "ArrowUpRight",
    buy_gold: "TrendingUp",
    sell_gold: "TrendingDown",
    referral_reward: "Gift",
    cashback: "BadgeDollarSign",
    transfer: "ArrowLeftRight",
    admin_adjustment: "Settings",
  };
  return icons[type] || "Circle";
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
