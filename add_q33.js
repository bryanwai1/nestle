#!/usr/bin/env node
/* Adds Q33 (CPR DRABC drag-sequence) to Module 3. Theme/content addition only.
   Self-verifies and backs up. Safe to read before running. */
const fs = require('fs');
const path = 'lib/game/questions.ts';

if (!fs.existsSync(path)) { console.error('ERR: run this from the repo root (lib/game/questions.ts not found)'); process.exit(1); }
let src = fs.readFileSync(path, 'utf8');
const before = src;

if (src.includes("id: 'q33'") || src.includes('q33:')) {
  console.error('SKIP: q33 already exists. No changes made.'); process.exit(1);
}

// 1) Register q33 in module-3 questionIds
const idsRe = /(questionIds: \['q19', 'q20', 'q21')(\],)/;
if (!idsRe.test(src)) { console.error('ERR: could not find module-3 questionIds line. Aborting.'); process.exit(1); }
src = src.replace(idsRe, "$1, 'q33'$2");

// 2) Insert q33 definition right after the q21 block closes
const block = `  q33: {
    id: 'q33', moduleId: 'module-3-heart-health', order: 33, responseType: 'drag_sequence',
    prompt: bi(
      'Rearrange the correct sequence while performing CPR (DRABC).',
      'Susun semula urutan yang betul semasa melakukan CPR (DRABC).'
    ),
    steps: [
      { id: 'danger', label: bi('Danger', 'Bahaya') },
      { id: 'response', label: bi('Response', 'Gerak Balas') },
      { id: 'airway', label: bi('Airway', 'Salur Udara') },
      { id: 'breathing', label: bi('Breathing', 'Pernafasan') },
      { id: 'circulation', label: bi('Circulation', 'Sirkulasi') },
    ],
    correctOrder: ['danger', 'response', 'airway', 'breathing', 'circulation'],
    requiresManualReview: false, maxPoints: 10,
  },
`;
const blockRe = /(\n  q21: \{[\s\S]*?\n  \},\n)/;
if (!blockRe.test(src)) { console.error('ERR: could not locate q21 block. Aborting.'); process.exit(1); }
src = src.replace(blockRe, '$1' + block);

// 3) Verify
const okIds  = /questionIds: \['q19', 'q20', 'q21', 'q33'\]/.test(src);
const okDef  = src.includes("id: 'q33', moduleId: 'module-3-heart-health'");
const okOrd  = src.includes("correctOrder: ['danger', 'response', 'airway', 'breathing', 'circulation']");
const oneDef = (src.match(/\n  q33: \{/g) || []).length === 1;
if (!(okIds && okDef && okOrd && oneDef)) {
  console.error('ERR: post-edit verification failed — NOT writing. Checks:', {okIds, okDef, okOrd, oneDef});
  process.exit(1);
}

fs.writeFileSync(path + '.bak', before);
fs.writeFileSync(path, src);
console.log('OK: Q33 added (Module 3, drag_sequence DRABC).');
console.log('   - module-3 questionIds now include q33');
console.log('   - q33 definition inserted after q21');
console.log('   Backup saved: ' + path + '.bak');
console.log('   Next: npm run build');
