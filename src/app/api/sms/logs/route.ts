import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Mock Data (30 log entries) ──────────────────────────────
const allLogs = [
  { id: 'l1', date: '2024-03-28T14:30:00Z', phone: '09121234567', type: 'marketing', status: 'delivered', cost: 45, message: 'تخفیف نوروزی زرین گلد' },
  { id: 'l2', date: '2024-03-28T14:29:00Z', phone: '09351234567', type: 'marketing', status: 'delivered', cost: 45, message: 'تخفیف نوروزی زرین گلد' },
  { id: 'l3', date: '2024-03-28T14:28:00Z', phone: '09191234567', type: 'transactional', status: 'failed', cost: 0, message: 'واریز به حساب شما انجام شد' },
  { id: 'l4', date: '2024-03-28T14:27:00Z', phone: '09161234567', type: 'otp', status: 'delivered', cost: 45, message: 'کد تایید شما: ۴۵۲۳' },
  { id: 'l5', date: '2024-03-28T14:26:00Z', phone: '09381234567', type: 'price_alert', status: 'delivered', cost: 45, message: 'قیمت طلا افزایش یافت' },
  { id: 'l6', date: '2024-03-28T13:30:00Z', phone: '09131234567', type: 'marketing', status: 'delivered', cost: 45, message: 'پیشنهاد ویژه خرید طلا' },
  { id: 'l7', date: '2024-03-28T13:25:00Z', phone: '09361234567', type: 'birthday', status: 'delivered', cost: 45, message: 'تولدت مبارک! هدیه ویژه' },
  { id: 'l8', date: '2024-03-28T13:20:00Z', phone: '09141234567', type: 'transactional', status: 'delivered', cost: 45, message: 'برداشت از کیف پول انجام شد' },
  { id: 'l9', date: '2024-03-28T12:30:00Z', phone: '09121234568', type: 'security', status: 'delivered', cost: 45, message: 'ورود جدید به حساب شما' },
  { id: 'l10', date: '2024-03-28T12:15:00Z', phone: '09351234568', type: 'marketing', status: 'failed', cost: 0, message: 'تخفیف نوروزی زرین گلد' },
  { id: 'l11', date: '2024-03-28T11:30:00Z', phone: '09191234568', type: 'transactional', status: 'delivered', cost: 45, message: 'واریز به حساب شما انجام شد' },
  { id: 'l12', date: '2024-03-28T11:20:00Z', phone: '09161234568', type: 'otp', status: 'delivered', cost: 45, message: 'کد تایید شما: ۸۸۷۶' },
  { id: 'l13', date: '2024-03-28T10:30:00Z', phone: '09381234568', type: 'price_alert', status: 'delivered', cost: 45, message: 'قیمت طلا کاهش یافت' },
  { id: 'l14', date: '2024-03-28T10:15:00Z', phone: '09131234568', type: 'marketing', status: 'delivered', cost: 45, message: 'پیشنهاد ویژه فروش طلا' },
  { id: 'l15', date: '2024-03-28T09:30:00Z', phone: '09361234568', type: 'gift', status: 'delivered', cost: 45, message: 'هدیه طلا از زرین گلد' },
  { id: 'l16', date: '2024-03-28T09:20:00Z', phone: '09141234568', type: 'transactional', status: 'delivered', cost: 45, message: 'خرید طلا با موفقیت انجام شد' },
  { id: 'l17', date: '2024-03-27T18:30:00Z', phone: '09121234569', type: 'loyalty', status: 'delivered', cost: 45, message: '۱۰۰ امتیاز وفاداری اضافه شد' },
  { id: 'l18', date: '2024-03-27T17:25:00Z', phone: '09351234569', type: 'marketing', status: 'failed', cost: 0, message: 'تخفیف ویژه زرین گلد' },
  { id: 'l19', date: '2024-03-27T16:30:00Z', phone: '09191234569', type: 'transactional', status: 'delivered', cost: 45, message: 'فروش طلا با موفقیت انجام شد' },
  { id: 'l20', date: '2024-03-27T15:20:00Z', phone: '09161234569', type: 'otp', status: 'delivered', cost: 45, message: 'کد تایید شما: ۱۱۲۲' },
  { id: 'l21', date: '2024-03-27T14:30:00Z', phone: '09381234569', type: 'price_alert', status: 'delivered', cost: 45, message: 'قیمت طلا ثابت ماند' },
  { id: 'l22', date: '2024-03-27T13:15:00Z', phone: '09131234569', type: 'security', status: 'delivered', cost: 45, message: 'تلاش ورود ناموفق' },
  { id: 'l23', date: '2024-03-27T12:30:00Z', phone: '09361234569', type: 'marketing', status: 'delivered', cost: 45, message: 'کمپین فروش ویژه' },
  { id: 'l24', date: '2024-03-27T11:20:00Z', phone: '09141234569', type: 'birthday', status: 'delivered', cost: 45, message: 'تولدت مبارک!' },
  { id: 'l25', date: '2024-03-27T10:30:00Z', phone: '09121234570', type: 'transactional', status: 'delivered', cost: 45, message: 'واریز به حساب انجام شد' },
  { id: 'l26', date: '2024-03-27T09:15:00Z', phone: '09351234570', type: 'gift', status: 'failed', cost: 0, message: 'هدیه ویژه از دوستتان' },
  { id: 'l27', date: '2024-03-26T16:30:00Z', phone: '09191234570', type: 'marketing', status: 'delivered', cost: 45, message: 'جشنواره خرید طلا' },
  { id: 'l28', date: '2024-03-26T15:20:00Z', phone: '09161234570', type: 'loyalty', status: 'delivered', cost: 45, message: 'سطح وفاداری ارتقا یافت' },
  { id: 'l29', date: '2024-03-26T14:10:00Z', phone: '09381234570', type: 'otp', status: 'delivered', cost: 45, message: 'کد تایید شما: ۳۳۴۴' },
  { id: 'l30', date: '2024-03-26T13:00:00Z', phone: '09131234570', type: 'transactional', status: 'delivered', cost: 45, message: 'تغییر رمز عبور موفق' },
]

// Generate remaining entries to reach total of 156
const extraLogs = Array.from({ length: 126 }, (_, i) => ({
  id: `le${i + 1}`,
  date: new Date(2024, 2, 26 - Math.floor(i / 10), 12, 0, 0).toISOString(),
  phone: `0912${String(1000000 + i).slice(-7)}`,
  type: ['marketing', 'transactional', 'otp', 'price_alert', 'security'][i % 5],
  status: i % 7 === 0 ? 'failed' : 'delivered',
  cost: i % 7 === 0 ? 0 : 45,
  message: 'پیامک ارسالی زرین گلد',
}))

const totalLogPool = [...allLogs, ...extraLogs]

// ─── GET: List SMS logs with filters ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const phone = searchParams.get('phone') || ''

    let filtered = [...totalLogPool]

    if (type) {
      filtered = filtered.filter((l) => l.type === type)
    }
    if (status) {
      filtered = filtered.filter((l) => l.status === status)
    }
    if (phone) {
      filtered = filtered.filter((l) => l.phone.includes(phone))
    }

    const total = filtered.length
    const start = (page - 1) * limit
    const logs = filtered.slice(start, start + limit)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error('[SMS Logs GET]', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش پیامک‌ها' },
      { status: 500 }
    )
  }
}
