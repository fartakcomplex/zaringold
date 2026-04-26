import { NextRequest, NextResponse } from 'next/server';

// Mock subscribers data
const MOCK_SUBSCRIBERS = [
  { id: 's1', email: 'ali.mohammadi@gmail.com', name: 'علی محمدی', status: 'active', subscribedAt: '1403/01/15', source: 'ثبت‌نام' },
  { id: 's2', email: 'sara.ahmadi@yahoo.com', name: 'سارا احمدی', status: 'active', subscribedAt: '1403/02/03', source: 'خبرنامه' },
  { id: 's3', email: 'reza.karimi@outlook.com', name: 'رضا کریمی', status: 'active', subscribedAt: '1403/02/10', source: 'ثبت‌نام' },
  { id: 's4', email: 'maryam.hosseini@gmail.com', name: 'مریم حسینی', status: 'unsubscribed', subscribedAt: '1403/01/20', source: 'خبرنامه' },
  { id: 's5', email: 'hasan.rezaei@yahoo.com', name: 'حسن رضایی', status: 'active', subscribedAt: '1403/03/01', source: 'فرم وبسایت' },
  { id: 's6', email: 'leila.moradi@gmail.com', name: 'لیلا مرادی', status: 'bounced', subscribedAt: '1403/02/15', source: 'ثبت‌نام' },
  { id: 's7', email: 'amir.nazari@outlook.com', name: 'امیر ناظری', status: 'active', subscribedAt: '1403/03/05', source: 'کمپین' },
  { id: 's8', email: 'fatemeh.jafari@gmail.com', name: 'فاطمه جعفری', status: 'active', subscribedAt: '1403/03/10', source: 'ثبت‌نام' },
  { id: 's9', email: 'mehdi.rahimi@yahoo.com', name: 'مهدی رحیمی', status: 'unsubscribed', subscribedAt: '1403/01/25', source: 'خبرنامه' },
  { id: 's10', email: 'zahra.mousavi@gmail.com', name: 'زهرا موسوی', status: 'active', subscribedAt: '1403/03/12', source: 'فرم وبسایت' },
  { id: 's11', email: 'omid.sadeghi@outlook.com', name: 'امید صادقی', status: 'active', subscribedAt: '1403/03/15', source: 'ثبت‌نام' },
  { id: 's12', email: 'narges.akbari@gmail.com', name: 'نرگس اکبری', status: 'bounced', subscribedAt: '1403/02/20', source: 'کمپین' },
];

const MOCK_STATS = {
  total: 12,
  active: 8,
  unsubscribed: 2,
  bounced: 2,
};

// GET: List subscribers with search/filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let filtered = [...MOCK_SUBSCRIBERS];

    if (status && status !== 'all') {
      filtered = filtered.filter((s) => s.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          s.name.includes(search)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: {
        subscribers: paginated,
        stats: MOCK_STATS,
        pagination: { page, limit, total, totalPages },
      },
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست مشترکان' },
      { status: 500 }
    );
  }
}

// POST: Add subscriber or import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, emails } = body;

    // Bulk import
    if (action === 'import' && Array.isArray(emails)) {
      const imported = emails.length;
      return NextResponse.json({
        success: true,
        message: `${imported} مشترک با موفقیت وارد شد`,
        data: { imported },
      });
    }

    // Single add
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'ایمیل الزامی است' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'مشترک با موفقیت اضافه شد',
      data: {
        id: `s${Date.now()}`,
        email,
        name: name || '',
        status: 'active',
        subscribedAt: new Date().toLocaleDateString('fa-IR'),
        source: 'دستی',
      },
    });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن مشترک' },
      { status: 500 }
    );
  }
}
