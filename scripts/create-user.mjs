import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

async function main() {
  const db = new PrismaClient()
  const phone = '989938360723'

  const existing = await db.user.findUnique({ where: { phone } })
  if (existing) {
    console.log('❌ User already exists:', existing.id, existing.phone, existing.role)
    process.exit(1)
  }

  const hashedPassword = await hashPassword('123456')
  const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()

  const user = await db.user.create({
    data: {
      phone,
      password: hashedPassword,
      fullName: 'کاربر عادی',
      role: 'user',
      isVerified: true,
      isActive: true,
      referralCode,
      lastLoginAt: new Date(),
    },
  })

  await db.wallet.create({ data: { userId: user.id } })
  await db.goldWallet.create({ data: { userId: user.id } })
  await db.userGamification.create({ data: { userId: user.id } })

  console.log('✅ User created successfully!')
  console.log('📱 Phone:', phone)
  console.log('👤 Name:', user.fullName)
  console.log('🔑 Role:', user.role)
  console.log('📊 ID:', user.id)
  console.log('🏷️ Referral Code:', referralCode)
  console.log('💰 Fiat Wallet: created')
  console.log('🥇 Gold Wallet: created')
  console.log('🎮 Gamification: created')

  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
