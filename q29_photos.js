#!/usr/bin/env node
/* Q29: switch the single video upload to one photo per C-A-L-M step.
   Edits types/game.ts (additive) + lib/game/questions.ts. Self-verifies + backs up.
   Prompt, CALM instructions, manual review and 10 pts are untouched. */
const fs = require('fs');

function read(p){ if(!fs.existsSync(p)){ console.error('ERR: not found '+p+' (run from repo root)'); process.exit(1);} return fs.readFileSync(p,'utf8'); }

// allow running against test copies via argv
const TYPES = process.argv[2] || 'types/game.ts';
const QS    = process.argv[3] || 'lib/game/questions.ts';

let types = read(TYPES); const typesBefore = types;
let qs = read(QS); const qsBefore = qs;

// 1) MediaUploadQuestion: add optional photoSteps
const tAnchor = "  maxDurationSeconds?: number; // for video questions with a cap (e.g. Q29 = 180s)\n  instructions: Text;\n}";
if (!types.includes(tAnchor)) { console.error('ERR: MediaUploadQuestion anchor not found'); process.exit(1); }
types = types.replace(tAnchor,
  "  maxDurationSeconds?: number; // for video questions with a cap (e.g. Q29 = 180s)\n  instructions: Text;\n  photoSteps?: Array<{ id: string; label: Text }>; // when set: one photo per step (e.g. Q29 C-A-L-M)\n}");

// 2) ResponseDataByType.media_upload: allow photos[]
const rAnchor = "  media_upload: { uploadedAt: string };";
if (!types.includes(rAnchor)) { console.error('ERR: media_upload response-data anchor not found'); process.exit(1); }
types = types.replace(rAnchor,
  "  media_upload: { uploadedAt: string; photos?: Array<{ stepId: string; url: string }> };");

// 3) Q29 data: video -> 4 photo slots
const qAnchor = "    mediaKind: 'video', maxDurationSeconds: 180,";
if (!qs.includes(qAnchor)) { console.error('ERR: Q29 mediaKind anchor not found'); process.exit(1); }
const qBlock =
"    mediaKind: 'photo',\n" +
"    photoSteps: [\n" +
"      { id: 'call',   label: bi('C – Call for help', 'C – Hubungi bantuan') },\n" +
"      { id: 'assist', label: bi('A – Assist (help them sit down)', 'A – Bantu dia duduk') },\n" +
"      { id: 'look',   label: bi('L – Look (watch their condition)', 'L – Perhatikan keadaannya') },\n" +
"      { id: 'move',   label: bi('M – Move to CPR if they collapse', 'M – Mula CPR jika dia rebah') },\n" +
"    ],";
qs = qs.replace(qAnchor, qBlock);

// verify
const ok =
  types.includes('photoSteps?: Array<{ id: string; label: Text }>;') &&
  types.includes('photos?: Array<{ stepId: string; url: string }>') &&
  qs.includes("mediaKind: 'photo',") &&
  qs.includes("photoSteps: [") &&
  !qs.includes("maxDurationSeconds: 180") &&
  qs.includes("requiresManualReview: true, maxPoints: 10,");
if(!ok){ console.error('ERR: post-edit verification failed'); process.exit(1); }

fs.writeFileSync(TYPES+'.bak', typesBefore);
fs.writeFileSync(QS+'.bak', qsBefore);
fs.writeFileSync(TYPES, types);
fs.writeFileSync(QS, qs);
console.log('OK: Q29 -> 4 photo slots (C/A/L/M). Backups: '+TYPES+'.bak, '+QS+'.bak');
