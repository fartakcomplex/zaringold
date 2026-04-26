import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── PATCH: Toggle alert active/inactive status ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه هشدار الزامی است' },
        { status: 400 },
      );
    }

    // Check alert exists
    const existingAlert = await db.priceAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { success: false, message: 'هشدار مورد نظر یافت نشد' },
        { status: 404 },
      );
    }

    // Toggle isActive
    const updatedAlert = await db.priceAlert.update({
      where: { id },
      data: { isActive: !existingAlert.isActive },
    });

    return NextResponse.json({
      success: true,
      message: updatedAlert.isActive
        ? 'هشدار فعال شد'
        : 'هشدار غیرفعال شد',
      alert: updatedAlert,
    });
  } catch (error) {
    console.error('Error toggling price alert:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت هشدار' },
      { status: 500 },
    );
  }
}

// ── DELETE: Remove alert ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه هشدار الزامی است' },
        { status: 400 },
      );
    }

    // Check alert exists
    const existingAlert = await db.priceAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { success: false, message: 'هشدار مورد نظر یافت نشد' },
        { status: 404 },
      );
    }

    // Delete the alert
    await db.priceAlert.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'هشدار قیمت حذف شد',
    });
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف هشدار قیمت' },
      { status: 500 },
    );
  }
}
