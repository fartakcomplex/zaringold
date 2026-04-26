import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Seed car service categories
export async function POST() {
  try {
    const categories = [
      {
        slug: 'repairs',
        name: 'تعمیرات خودرو',
        nameEn: 'Car Repairs',
        description: 'تعمیرات فوری و عادی خودرو با بهترین کیفیت',
        descriptionEn: 'Urgent and regular car repairs with best quality',
        icon: 'Wrench',
        color: '#8B5CF6',
        basePrice: 500000,
        sortOrder: 1,
      },
      {
        slug: 'alarm',
        name: 'دزدگیر خودرو',
        nameEn: 'Car Alarm',
        description: 'نصب و تعمیر دزدگیر خودرو',
        descriptionEn: 'Install and repair car alarm systems',
        icon: 'ShieldAlert',
        color: '#EF4444',
        basePrice: 350000,
        sortOrder: 2,
      },
      {
        slug: 'taxi',
        name: 'تاکسی',
        nameEn: 'Taxi Service',
        description: 'درخواست تاکسی با کیفیت و امن',
        descriptionEn: 'Quality and secure taxi service',
        icon: 'Car',
        color: '#F59E0B',
        basePrice: 150000,
        sortOrder: 3,
      },
      {
        slug: 'tow-highway',
        name: 'جرثقیل بین‌شهری',
        nameEn: 'Highway Tow Truck',
        description: 'تخلیه خودرو با جرثقیل در جاده‌ها',
        descriptionEn: 'Highway car tow and unload service',
        icon: 'Truck',
        color: '#3B82F6',
        basePrice: 800000,
        sortOrder: 4,
      },
      {
        slug: 'tow-city',
        name: 'جرثقیل شهری',
        nameEn: 'City Tow Truck',
        description: 'تخلیه خودرو با جرثقیل در سطح شهر',
        descriptionEn: 'City-level car tow service',
        icon: 'Building2',
        color: '#06B6D4',
        basePrice: 400000,
        sortOrder: 5,
      },
      {
        slug: 'parking',
        name: 'پارکینگ خودرو',
        nameEn: 'Car Parking',
        description: 'پارکینگ امن و covered با قیمت مناسب',
        descriptionEn: 'Secure covered parking at affordable prices',
        icon: 'SquareParking',
        color: '#10B981',
        basePrice: 100000,
        sortOrder: 6,
      },
      {
        slug: 'lost-car',
        name: 'جستجوی خودرو',
        nameEn: 'Lost Car Search',
        description: 'جستجوی خودروهای گم شده و سرقت شده',
        descriptionEn: 'Search for lost and stolen vehicles',
        icon: 'Search',
        color: '#F97316',
        basePrice: 0,
        sortOrder: 7,
      },
      {
        slug: 'car-check',
        name: 'اعتبارسنجی خودرو',
        nameEn: 'Car Credit Check',
        description: 'بررسی اعتبار و سابقه خودرو قبل از خرید',
        descriptionEn: 'Check vehicle history and credit before purchase',
        icon: 'BadgeCheck',
        color: '#6366F1',
        basePrice: 250000,
        sortOrder: 8,
      },
    ];

    let created = 0;
    let updated = 0;

    for (const cat of categories) {
      const existing = await db.carServiceCategory.findUnique({
        where: { slug: cat.slug },
      });

      if (existing) {
        await db.carServiceCategory.update({
          where: { slug: cat.slug },
          data: cat,
        });
        updated++;
      } else {
        await db.carServiceCategory.create({
          data: cat,
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${created} دسته‌بندی جدید ایجاد و ${updated} بروزرسانی شد`,
      created,
      updated,
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json({ error: 'خطا در ایجاد دسته‌بندی‌ها' }, { status: 500 });
  }
}
