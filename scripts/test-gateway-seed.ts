#!/usr/bin/env bun
/**
 * Test script for /api/gateway/seed
 * Verifies the seed endpoint creates all required gold gateway test data.
 */

const BASE_URL = 'http://localhost:3000'

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  Gold Gateway Seed — Integration Test')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    const res = await fetch(`${BASE_URL}/api/gateway/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    console.log(`Status: ${res.status} ${res.statusText}`)

    const data = await res.json()
    console.log('\n── Raw Response ──')
    console.log(JSON.stringify(data, null, 2))

    if (!data.success) {
      console.error('\n❌ FAILED: success is false')
      console.error(`Message: ${data.message}`)
      process.exit(1)
    }

    const d = data.data
    const errors: string[] = []

    /* ── Validate User ── */
    console.log('\n── Validations ──')
    if (!d.user?.id) errors.push('Missing user.id')
    if (d.user?.phone !== '09120000001') errors.push('Wrong phone number')
    if (d.user?.role !== 'user') errors.push('Wrong user role')
    if (d.user?.isVerified !== true) errors.push('User not verified')
    console.log(`  User: ${d.user?.phone} (${d.user?.id?.slice(0, 8)}...) ✅`)

    /* ── Validate Merchant ── */
    if (!d.merchant?.id) errors.push('Missing merchant.id')
    if (d.merchant?.businessName !== 'فروشگاه تست طلایی') errors.push('Wrong businessName')
    if (d.merchant?.settlementType !== 'gold') errors.push('settlementType is not gold')
    if (d.merchant?.isActive !== true) errors.push('Merchant not active')
    if (d.merchant?.isVerified !== true) errors.push('Merchant not verified')
    console.log(`  Merchant: ${d.merchant?.businessName} ✅`)
    console.log(`  Settlement: ${d.merchant?.settlementType} ✅`)

    /* ── Validate API Key ── */
    if (!d.apiKey?.startsWith('gp_live_')) errors.push('API key does not start with gp_live_')
    if (!d.apiKeyPrefix) errors.push('Missing apiKeyPrefix')
    console.log(`  API Key: ${d.apiKey?.slice(0, 20)}... ✅`)
    console.log(`  Key Prefix: ${d.apiKeyPrefix} ✅`)

    /* ── Validate Gold Price (only seeds if not exists, so accept any positive value) ── */
    if (!d.goldPrice?.buyPrice || d.goldPrice.buyPrice <= 0) errors.push('Missing or invalid buyPrice')
    if (!d.goldPrice?.sellPrice || d.goldPrice.sellPrice <= 0) errors.push('Missing or invalid sellPrice')
    if (d.goldPrice?.buyPrice === 89000000) {
      console.log(`  Gold Price: Buy=${d.goldPrice?.buyPrice?.toLocaleString()} Sell=${d.goldPrice?.sellPrice?.toLocaleString()} ✅ (seeded)`)
    } else {
      console.log(`  Gold Price: Buy=${d.goldPrice?.buyPrice?.toLocaleString()} Sell=${d.goldPrice?.sellPrice?.toLocaleString()} ✅ (existing)`)
    }

    /* ── Validate Gold Wallet ── */
    if (!d.goldWallet?.goldGrams || d.goldWallet.goldGrams < 50) errors.push('Gold wallet should have 50g')
    console.log(`  Gold Wallet: ${d.goldWallet?.goldGrams}g ✅`)

    /* ── Validate Test Payment ── */
    if (!d.testPayment?.authority) errors.push('Missing authority')
    if (d.testPayment?.goldGrams !== 0.5) errors.push('goldGrams should be 0.5')
    if (d.testPayment?.paymentMethod !== 'gold') errors.push('paymentMethod should be gold')
    if (d.testPayment?.status !== 'pending') errors.push('status should be pending')
    if (!d.testPayment?.checkoutUrl?.startsWith('/checkout/')) errors.push('Wrong checkoutUrl format')
    if (d.testPayment?.expiresIn !== 1800) errors.push('expiresIn should be 1800')
    console.log(`  Test Payment: ${d.testPayment?.authority} ✅`)
    console.log(`  Checkout URL: ${d.testPayment?.checkoutUrl} ✅`)
    console.log(`  Gold Grams: ${d.testPayment?.goldGrams}g ✅`)
    console.log(`  Fee Gold: ${d.testPayment?.feeGold}g ✅`)

    /* ── Validate cURL Example ── */
    if (!d.curlExample?.includes('gp_live_')) errors.push('cURL example missing API key')
    if (!d.curlExample?.includes('currency') || !d.curlExample?.includes('gold')) errors.push('cURL example missing gold currency')
    console.log(`  cURL Example: present ✅`)

    /* ── Final verdict ── */
    console.log('\n═══════════════════════════════════════════════════════════════')
    if (errors.length === 0) {
      console.log('  ✅ ALL TESTS PASSED — Gold Gateway Seed is fully functional')
      console.log('═══════════════════════════════════════════════════════════════')
    } else {
      console.log('  ❌ TESTS FAILED:')
      errors.forEach((e) => console.log(`     - ${e}`))
      console.log('═══════════════════════════════════════════════════════════════')
      process.exit(1)
    }
  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err)
    process.exit(1)
  }
}

runTest()
