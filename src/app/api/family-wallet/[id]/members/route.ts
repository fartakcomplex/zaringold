import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST: add a member to a family wallet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, role, canWithdraw } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر عضو الزامی است' },
        { status: 400 }
      )
    }

    // Check wallet exists
    const wallet = await db.familyWallet.findUnique({
      where: { id },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'کیف پول خانوادگی یافت نشد' },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMember = await db.familyWalletMember.findUnique({
      where: {
        walletId_userId: { walletId: id, userId },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: 'این کاربر قبلاً عضو کیف پول خانوادگی است' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'member']
    const selectedRole = role && validRoles.includes(role) ? role : 'member'

    // Add member
    const member = await db.familyWalletMember.create({
      data: {
        walletId: id,
        userId,
        role: selectedRole,
        canWithdraw: typeof canWithdraw === 'boolean' ? canWithdraw : false,
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `${user.fullName || user.phone} به کیف پول خانوادگی اضافه شد`,
      member,
    })
  } catch (error) {
    console.error('Add family wallet member error:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن عضو به کیف پول خانوادگی' },
      { status: 500 }
    )
  }
}
