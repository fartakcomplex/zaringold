import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/security/auth-guard';

// ── GET: All missions (admin view) ──
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const active = searchParams.get('active')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (category) where.category = category
    if (active !== null && active !== undefined) {
      where.isActive = active === 'true'
    }

    const [missions, total] = await Promise.all([
      db.mission.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { userMissions: true },
          },
        },
      }),
      db.mission.count({ where }),
    ])

    // Get completion stats for each mission
    const missionsWithStats = await Promise.all(
      missions.map(async (mission) => {
        const completedCount = await db.userMission.count({
          where: {
            missionId: mission.id,
            status: { in: ['completed', 'claimed'] },
          },
        })
        const claimedCount = await db.userMission.count({
          where: {
            missionId: mission.id,
            status: 'claimed',
          },
        })

        return {
          id: mission.id,
          title: mission.title,
          titleFa: mission.titleFa,
          description: mission.description,
          descriptionFa: mission.descriptionFa,
          type: mission.type,
          category: mission.category,
          rewardXp: mission.rewardXp,
          rewardGoldMg: mission.rewardGoldMg,
          rulesJson: mission.rulesJson,
          targetUrl: mission.targetUrl,
          targetPage: mission.targetPage,
          requiredCount: mission.requiredCount,
          isActive: mission.isActive,
          sortOrder: mission.sortOrder,
          isPremium: mission.isPremium,
          maxCompletionsPerUser: mission.maxCompletionsPerUser,
          startDate: mission.startDate,
          endDate: mission.endDate,
          createdAt: mission.createdAt,
          updatedAt: mission.updatedAt,
          stats: {
            totalAttempts: mission._count.userMissions,
            completedCount,
            claimedCount,
          },
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        missions: missionsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Admin quest missions GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load missions' },
      { status: 500 }
    )
  }
}

// ── POST: Create new mission (admin) ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      titleFa,
      descriptexport async function POST(!title || !description || !type || !category: NextRequest) {
    const auth = await requireAdmin(!title || !description || !type || !category);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

      return NextResponse.json(
        { success: false, message: 'title, description, type, and category are required' },
        { status: 400 }
      )
    }

    const validTypes = ['content', 'explore', 'search', 'tool', 'daily_return', 'social_share', 'profile', 'learning']
    const validCategories = ['daily', 'weekly', 'special', 'learning_path']

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate rulesJson if provided
    if (rulesJson) {
      try {
        JSON.parse(rulesJson)
      } catch {
        return NextResponse.json(
          { success: false, message: 'rulesJson must be valid JSON' },
          { status: 400 }
        )
      }
    }

    const mission = await db.mission.create({
      data: {
        title,
        titleFa: titleFa || '',
        description,
        descriptionFa: descriptionFa || '',
        type,
        category,
        rewardXp: Number(rewardXp) || 0,
        rewardGoldMg: Number(rewardGoldMg) || 0,
        rulesJson: rulesJson || '{}',
        targetUrl: targetUrl || '',
        targetPage: targetPage || '',
        requiredCount: Number(requiredCount) || 1,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
        isPremium: isPremium || false,
        maxCompletionsPerUser: Number(maxCompletionsPerUser) || 1,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: mission,
    })
  } catch (error) {
    console.error('Admin quest missions POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create mission' },
      { status: 500 }
    )
  }
}

// ── PUT: Update mission (admin) ──
export async function PUT(request: NextRequest) {
  try {
    const body = await reexport async function PUT()
    const { id: NextRequest, ...updateData } = body

    if (!id) {
    const auth = await requireAdmin()
    const { id);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

      return NextResponse.json(
        { success: false, message: 'Mission id is required' },
        { status: 400 }
      )
    }

    // Validate rulesJson if provided
    if (updateData.rulesJson) {
      try {
        JSON.parse(updateData.rulesJson)
      } catch {
        return NextResponse.json(
          { success: false, message: 'rulesJson must be valid JSON' },
          { status: 400 }
        )
      }
    }

    // Convert date strings to Date objects
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate)

    // Convert numeric fields
    if (updateData.rewardXp !== undefined) updateData.rewardXp = Number(updateData.rewardXp)
    if (updateData.rewardGoldMg !== undefined) updateData.rewardGoldMg = Number(updateData.rewardGoldMg)
    if (updateData.requiredCount !== undefined) updateData.requiredCount = Number(updateData.requiredCount)
    if (updateData.sortOrder !== undefined) updateData.sortOrder = Number(updateData.sortOrder)
    if (updateData.maxCompletionsPerUser !== undefined) updateData.maxCompletionsPerUser = Number(updateData.maxCompletionsPerUser)

    const mission = await db.mission.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: mission,
    })
  } catch (error) {
    console.error('Admin quest missions PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update mission' },
      { status: 500 }
    )
  }
}
