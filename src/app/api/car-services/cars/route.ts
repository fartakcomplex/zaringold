import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List user's cars
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const cars = await db.userCar.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: cars });
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات خودروها' }, { status: 500 });
  }
}

// POST - Create new car
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();
    const {
      country = 'ایران',
      province,
      city,
      carType,
      carBrand,
      carModel,
      productionYear,
      plateNumber,
      plateTwoChar,
      plateThreeChar,
      plateRegion,
      color,
      vin,
      isDefault = false,
    } = body;

    if (!province || !carType || !carBrand) {
      return NextResponse.json(
        { error: 'استان، نوع خودرو و برند خودرو الزامی است' },
        { status: 400 }
      );
    }

    // If this car is set as default, unset other defaults
    if (isDefault) {
      await db.userCar.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const car = await db.userCar.create({
      data: {
        userId,
        country,
        province,
        city: city || '',
        carType,
        carBrand,
        carModel: carModel || '',
        productionYear: productionYear || 1400,
        plateNumber: plateNumber || '',
        plateTwoChar: plateTwoChar || '',
        plateThreeChar: plateThreeChar || '',
        plateRegion: plateRegion || '',
        color: color || '',
        vin: vin || '',
        isDefault,
      },
    });

    return NextResponse.json({ success: true, data: car }, { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'خطا در ثبت خودرو' }, { status: 500 });
  }
}
