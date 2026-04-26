import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get single car
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const car = await db.userCar.findFirst({
      where: { id, userId },
    });

    if (!car) {
      return NextResponse.json({ error: 'خودرو یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: car });
  } catch (error) {
    console.error('Error fetching car:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

// PUT - Update car
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const body = await req.json();

    const existingCar = await db.userCar.findFirst({
      where: { id, userId },
    });

    if (!existingCar) {
      return NextResponse.json({ error: 'خودرو یافت نشد' }, { status: 404 });
    }

    // If setting as default, unset others first
    if (body.isDefault) {
      await db.userCar.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const car = await db.userCar.update({
      where: { id },
      data: {
        province: body.province ?? existingCar.province,
        city: body.city ?? existingCar.city,
        carType: body.carType ?? existingCar.carType,
        carBrand: body.carBrand ?? existingCar.carBrand,
        carModel: body.carModel ?? existingCar.carModel,
        productionYear: body.productionYear ?? existingCar.productionYear,
        plateNumber: body.plateNumber ?? existingCar.plateNumber,
        plateTwoChar: body.plateTwoChar ?? existingCar.plateTwoChar,
        plateThreeChar: body.plateThreeChar ?? existingCar.plateThreeChar,
        plateRegion: body.plateRegion ?? existingCar.plateRegion,
        color: body.color ?? existingCar.color,
        vin: body.vin ?? existingCar.vin,
        isDefault: body.isDefault ?? existingCar.isDefault,
      },
    });

    return NextResponse.json({ success: true, data: car });
  } catch (error) {
    console.error('Error updating car:', error);
    return NextResponse.json({ error: 'خطا در ویرایش خودرو' }, { status: 500 });
  }
}

// DELETE - Delete car (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'کاربر شناسایی نشد' }, { status: 401 });
    }

    const existingCar = await db.userCar.findFirst({
      where: { id, userId },
    });

    if (!existingCar) {
      return NextResponse.json({ error: 'خودرو یافت نشد' }, { status: 404 });
    }

    await db.userCar.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'خودرو حذف شد' });
  } catch (error) {
    console.error('Error deleting car:', error);
    return NextResponse.json({ error: 'خطا در حذف خودرو' }, { status: 500 });
  }
}
