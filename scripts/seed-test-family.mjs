#!/usr/bin/env node

/**
 * Script para semear a família de teste (Matheus + Isadora) no Firestore.
 *
 * Gera um código de 8 caracteres e instrui como criar os documentos manualmente
 * ou via Firebase Console. Evita precisar de Admin SDK nesta fase.
 *
 * Uso: node scripts/seed-test-family.mjs
 */

// Alfabeto sem caracteres ambíguos (sem 0, O, I, 1, l)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCode(length = 8) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

const code = generateCode();
const familyId = 'fam_casal';
const mautheusId = 'g_matheus';
const isadoraId = 'g_isadora';

console.log('\n🎯 Família de Teste — Matheus & Isadora\n');
console.log('─'.repeat(70));
console.log(`Código gerado: ${code}`);
console.log('─'.repeat(70));

console.log('\n📝 Crie os seguintes documentos no Firebase Console:\n');

console.log(`1️⃣  Coleção: codes | Doc ID: ${code}`);
console.log('   Conteúdo:');
console.log(JSON.stringify({ familyId }, null, 2));

console.log('\n2️⃣  Coleção: families | Doc ID: fam_casal');
console.log('   Conteúdo:');
console.log(JSON.stringify(
  {
    id: familyId,
    name: 'Matheus & Isadora',
    code: code
  },
  null,
  2
));

console.log('\n3️⃣  Coleção: guests | Doc ID: g_matheus');
console.log('   Conteúdo:');
console.log(JSON.stringify(
  {
    id: mautheusId,
    familyId: familyId,
    name: 'Matheus',
    isMainGuest: true
  },
  null,
  2
));

console.log('\n4️⃣  Coleção: guests | Doc ID: g_isadora');
console.log('   Conteúdo:');
console.log(JSON.stringify(
  {
    id: isadoraId,
    familyId: familyId,
    name: 'Isadora',
    isMainGuest: true
  },
  null,
  2
));

console.log('\n─'.repeat(70));
console.log(`\n✅ Após criar os documentos, acesse:\n`);
console.log(`   http://localhost:3000/rsvp/${code}\n`);
console.log('Ou, com pré-seleção do Matheus:\n');
console.log(`   http://localhost:3000/rsvp/${code}?c=${mautheusId}\n`);
console.log('─'.repeat(70));
console.log('\n');
