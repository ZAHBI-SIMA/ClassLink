/**
 * Test d'intégration GeniusPay (sandbox).
 * Exécute les vraies fonctions de lib/payments/geniuspay.ts.
 *
 * Usage : npx tsx scripts/test-geniuspay.ts
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initiatePayment, verifyPayment, verifyWebhookSignature } from '../lib/payments/geniuspay'

// Charge les variables GENIUSPAY_* depuis .env.local
function loadEnv() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^(GENIUSPAY_[A-Z_]+)=\s*"?([^"#]*)"?/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}

async function main() {
  loadEnv()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Test intégration GeniusPay (sandbox)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1) Initiation d'un paiement
  console.log('1) initiatePayment (montant 500 XOF)...')
  const init = await initiatePayment({
    amount: 500,
    description: 'Test ClasseLink — frais de scolarité',
    customerId: 'u_parent_1',
    customerName: 'Parent Test',
    customerEmail: 'parent@example.com',
    customerPhone: '+2250700000000',
    returnUrl: 'http://localhost:3000/parent/payment/return?paymentId=TEST&studentId=TEST',
    notifyUrl: 'http://localhost:3000/api/webhooks/geniuspay',
    metadata: { paymentId: 'TEST-PAY', schemaName: 'school_demo', studentId: 'TEST-STU' },
  })
  console.log('   ✓ reference :', init.transactionId)
  console.log('   ✓ paymentUrl:', init.paymentUrl)

  // 2) Vérification du statut
  console.log('\n2) verifyPayment...')
  const status = await verifyPayment(init.transactionId)
  console.log('   ✓ statut       :', status.status)
  console.log('   ✓ montant      :', status.amount)
  console.log('   ✓ méthode      :', status.paymentMethod || '(checkout en attente)')

  // 3) Vérification de la signature webhook (auto-test)
  console.log('\n3) verifyWebhookSignature (auto-test)...')
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET!
  const timestamp = String(Math.floor(Date.now() / 1000))
  const body = JSON.stringify({
    event: 'payment.success',
    data: {
      reference: init.transactionId,
      status: 'completed',
      amount: 500,
      metadata: { paymentId: 'TEST-PAY', schemaName: 'school_demo', studentId: 'TEST-STU' },
    },
  })

  // On reproduit la signature comme le ferait GeniusPay
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${body}`))
  const validSig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  const okValid = await verifyWebhookSignature(body, timestamp, validSig)
  const okInvalid = await verifyWebhookSignature(body, timestamp, 'deadbeef')
  console.log('   ✓ signature valide  → accepte :', okValid, okValid ? '✅' : '❌')
  console.log('   ✓ signature falsifiée → rejette:', !okInvalid, !okInvalid ? '✅' : '❌')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const allOk = okValid && !okInvalid
  console.log(allOk ? '✅ Intégration GeniusPay fonctionnelle' : '⚠️ Vérifier les résultats ci-dessus')
  console.log('   Ouvrez l\'URL de checkout pour finaliser un paiement test.')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(err => {
  console.error('\n❌ Erreur:', err?.message ?? err)
  process.exit(1)
})
