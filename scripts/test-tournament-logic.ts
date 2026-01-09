/**
 * RPB - Test Tournament Logic
 * Validates the scoring and deck validation rules.
 */

import { calculateMatchScore, validateDeck, type BattleResult } from '../src/lib/tournament-logic'

console.log('🧪 Testing Tournament Logic...\n')

// 1. Test Scoring
console.log('📊 Testing Scoring (4-Point Match):')
const battles: BattleResult[] = [
  { winnerId: 'p1', finishType: 'spin_finish', points: 1 },
  { winnerId: 'p2', finishType: 'burst_finish', points: 2 },
  { winnerId: 'p1', finishType: 'xtreme_finish', points: 3 },
]

const score = calculateMatchScore('p1', 'p2', battles, '4_point_match')
console.log('Result:', score)
if (score.player1Points === 4 && score.isFinished && score.winnerId === 'p1') {
  console.log('✅ Scoring test passed!')
} else {
  console.log('❌ Scoring test failed!')
}

// 2. Test Deck Validation
console.log('\n🎴 Testing Deck Validation:')
const validDeck = {
  beys: [
    { bladeId: 'b1', ratchetId: 'r1', bitId: 'bt1' },
    { bladeId: 'b2', ratchetId: 'r2', bitId: 'bt2' },
    { bladeId: 'b3', ratchetId: 'r3', bitId: 'bt3' },
  ]
}

const vResult = validateDeck(validDeck)
console.log('Valid Deck Result:', vResult)
if (vResult.isValid) {
  console.log('✅ Valid deck test passed!')
} else {
  console.log('❌ Valid deck test failed!')
}

const invalidDeck = {
  beys: [
    { bladeId: 'b1', ratchetId: 'r1', bitId: 'bt1' },
    { bladeId: 'b1', ratchetId: 'r2', bitId: 'bt2' }, // Duplicate blade
    { bladeId: 'b3', ratchetId: 'r3', bitId: 'bt3' },
  ]
}

const iResult = validateDeck(invalidDeck)
console.log('Invalid Deck Result:', iResult)
if (!iResult.isValid && iResult.errors.length > 0) {
  console.log('✅ Invalid deck test passed!')
} else {
  console.log('❌ Invalid deck test failed!')
}

console.log('\n🏁 Tests complete.')
