import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: list family wallets where user is a member
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      )
    }

    const memberships = await db.familyWalletMember.findMany({
      where: { userId },
      include: {
        wallet: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, fullName: true, phone: true, avatar: true },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const wallets = memberships.map((m) => m.wallet)

    return NextResponse.json({
      success: true,
      wallets,
      totalWallets: wallets.length,
    })
  } catch (error) {
    console.error('Get family wallets error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت کیف پول‌های خانوادگی' },
      { status: 500 }
    )
  }
}

// POST: create new family wallet
export async function POST(request: NextRequest) {
  try {
    const { userId, name, description } = await request.json()

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و نام کیف پول الزامی است' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // Create wallet
    const wallet = await db.familyWallet.create({
      data: {
        name,
        description: description || null,
      },
    })

    // Add creator as admin member
    const member = await db.familyWalletMember.create({
      data: {
        walletId: wallet.id,
        userId,
        role: 'admin',
        canWithdraw: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'کیف پول خانوادگی با موفقیت ایجاد شد',
      wallet: {
        ...wallet,
        members: [{
          ...member,
          user: { id: user.id, fullName: user.fullName, phone: user.phone, avatar: user.avatar },
        }],
      },
    })
  } catch (error) {
    console.error('Create family wallet error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کیف پول خانوادگی' },
      { status: 500 }
    )
  }
}
