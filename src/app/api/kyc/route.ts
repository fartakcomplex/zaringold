import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const userId = auth.user.id

    let kyc = await db.kYCRequest.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      kyc: kyc || {
        status: 'none',
        message: 'هنوز درخواست احراز هویت ثبت نشده است',
      },
    })
  } catch (error) {
    console.error('Get KYC error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت وضعیت احراز هویت' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 })
    }

    const {
      idCardImage,
      idCardBackImage,
      selfieImage,
      bankCardImage,
      verificationVideo,
    } = await request.json()
    const userId = auth.user.id

    // Upsert KYC request — reset review status on new submission
    const kyc = await db.kYCRequest.upsert({
      where: { userId },
      update: {
        ...(idCardImage ? { idCardImage } : {}),
        ...(idCardBackImage ? { idCardBackImage } : {}),
        ...(selfieImage ? { selfieImage } : {}),
        ...(bankCardImage ? { bankCardImage } : {}),
        ...(verificationVideo ? { verificationVideo } : {}),
        status: 'pending',
        adminNote: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      create: {
        userId,
        idCardImage: idCardImage || null,
        idCardBackImage: idCardBackImage || null,
        selfieImage: selfieImage || null,
        bankCardImage: bankCardImage || null,
        verificationVideo: verificationVideo || null,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'درخواست احراز هویت ثبت شد',
      kyc,
    })
  } catch (error) {
    console.error('Submit KYC error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت احراز هویت' },
      { status: 500 }
    )
  }
}
