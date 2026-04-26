import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

// ── DELETE: Delete a mission (admin) ──
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params

    // Check if mission exists
    const mission = await db.mission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userMissions: true },
        },
      },
    })

    if (!mission) {
      return NextResponse.json(
        { success: false, message: 'Mission not found' },
        { status: 404 }
      )
    }

    // Delete related user missions and reward transactions first
    await db.userMission.deleteMany({
      where: { missionId: id },
    })

    await db.questRewardTransaction.deleteMany({
      where: { missionId: id },
    })

    // Delete the mission
    await db.mission.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: {
        deleted: true,
        missionId: id,
        deletedUserMissions: mission._count.userMissions,
      },
    })
  } catch (error) {
    console.error('Admin quest mission DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete mission' },
      { status: 500 }
    )
  }
}

// ── PUT: Toggle mission active status (admin) ──
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(_request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params

    const mission = await db.mission.findUnique({
      where: { id },
    })

    if (!mission) {
      return NextResponse.json(
        { success: false, message: 'Mission not found' },
        { status: 404 }
      )
    }

    const updatedMission = await db.mission.update({
      where: { id },
      data: {
        isActive: !mission.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMission.id,
        isActive: updatedMission.isActive,
        message: updatedMission.isActive ? 'Mission activated' : 'Mission deactivated',
      },
    })
  } catch (error) {
    console.error('Admin quest mission PUT toggle error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to toggle mission' },
      { status: 500 }
    )
  }
}
