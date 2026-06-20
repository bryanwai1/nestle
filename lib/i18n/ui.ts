// lib/i18n/ui.ts
//
// Every hardcoded UI string in the player-facing app lives here, in both
// languages, keyed by a dotted path. Question CONTENT (prompts, options,
// etc.) does NOT live here — that's bilingual at the source in
// lib/game/questions.ts via the `Text` type. This file is purely chrome:
// buttons, labels, empty states, helper copy.

export const UI_STRINGS = {
  // Shared
  'common.loading': { en: 'Loading…', bm: 'Memuatkan…' },
  'common.back': { en: 'Back', bm: 'Kembali' },
  'common.points': { en: 'pts', bm: 'mata' },
  'common.team': { en: 'Team', bm: 'Pasukan' },
  'common.minutes': { en: 'min', bm: 'minit' },

  // Landing page
  'landing.eyebrow': { en: 'SHE DAY 2026', bm: 'SHE DAY 2026' },
  'landing.orgName': { en: 'Nestlé Sales Region', bm: 'Nestlé Wilayah Jualan' },
  'landing.noTeamYet': { en: 'No Team Yet', bm: 'Belum Ada Pasukan' },
  'landing.category': { en: 'Safety · Health · Environment', bm: 'Keselamatan · Kesihatan · Alam Sekitar' },
  'landing.title': { en: 'SHE Day Challenge 2026', bm: 'Cabaran SHE Day 2026' },
  'landing.subtitle': {
    en: 'Complete modules, earn points and compete for Touch \u2019n Go prizes.',
    bm: 'Selesaikan modul, kumpul mata dan bersaing untuk hadiah Touch \u2019n Go.',
  },
  'landing.tag.salesRegion': { en: 'Sales Region', bm: 'Wilayah Jualan' },
  'landing.tag.teamsOf3': { en: 'Teams of 3', bm: 'Pasukan 3 Orang' },
  'landing.tag.modules': { en: '10 Modules', bm: '10 Modul' },
  'landing.tag.prizes': { en: 'TNG Prizes', bm: 'Hadiah TNG' },
  'landing.playingAs': { en: 'You\u2019re playing as', bm: 'Anda bermain sebagai' },
  'landing.continueToModules': { en: 'Continue to Modules', bm: 'Teruskan ke Modul' },

  // Team setup
  'team.setupTitle': { en: 'Set Up Your Team', bm: 'Sediakan Pasukan Anda' },
  'team.setupSubtitle': { en: 'Every team has exactly 3 members.', bm: 'Setiap pasukan ada 3 ahli.' },
  'team.createNew': { en: 'Create New Team', bm: 'Cipta Pasukan Baharu' },
  'team.joinExisting': { en: 'Join Existing Team', bm: 'Sertai Pasukan Sedia Ada' },
  'team.autoNumberNote': {
    en: 'Your team number is given automatically when you create the team.',
    bm: 'Nombor pasukan anda diberi secara automatik apabila pasukan dicipta.',
  },
  'team.member1Placeholder': { en: 'Member 1 full name', bm: 'Nama penuh Ahli 1' },
  'team.member2Placeholder': { en: 'Member 2 full name', bm: 'Nama penuh Ahli 2' },
  'team.member3Placeholder': { en: 'Member 3 full name', bm: 'Nama penuh Ahli 3' },
  'team.morningSession': { en: 'Morning session', bm: 'Sesi Pagi' },
  'team.afternoonSession': { en: 'Afternoon session', bm: 'Sesi Petang' },
  'team.create': { en: 'Create Team', bm: 'Cipta Pasukan' },
  'team.creating': { en: 'Creating…', bm: 'Mencipta…' },
  'team.allNamesRequired': { en: 'All three member names are needed.', bm: 'Ketiga-tiga nama ahli diperlukan.' },
  'team.createError': { en: 'Could not create team. Please try again.', bm: 'Tidak dapat cipta pasukan. Sila cuba lagi.' },
  'team.selectYourTeam': { en: 'Select your team\u2026', bm: 'Pilih pasukan anda\u2026' },
  'team.join': { en: 'Join Team', bm: 'Sertai Pasukan' },
  'team.joining': { en: 'Joining…', bm: 'Menyertai…' },
  'team.chooseFromList': { en: 'Please choose your team from the list.', bm: 'Sila pilih pasukan anda dari senarai.' },
  'team.joinError': { en: 'Could not join team. Please try again.', bm: 'Tidak dapat sertai pasukan. Sila cuba lagi.' },

  // Leaderboard
  'leaderboard.title': { en: 'Live Scoreboard', bm: 'Papan Markah Langsung' },
  'leaderboard.top': { en: 'Top', bm: 'Teratas' },
  'leaderboard.empty': { en: 'No teams yet — be the first!', bm: 'Belum ada pasukan — jadilah yang pertama!' },
  'leaderboard.members': { en: 'Members', bm: 'Ahli' },
  'leaderboard.score': { en: 'Score', bm: 'Markah' },

  // Module hub
  'hub.chooseModule': { en: 'Choose a module', bm: 'Pilih satu modul' },
  'hub.status.notStarted': { en: 'Not started', bm: 'Belum Mula' },
  'hub.status.inProgress': { en: 'In progress', bm: 'Sedang Berjalan' },
  'hub.status.completed': { en: 'Completed', bm: 'Selesai' },
  'hub.anonymousCheckIn': { en: 'Anonymous check-in', bm: 'Soal Selidik Tanpa Nama' },
  'hub.questionsCount': { en: 'questions', bm: 'soalan' },
  'hub.freeChoice': {
    en: 'Pick any module — there\u2019s no fixed order.',
    bm: 'Pilih mana-mana modul — tiada susunan tetap.',
  },

  // Module play page
  'play.allModules': { en: 'All modules', bm: 'Semua Modul' },
  'play.notFound': { en: 'Module not found.', bm: 'Modul tidak dijumpai.' },
  'play.backToModules': { en: 'Back to modules', bm: 'Kembali ke Modul' },

  // Question runner
  'runner.questionOf': { en: 'Question {current} of {total}', bm: 'Soalan {current} daripada {total}' },
  'runner.noStandardFlow': {
    en: 'This module doesn\u2019t use the standard question flow.',
    bm: 'Modul ini tidak menggunakan aliran soalan biasa.',
  },

  // Module complete screen
  'complete.title': { en: 'Module submitted', bm: 'Modul Dihantar' },
  'complete.answersRecorded': { en: 'answer(s) recorded for', bm: 'jawapan direkodkan untuk' },
  'complete.pointsSoFar': { en: 'points so far this module', bm: 'mata setakat ini' },
  'complete.awaitingReview': { en: 'awaiting facilitator review', bm: 'menunggu semakan fasilitator' },
  'complete.liveUpdateNote': {
    en: 'Your live score updates by itself once facilitators finish checking your answers.',
    bm: 'Markah anda akan dikemas kini secara automatik selepas fasilitator selesai menyemak jawapan.',
  },
  'complete.startModule': { en: 'Start Module', bm: 'Mula Modul' },
  'complete.allDone': { en: 'That was the last module — great job!', bm: 'Itu modul terakhir — syabas!' },
  'complete.backToLeaderboard': { en: 'Back to leaderboard', bm: 'Kembali ke Papan Markah' },

  // QR privacy flow (Module 4)
  'mh.moduleLabel': { en: 'Module 4 · Stress & Mental Health', bm: 'Modul 4 · Tekanan & Kesihatan Mental' },
  'mh.privateTitle': { en: 'This part is just for you', bm: 'Bahagian ini khas untuk anda' },
  'mh.privateDescription': {
    en: 'Scan the code with your own phone for a short, private check-in. Nobody on your team or the organizers will see your personal answers — only the group\u2019s overall trend.',
    bm: 'Imbas kod ini dengan telefon anda sendiri untuk soal selidik ringkas dan sulit. Tiada sesiapa dalam pasukan atau penganjur akan nampak jawapan peribadi anda — hanya trend keseluruhan kumpulan.',
  },
  'mh.remaining': { en: 'remaining', bm: 'lagi' },
  'mh.everyoneSubmitted': { en: 'Everyone\u2019s done — continue', bm: 'Semua sudah selesai — teruskan' },
  'mh.thanksTitle': { en: 'Thank you for taking a moment for yourself', bm: 'Terima kasih kerana meluangkan masa untuk diri sendiri' },
  'mh.thanksSubtitle': {
    en: 'Your individual result stays private — only your group\u2019s overall trend is shared with organizers.',
    bm: 'Keputusan peribadi anda kekal sulit — hanya trend keseluruhan kumpulan dikongsi dengan penganjur.',
  },

  // Mental health assessment route
  'mh.checkinTitle': { en: 'Mental Health Check-in', bm: 'Soal Selidik Kesihatan Mental' },
  'mh.checkinDescription': {
    en: 'Rate each statement based on the last 2 weeks. This is anonymous — only your team\u2019s overall result is shared.',
    bm: 'Nilaikan setiap kenyataan berdasarkan 2 minggu lepas. Ini adalah tanpa nama — hanya keputusan keseluruhan pasukan dikongsi.',
  },
  'mh.scale.never': { en: 'Never', bm: 'Tidak Pernah' },
  'mh.scale.sometimes': { en: 'Sometimes', bm: 'Kadang-kadang' },
  'mh.scale.often': { en: 'Often', bm: 'Selalu' },
  'mh.scale.almostAlways': { en: 'Almost Always', bm: 'Hampir Selalu' },
  'mh.submitPrivately': { en: 'Submit privately', bm: 'Hantar Secara Sulit' },
  'mh.submitting': { en: 'Submitting…', bm: 'Menghantar…' },
  'mh.scoreLabel': { en: 'Your score', bm: 'Markah anda' },
  'mh.keptPrivate': { en: 'kept completely private', bm: 'kekal sepenuhnya sulit' },
  'mh.crisisNote': {
    en: 'If things feel like too much right now, Talian Kasih (15999) and Befrienders KL (03-7627 2929) are available any time, in confidence.',
    bm: 'Jika anda rasa terlalu tertekan sekarang, Talian Kasih (15999) dan Befrienders KL (03-7627 2929) sedia membantu pada bila-bila masa, secara sulit.',
  },
  'mh.closeTab': { en: 'You can close this tab now.', bm: 'Anda boleh tutup tab ini sekarang.' },

  // Generic input chrome (shared across question input components)
  'input.submitAnswer': { en: 'Submit Answer', bm: 'Hantar Jawapan' },
  'input.uploading': { en: 'Uploading…', bm: 'Memuat naik…' },
  'input.retake': { en: 'Retake', bm: 'Ambil Semula' },
  'input.undoLastTap': { en: 'Undo last tap', bm: 'Buang Tanda Terakhir' },
  'input.clearAll': { en: 'Clear all', bm: 'Kosongkan Semua' },
  'input.tapHazardHint': { en: 'Tap every hazard you spot. You\u2019ve flagged {count} / {target} expected.', bm: 'Ketik setiap bahaya yang anda nampak. Anda telah tanda {count} / {target} dijangka.' },
  'input.typeAnswer': { en: 'Type your answer in a few words.', bm: 'Taip jawapan anda dalam beberapa patah perkataan.' },
  'input.answerPlaceholder': { en: 'Your answer…', bm: 'Jawapan anda…' },
  'input.arrangeSteps': { en: 'Arrange the steps in the correct order, top to bottom.', bm: 'Susun langkah mengikut turutan yang betul, atas ke bawah.' },
  'input.tapToMatchHint': { en: 'Tap an item on the left, then tap its match on the right.', bm: 'Ketik item di kiri, kemudian ketik pasangannya di kanan.' },
  'input.selectAllCorrect': { en: 'Select every box that really belongs — {count} selected.', bm: 'Pilih semua kotak yang betul — {count} dipilih.' },
  'input.fillBlanks': { en: 'Fill in {required} answer(s) — {filled} of {required} done.', bm: 'Isi {required} jawapan — {filled} daripada {required} selesai.' },
  'input.quickPicks': { en: 'Quick picks', bm: 'Pilihan Pantas' },
  'input.anythingElse': { en: 'Anything else you\u2019d like to add? (optional)', bm: 'Ada perkara lain ingin ditambah? (pilihan)' },
  'input.tapItemThenColumn': { en: 'Tap an item below, then tap the column it belongs in.', bm: 'Ketik item di bawah, kemudian ketik lajur yang sesuai.' },
  'input.formula': { en: 'Formula', bm: 'Formula' },
  'input.enterYourAnswer': { en: 'Enter your answer', bm: 'Masukkan jawapan anda' },
  'input.tapFoodThenPlate': {
    en: 'Tap a food card, then tap the plate section it belongs in. Stay within RM{limit}.',
    bm: 'Ketik kad makanan, kemudian ketik bahagian pinggan yang sesuai. Pastikan tidak melebihi RM{limit}.',
  },
  'input.withinBudget': { en: 'within budget', bm: 'dalam bajet' },
  'input.overBudget': { en: 'over budget', bm: 'melebihi bajet' },
  'input.spellExactly': { en: 'Spell out each step exactly — one word per box.', bm: 'Eja setiap langkah dengan tepat — satu perkataan setiap kotak.' },
  'input.step': { en: 'Step', bm: 'Langkah' },
  'input.tapItemThenCategory': { en: 'Tap an item, then tap the correct category.', bm: 'Ketik item, kemudian ketik kategori yang betul.' },
  'input.answerNumber': { en: 'Answer', bm: 'Jawapan' },
  'input.takePhoto': { en: 'Tap to take a photo', bm: 'Ketik untuk ambil gambar' },
  'input.recordVideo': { en: 'Tap to record a video', bm: 'Ketik untuk rakam video' },

  // Language toggle
  'lang.toggleLabel': { en: 'Language', bm: 'Bahasa' },
} as const;

export type UIKey = keyof typeof UI_STRINGS;

/** Simple {placeholder} interpolation — kept tiny on purpose, no library. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
