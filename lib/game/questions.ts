// lib/game/questions.ts
//
// Single source of truth for game content, fully bilingual. English wording
// is kept short and plain (everyday words, short sentences) rather than
// formal/technical phrasing, since this is read on a phone screen under a
// countdown timer. Bahasa Malaysia translations sit right next to the
// English for every field — see types/game.ts's `Text` type, which makes it
// a compile error to add a question and forget one language.
//
// Numbering (q1-q32) matches the facilitator's run sheet from the briefing
// deck. Anything marked TODO needs a real asset (photo/video) the
// organizers supply.

import type { GameModule, GameQuestion } from '@/types/game';

/** Tiny authoring helper — `bi('English', 'Bahasa Malaysia')`. Not exported;
 * just saves writing `{ en: ..., bm: ... }` forty times below. */
function bi(en: string, bm: string) {
  return { en, bm };
}

export const MODULES: GameModule[] = [
  {
    id: 'module-1-safe-driving', index: 1,
    title: bi('Safe Driving', 'Memandu Selamat'),
    timerSeconds: 25 * 60,
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'],
  },
  {
    id: 'module-2-stf', index: 2,
    title: bi('Slips, Trips & Falls', 'Tergelincir, Tersandung & Terjatuh'),
    timerSeconds: 10 * 60,
    questionIds: ['q16', 'q17', 'q18'],
  },
  {
    id: 'module-3-heart-health', index: 3,
    title: bi('Heart Health', 'Kesihatan Jantung'),
    timerSeconds: 10 * 60,
    questionIds: ['q19', 'q20', 'q21'],
  },
  {
    id: 'module-4-mental-health', index: 4,
    title: bi('Stress and Mental Health', 'Tekanan & Kesihatan Mental'),
    timerSeconds: 5 * 60,
    questionIds: [], // handled by <QRPrivacyFlow>, not the generic question loop
  },
  {
    id: 'module-5-ergonomics', index: 5,
    title: bi('Ergonomics & Lifting', 'Ergonomik & Mengangkat Barang'),
    timerSeconds: 8 * 60,
    questionIds: ['q22', 'q23'],
  },
  {
    id: 'module-6-exercise', index: 6,
    title: bi('Exercise and Stretching', 'Senaman & Regangan'),
    timerSeconds: 10 * 60,
    questionIds: ['q24', 'q25', 'q26', 'q27'],
  },
  {
    id: 'module-7-balanced-diet', index: 7,
    title: bi('Balanced Diet', 'Pemakanan Seimbang'),
    timerSeconds: 2 * 60,
    questionIds: ['q28'],
  },
  {
    id: 'module-8-medical-emergency', index: 8,
    title: bi('Medical Emergency Drill', 'Latihan Kecemasan Perubatan'),
    timerSeconds: 20 * 60,
    questionIds: ['q29'],
  },
  {
    id: 'module-9-fire-emergency', index: 9,
    title: bi('Fire Emergency Plan', 'Pelan Kecemasan Kebakaran'),
    timerSeconds: 2 * 60,
    questionIds: ['q30'],
  },
  {
    id: 'module-10-plastic-recycling', index: 10,
    title: bi('Plastic Recycling', 'Kitar Semula Plastik'),
    timerSeconds: 5 * 60,
    questionIds: ['q31', 'q32'],
  },
];

export const QUESTIONS: Record<string, GameQuestion> = {
  // ===================== MODULE 1 — SAFE DRIVING =====================
  q1: {
    id: 'q1', moduleId: 'module-1-safe-driving', order: 1, responseType: 'multiple_choice',
    prompt: bi('Before you drive, which 6 things must you check on your car?', 'Sebelum memandu, apakah 6 perkara yang perlu anda periksa pada kereta?'),
    options: [
      bi('Brake, Lights, Wipers, Horn, Side mirrors, Tyres', 'Brek, Lampu, Pengelap cermin, Hon, Cermin sisi, Tayar'),
      bi('Brake, Fuel level, Wipers, Horn, Air-conditioning, Tyres', 'Brek, Paras minyak, Pengelap cermin, Hon, Penyaman udara, Tayar'),
      bi('Lights, Wipers, Horn, Side mirrors, Tyres, Seat position', 'Lampu, Pengelap cermin, Hon, Cermin sisi, Tayar, Kedudukan tempat duduk'),
      bi('Brake, Lights, Engine oil, Horn, Side mirrors, Radio', 'Brek, Lampu, Minyak enjin, Hon, Cermin sisi, Radio'),
      bi('Brake, Lights, Wipers, GPS, Side mirrors, Tyres', 'Brek, Lampu, Pengelap cermin, GPS, Cermin sisi, Tayar'),
      bi('Fuel level, Lights, Wipers, Horn, Side mirrors, Tyres', 'Paras minyak, Lampu, Pengelap cermin, Hon, Cermin sisi, Tayar'),
    ],
    correctOptionIndex: 0,
    requiresManualReview: false, maxPoints: 10,
  },
  q2: {
    id: 'q2', moduleId: 'module-1-safe-driving', order: 2, responseType: 'multiple_choice',
    prompt: bi('On a long drive, how often must you stop and rest?', 'Semasa perjalanan jauh, berapa kerap anda perlu berhenti berehat?'),
    options: [
      bi('A 5-minute pause every hour', 'Berhenti 5 minit setiap sejam'),
      bi('A 15-minute break after every 2 hours of driving', 'Rehat 15 minit selepas setiap 2 jam memandu'),
      bi('A 30-minute break after every 4 hours of driving', 'Rehat 30 minit selepas setiap 4 jam memandu'),
      bi('No break needed if the driver feels alert', 'Tidak perlu rehat jika pemandu rasa segar'),
      bi('A 10-minute break after every 3 hours', 'Rehat 10 minit selepas setiap 3 jam'),
      bi('A 1-hour break after every 5 hours', 'Rehat 1 jam selepas setiap 5 jam'),
    ],
    correctOptionIndex: 1,
    requiresManualReview: false, maxPoints: 10,
  },
  q3: {
    id: 'q3', moduleId: 'module-1-safe-driving', order: 3, responseType: 'visual_sort',
    prompt: bi(
      'If you feel sleepy while driving, which actions should you take? Select ALL correct ones.',
      'Jika anda rasa mengantuk semasa memandu, tindakan manakah yang perlu diambil? Pilih SEMUA yang betul.'
    ),
    correctChoices: [
      { id: 'c_stop_rest',    text: bi('Stop and rest right away', 'Berhenti dan berehat segera') },
      { id: 'c_short_nap',   text: bi('Pull over to take a short nap', 'Berhenti untuk tidur sebentar') },
      { id: 'c_stretching',  text: bi('Pull over and do some stretching', 'Berhenti untuk melakukan regangan') },
    ],
    trapChoices: [
      { id: 't_radio',       text: bi('Increase the radio volume', 'Besarkan volum radio') },
      { id: 't_window',      text: bi('Open the window for fresh air', 'Buka tingkap untuk udara segar') },
      { id: 't_slow',        text: bi('Keep driving but go slower', 'Teruskan memandu, hanya lebih perlahan') },
      { id: 't_caffeine',    text: bi('Drink a caffeine drink and continue', 'Minum minuman berkafein dan teruskan') },
      { id: 't_aircon',      text: bi('Turn air-conditioning to max', 'Pasang penyaman udara pada tahap maksimum') },
    ],
    requiresManualReview: false, maxPoints: 10,
  },
  q4: {
    id: 'q4', moduleId: 'module-1-safe-driving', order: 4, responseType: 'video_avoid',
    prompt: bi(
      'What is the name of the safe-following-distance rule? Type it below.',
      'Apakah nama peraturan jarak selamat dengan kenderaan di hadapan? Taip jawapan anda.'
    ),
    acceptedKeywords: ['3 second rule', '3-second rule', 'three second rule', 'peraturan 3 saat', '3 saat', 'tiga saat', '3-saat', 'three-second'],
    requiresManualReview: true, maxPoints: 10,
  },
  q5: {
    id: 'q5', moduleId: 'module-1-safe-driving', order: 5, responseType: 'math_input',
    prompt: bi(
      'How many seconds gap must you keep from the car in front? Type your answer.',
      'Berapa saat jarak yang perlu anda kekalkan daripada kereta di hadapan? Taip jawapan anda.'
    ),
    formulaDisplay: bi('Safe following distance = __ seconds', 'Jarak selamat = __ saat'),
    expectedValue: 3, tolerance: 0,
    requiresManualReview: false, maxPoints: 10,
  },
q6: {
    id: 'q6', moduleId: 'module-1-safe-driving', order: 6, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q6-fatigue.mp4',
    acceptedKeywords: [
      'dozing off', 'dozing', 'sleeping', 'asleep', 'fatigue', 'drowsy', 'drowsiness', 'mengantuk', 'tidur', 'keletihan', 'penat',
      'manage fatigue', 'sufficient rest', 'rest', 'well-rested', 'well rested', 'take breaks', 'fatigue management', 'urus keletihan', 'rehat secukupnya', 'berehat', 'cukup rehat'
    ],
    requiresManualReview: true, maxPoints: 20,
  },
  q7: {
    id: 'q7', moduleId: 'module-1-safe-driving', order: 7, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q8-seatbelt.mp4',
    acceptedKeywords: [
      'not wearing seatbelt', 'no seatbelt', 'seatbelt', 'seat belt', 'tidak pakai tali pinggang keledar', 'tiada tali pinggang keledar', 'tali pinggang keledar',
      'fasten seatbelt', 'wear seatbelt', 'wear seat belt', 'buckle up', 'put on seatbelt', 'pakai tali pinggang keledar', 'ikat tali pinggang keledar'
    ],
    requiresManualReview: true, maxPoints: 20,
  },
  q8: {
    id: 'q8', moduleId: 'module-1-safe-driving', order: 8, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q10-distracted.mp4',
    acceptedKeywords: [
      'distracted', 'texting', 'handphone', 'mobile', 'phone', 'not paying attention', 'using phone', 'leka', 'bertelefon', 'guna telefon', 'tidak fokus',
      'not using handphone', 'focus', 'pay attention', 'no handphone', 'not texting', 'put phone away', 'avoid phone', 'jangan guna telefon', 'fokus', 'beri perhatian', 'tumpukan perhatian'
    ],
    requiresManualReview: true, maxPoints: 20,
  },
  q9: {
    id: 'q9', moduleId: 'module-1-safe-driving', order: 9, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q12-reckless.mp4',
    acceptedKeywords: [
      'rushing', 'reckless driving', 'reckless', 'unsafe driving', 'dangerous', 'speeding', 'tergesa-gesa', 'memandu cuai', 'memandu merbahaya', 'laju',
      'drive safely', 'avoid reckless driving', 'slow down', 'do not rush', "don't rush", 'memandu dengan selamat', 'elak memandu cuai', 'perlahankan'
    ],
    requiresManualReview: true, maxPoints: 20,
  },
  q10: {
    id: 'q10', moduleId: 'module-1-safe-driving', order: 10, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q14-mirror.mp4',
    acceptedKeywords: [
      'not checking mirror', 'side mirror', 'no signal', 'no indicator', 'blind spot', 'not signaling', 'tidak periksa cermin', 'cermin sisi', 'tiada isyarat', 'bintik buta',
      'scan side mirror', 'give signal', 'give indicator', 'check mirrors', 'use indicator', 'use signal', 'periksa cermin sisi', 'beri isyarat', 'guna lampu isyarat'
    ],
    requiresManualReview: true, maxPoints: 20,
  },
  // ===================== MODULE 2 — STF =====================
  q16: {
    id: 'q16', moduleId: 'module-2-stf', order: 16, responseType: 'media_upload',
    prompt: bi('Find 1 slip, trip or fall hazard in the office. Take a photo of it.', 'Cari 1 bahaya tergelincir, tersandung atau terjatuh di pejabat. Ambil gambar bahaya itu.'),
    instructions: bi(
      'Take a real photo of a hazard you can see right now, then describe it in one sentence.',
      'Ambil gambar sebenar bahaya yang anda nampak sekarang, kemudian terangkan dalam satu ayat.'
    ),
    mediaKind: 'photo',
    requiresManualReview: true, maxPoints: 10,
  },
  q17: {
    id: 'q17', moduleId: 'module-2-stf', order: 17, responseType: 'hazard_canvas',
    prompt: bi(
      'Tap every hazard you can find in this photo. Some spots look risky but aren’t.',
      'Ketik setiap bahaya yang anda jumpa dalam gambar ini. Sesetengah tempat kelihatan berbahaya tetapi sebenarnya tidak.'
    ),
    imageUrl: '/hazards/office-1.png',
    targetHazardCount: 5,
    hazards: [
      { id: 'h1', x: 36, y: 65, radius: 9, label: bi('Open drawer protruding into walkway', 'Laci terbuka menganjur ke laluan') },
      { id: 'h2', x: 48, y: 61, radius: 7, label: bi('Power cable trailing across walkway', 'Wayar kuasa merentasi laluan') },
      { id: 'h3', x: 59, y: 57, radius: 7, label: bi('Coffee spill, no wet-floor sign', 'Kopi tertumpah, tiada tanda lantai basah') },
      { id: 'h4', x: 74, y: 52, radius: 10, label: bi('Boxes stacked too high and leaning', 'Kotak bertindan terlalu tinggi dan condong') },
      { id: 'h5', x: 25, y: 82, radius: 7, label: bi('Overloaded power strip under desk', 'Soket kuasa berlebihan di bawah meja') },
    ],
    decoyZones: [],
    requiresManualReview: true, maxPoints: 10,
  },
  q18: {
    id: 'q18', moduleId: 'module-2-stf', order: 18, responseType: 'drag_sequence',
    prompt: bi(
      'A worker needs to take products off the shelf marked with a circle. Put these safety steps in the right order.',
      'Seorang pekerja perlu mengambil produk dari rak yang ditanda dengan bulatan. Susun langkah keselamatan ini mengikut turutan yang betul.'
    ),
    steps: [
      { id: 'clear_aisles', label: bi('Clear the aisle / remove obstructions', 'Pastikan laluan bersih / alihkan halangan') },
      { id: 'inspect_ladder', label: bi('Check the ladder is in good condition', 'Periksa keadaan tangga') },
      { id: 'hold_ladder', label: bi('Have someone hold the ladder', 'Minta seseorang pegang tangga') },
      { id: 'confirm_floor', label: bi('Make sure the floor is not slippery', 'Pastikan lantai tidak licin') },
    ],
    correctOrder: ['clear_aisles', 'inspect_ladder', 'hold_ladder', 'confirm_floor'],
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 3 — HEART HEALTH =====================
  q19: {
    id: 'q19', moduleId: 'module-3-heart-health', order: 19, responseType: 'classification_matrix',
    prompt: bi(
      'Sort each fact into the correct box — Heart Attack or Cardiac Arrest.',
      'Susun setiap fakta ke dalam kotak yang betul — Serangan Jantung atau Henti Jantung.'
    ),
    categories: [
      { id: 'heart_attack',   label: bi('❤️ Heart Attack',   '❤️ Serangan Jantung') },
      { id: 'cardiac_arrest', label: bi('⚡ Cardiac Arrest', '⚡ Henti Jantung') },
    ],
    items: [
      { id: 'blood_flow_blocked', label: bi('Blood flow blocked',       'Aliran darah tersekat'),          correctCategory: 'heart_attack' },
      { id: 'circulation_problem',label: bi('Circulation problem',       'Masalah peredaran darah'),         correctCategory: 'heart_attack' },
      { id: 'conscious',          label: bi('Usually still conscious',   'Biasanya masih sedar'),            correctCategory: 'heart_attack' },
      { id: 'develops_slowly',    label: bi('Symptoms build up slowly',  'Gejala muncul perlahan-lahan'),    correctCategory: 'heart_attack' },
      { id: 'fast_medical',       label: bi('Needs fast medical care',   'Perlu rawatan perubatan segera'),  correctCategory: 'heart_attack' },
      { id: 'heart_stops',        label: bi('Heart stops beating',       'Jantung berhenti berdegup'),       correctCategory: 'cardiac_arrest' },
      { id: 'electrical',         label: bi('Electrical problem',        'Masalah elektrik'),                correctCategory: 'cardiac_arrest' },
      { id: 'unconscious',        label: bi('Unconscious',               'Tidak sedarkan diri'),             correctCategory: 'cardiac_arrest' },
      { id: 'happens_suddenly',   label: bi('Happens all of a sudden',   'Berlaku secara tiba-tiba'),        correctCategory: 'cardiac_arrest' },
      { id: 'needs_cpr',          label: bi('Needs CPR right away',      'Perlukan CPR serta-merta'),        correctCategory: 'cardiac_arrest' },
    ],
    requiresManualReview: false, maxPoints: 10,
  },
  q20: {
    id: 'q20', moduleId: 'module-3-heart-health', order: 20, responseType: 'visual_sort',
    prompt: bi(
      'Pick the habits that are really good for your heart. Some choices are wrong on purpose.',
      'Pilih tabiat yang benar-benar baik untuk jantung anda. Sesetengah pilihan sengaja dibuat salah.'
    ),
    correctChoices: [
      { id: 'c1', text: bi('Eat heart-healthy food (fruit, vegetables, whole grains, fish)', 'Makan makanan sihat untuk jantung (buah-buahan, sayur-sayuran, bijirin penuh, ikan)') },
      { id: 'c2', text: bi('Be active every day (about 150 minutes a week)', 'Aktif setiap hari (kira-kira 150 minit seminggu)') },
      { id: 'c3', text: bi('Keep a healthy weight', 'Kekalkan berat badan yang sihat') },
      { id: 'c4', text: bi('Don\u2019t smoke', 'Jangan merokok') },
      { id: 'c5', text: bi('Keep blood pressure, cholesterol and sugar in check', 'Kawal tekanan darah, kolesterol dan gula dalam darah') },
      { id: 'c6', text: bi('Manage stress and sleep 7-8 hours a night', 'Urus tekanan dan tidur 7-8 jam setiap malam') },
      { id: 'c7', text: bi('Go for regular health check-ups', 'Buat pemeriksaan kesihatan secara berkala') },
      { id: 'c8', text: bi('Drink enough water every day', 'Minum air yang cukup setiap hari') },
      { id: 'c9', text: bi('Avoid sitting for too long', 'Elakkan duduk terlalu lama') },
      { id: 'c10', text: bi('Stay close to family and friends, keep a positive mind', 'Kekal rapat dengan keluarga dan rakan, kekalkan fikiran positif') },
    ],
    trapChoices: [
      { id: 't1', text: bi('Carry extra weight', 'Berat badan berlebihan') },
      { id: 't2', text: bi('Smoke', 'Merokok') },
      { id: 't3', text: bi('Sleep less than 7 hours a night', 'Tidur kurang daripada 7 jam semalam') },
      { id: 't4', text: bi('Don\u2019t drink enough water', 'Tidak minum air yang cukup') },
      { id: 't5', text: bi('Stay stressed', 'Kekal tertekan') },
      { id: 't6', text: bi('Stay anxious', 'Kekal cemas') },
      { id: 't7', text: bi('Eat oily food', 'Makan makanan berminyak') },
      { id: 't8', text: bi('Eat a lot of red meat', 'Makan banyak daging merah') },
    ],
    requiresManualReview: false, maxPoints: 10,
  },
  q21: {
    id: 'q21', moduleId: 'module-3-heart-health', order: 21, responseType: 'subjective_select',
    prompt: bi('Name 4 tests that check your heart health.', 'Namakan 4 ujian yang memeriksa kesihatan jantung anda.'),
    acceptableAnswers: [
      { id: 'a1', text: bi('Stress Test', 'Ujian Tekanan (Stress Test)') },
      { id: 'a2', text: bi('ECG', 'ECG') },
      { id: 'a3', text: bi('CT Scan (CT Coronary Angiography)', 'Imbasan CT (CT Coronary Angiography)') },
      { id: 'a4', text: bi('Angiogram (Coronary Angiogram)', 'Angiogram (Coronary Angiogram)') },
    ],
    minCorrectRequired: 4, freeText: true,
    requiresManualReview: true, maxPoints: 10,
  },

  // ===================== MODULE 5 — ERGONOMICS =====================
  q22: {
    id: 'q22', moduleId: 'module-5-ergonomics', order: 22, responseType: 'media_upload',
    prompt: bi('Record a team member lifting a heavy box the safe way.', 'Rakam seorang ahli pasukan mengangkat kotak berat dengan cara yang selamat.'),
    instructions: bi(
      'Use your legs, not your back. Feet shoulder-width apart, knees bent, box close to your body.',
      'Gunakan kaki, bukan belakang. Kaki selebar bahu, lutut dibengkokkan, kotak dekat dengan badan.'
    ),
    mediaKind: 'video',
    requiresManualReview: true, maxPoints: 10,
  },
  q23: {
    id: 'q23', moduleId: 'module-5-ergonomics', order: 23, responseType: 'media_upload',
    prompt: bi('Take a photo of the correct sitting position at a desk.', 'Ambil gambar kedudukan duduk yang betul di meja kerja.'),
    instructions: bi(
      'Back straight and supported, screen at eye level, elbows at about 90°, feet flat on the floor.',
      'Belakang lurus dan disokong, skrin pada paras mata, siku pada sudut lebih kurang 90°, kaki rata di lantai.'
    ),
    mediaKind: 'photo',
    requiresManualReview: true, maxPoints: 10,
  },

  // ===================== MODULE 6 — EXERCISE & STRETCHING =====================
  q24: {
    id: 'q24', moduleId: 'module-6-exercise', order: 24, responseType: 'media_upload',
    prompt: bi('Record a 10-second video of a correct squat.', 'Rakam video 10 saat menunjukkan squat yang betul.'),
    instructions: bi('Feet shoulder-width apart, chest up, knees in line with your toes.', 'Kaki selebar bahu, dada ke atas, lutut sejajar dengan jari kaki.'),
    mediaKind: 'video', maxDurationSeconds: 10,
    requiresManualReview: true, maxPoints: 10,
  },
  q25: {
    id: 'q25', moduleId: 'module-6-exercise', order: 25, responseType: 'media_upload',
    prompt: bi('Upload a photo of the correct push-up position.', 'Muat naik gambar kedudukan push-up yang betul.'),
    instructions: bi('Straight line from head to heels, hands under your shoulders.', 'Garisan lurus dari kepala ke tumit, tangan di bawah bahu.'),
    mediaKind: 'photo',
    requiresManualReview: true, maxPoints: 10,
  },
  q26: {
    id: 'q26', moduleId: 'module-6-exercise', order: 26, responseType: 'categorized_dropzone',
    prompt: bi('Sort each activity into Burn Fat, Build Muscle, or Stretching.', 'Susun setiap aktiviti ke dalam Bakar Lemak, Bina Otot, atau Regangan.'),
    categories: [
      { id: 'burn_fat', label: bi('Burn Fat', 'Bakar Lemak') },
      { id: 'build_muscle', label: bi('Build Muscle', 'Bina Otot') },
      { id: 'stretching', label: bi('Stretching', 'Regangan') },
    ],
    items: [
      { id: 'i1', label: bi('Jogging', 'Berjoging'), correctCategory: 'burn_fat', imageUrl: '/exercise/i1.png' },
      { id: 'i2', label: bi('Cycling', 'Berbasikal'), correctCategory: 'burn_fat', imageUrl: '/exercise/i2.png' },
      { id: 'i3', label: bi('Swimming', 'Berenang'), correctCategory: 'burn_fat', imageUrl: '/exercise/i3.png' },
      { id: 'i4', label: bi('Dancing', 'Menari'), correctCategory: 'burn_fat', imageUrl: '/exercise/i4.png' },
      { id: 'i5', label: bi('Squat', 'Squat'), correctCategory: 'build_muscle', imageUrl: '/exercise/i5.png' },
      { id: 'i6', label: bi('Push-up', 'Tekan Tubi'), correctCategory: 'build_muscle', imageUrl: '/exercise/i6.png' },
      { id: 'i7', label: bi('Deadlift', 'Deadlift'), correctCategory: 'build_muscle', imageUrl: '/exercise/i7.png' },
      { id: 'i8', label: bi('Hamstring Stretch', 'Regangan Hamstring'), correctCategory: 'stretching', imageUrl: '/exercise/i8.png' },
      { id: 'i9', label: bi('Shoulder Stretch', 'Regangan Bahu'), correctCategory: 'stretching', imageUrl: '/exercise/i9.png' },
      { id: 'i10', label: bi('Calf Stretch', 'Regangan Betis'), correctCategory: 'stretching', imageUrl: '/exercise/i10.png' },
    ],
    requiresManualReview: false, maxPoints: 10,
  },
  q27: {
    id: 'q27', moduleId: 'module-6-exercise', order: 27, responseType: 'math_input',
    prompt: bi('A 50-year-old man goes jogging. Work out his Max Heart Rate.', 'Seorang lelaki berusia 50 tahun pergi berjoging. Kira Kadar Denyutan Jantung Maksimum beliau.'),
    // formulaDisplay intentionally blank — players must recall the formula themselves
    formulaDisplay: bi('', ''), expectedValue: 170, tolerance: 0,
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 7 — BALANCED DIET =====================
  q28: {
    id: 'q28', moduleId: 'module-7-balanced-diet', order: 28, responseType: 'budget_canvas',
    prompt: bi(
      'Build a healthy plate using Suku-Suku Separuh (½ vegetables & fruit, ¼ protein, ¼ carbs). Don’t spend more than RM12.',
      'Bina pinggan sihat menggunakan Suku-Suku Separuh (½ sayur & buah, ¼ protein, ¼ karbohidrat). Jangan belanja lebih daripada RM12.'
    ),
    budgetLimitRM: 12,
    quadrants: [
      { id: 'veg_fruit', label: bi('Vegetables + Fruit', 'Sayur-sayuran + Buah-buahan'), fraction: 0.5 },
      { id: 'protein', label: bi('Protein', 'Protein'), fraction: 0.25 },
      { id: 'carb', label: bi('Carbs', 'Karbohidrat'), fraction: 0.25 },
    ],
    foodCards: [
      // ----- protein -----
      { id: 'f5',  label: bi('Grilled chicken', 'Ayam Panggang'),   category: 'protein',   costRM: 4,   calories: 165, imageUrl: '/food/chicken.png' },
      { id: 'f6',  label: bi('Boiled egg', 'Telur Rebus'),          category: 'protein',   costRM: 1,   calories: 78,  imageUrl: '/food/egg.png' },
      { id: 'f7',  label: bi('Grilled fish', 'Ikan Panggang'),      category: 'protein',   costRM: 5,   calories: 140, imageUrl: '/food/fish.png' },
      { id: 'f8',  label: bi('Tofu', 'Tauhu'),                      category: 'protein',   costRM: 2,   calories: 80,  imageUrl: '/food/tofu.png' },
      { id: 'f12', label: bi('Tempeh', 'Tempe'),                    category: 'protein',   costRM: 2,   calories: 190, imageUrl: '/food/tempeh.png' },
      { id: 'f13', label: bi('Prawns', 'Udang'),                    category: 'protein',   costRM: 5,   calories: 99,  imageUrl: '/food/prawns.png' },
      // ----- vegetables + fruit -----
      { id: 'f1',  label: bi('Mixed vegetables', 'Sayur Campur'),   category: 'veg_fruit', costRM: 2,   calories: 40,  imageUrl: '/food/mixed_veg.png' },
      { id: 'f14', label: bi('Kangkung', 'Kangkung'),               category: 'veg_fruit', costRM: 2,   calories: 30,  imageUrl: '/food/kangkung.png' },
      { id: 'f2',  label: bi('Banana', 'Pisang'),                   category: 'veg_fruit', costRM: 1,   calories: 90,  imageUrl: '/food/banana.png' },
      { id: 'f15', label: bi('Papaya', 'Betik'),                    category: 'veg_fruit', costRM: 1.5, calories: 60,  imageUrl: '/food/papaya.png' },
      { id: 'f4',  label: bi('Watermelon slice', 'Sepotong Tembikai'), category: 'veg_fruit', costRM: 1, calories: 30, imageUrl: '/food/watermelon.png' },
      { id: 'f3',  label: bi('Apple', 'Epal'),                      category: 'veg_fruit', costRM: 1.5, calories: 95,  imageUrl: '/food/apple.png' },
      // ----- carbs -----
      { id: 'f9',  label: bi('Brown rice', 'Nasi Perang'),         category: 'carb',      costRM: 2,   calories: 215, imageUrl: '/food/brown_rice.png' },
      { id: 'f16', label: bi('White rice', 'Nasi Putih'),          category: 'carb',      costRM: 1.5, calories: 200, imageUrl: '/food/white_rice.png' },
      { id: 'f11', label: bi('Sweet potato', 'Keledek'),           category: 'carb',      costRM: 1.5, calories: 90,  imageUrl: '/food/sweet_potato.png' },
      { id: 'f10', label: bi('Wholemeal bread', 'Roti Gandum Penuh'), category: 'carb',   costRM: 1.5, calories: 70,  imageUrl: '/food/wholemeal_bread.png' },
      { id: 'f17', label: bi('Chapati', 'Capati'),                 category: 'carb',      costRM: 1.5, calories: 120, imageUrl: '/food/chapati.png' },
      { id: 'f18', label: bi('Oats', 'Oat'),                       category: 'carb',      costRM: 1.5, calories: 150, imageUrl: '/food/oats.png' },
    ],
    requiresManualReview: true, maxPoints: 10,
  },

  // ===================== MODULE 8 — MEDICAL EMERGENCY =====================
  q29: {
    id: 'q29', moduleId: 'module-8-medical-emergency', order: 29, responseType: 'media_upload',
    prompt: bi(
      'A teammate suddenly has chest pain, trouble breathing, sweating and feels dizzy. Show what to do using C-A-L-M.',
      'Seorang rakan sepasukan tiba-tiba mengalami sakit dada, sukar bernafas, berpeluh dan pening. Tunjukkan apa yang perlu dilakukan menggunakan C-A-L-M.'
    ),
    instructions: bi(
      'C \u2013 Call for help. A \u2013 Assist (help them sit down). L \u2013 Look (watch their condition). M \u2013 Move to CPR if they collapse.',
      'C \u2013 Call (hubungi bantuan). A \u2013 Assist (bantu dia duduk). L \u2013 Look (perhatikan keadaannya). M \u2013 Move (mula CPR jika dia rebah).'
    ),
    mediaKind: 'video', maxDurationSeconds: 180,
    requiresManualReview: true, maxPoints: 10,
  },

  // ===================== MODULE 9 — FIRE EMERGENCY =====================
  q30: {
    id: 'q30', moduleId: 'module-9-fire-emergency', order: 30, responseType: 'exact_sequence',
    prompt: bi(
      'What are the 4 steps for using a fire extinguisher? Fill in all 4 boxes (in English \u2014 P.A.S.S).',
      'Apakah 4 langkah untuk menggunakan alat pemadam api? Isi keempat-empat kotak (dalam Bahasa Inggeris \u2014 P.A.S.S).'
    ),
    blanks: 4, correctValues: ['Pull', 'Aim', 'Squeeze', 'Sweep'], // 100% string-exact, in order — kept English, see types/game.ts note
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 10 — PLASTIC RECYCLING =====================
  q31: {
    id: 'q31', moduleId: 'module-10-plastic-recycling', order: 31, responseType: 'subjective_select',
    prompt: bi('Name the 7 types of plastic.', 'Namakan 7 jenis plastik.'),
    acceptableAnswers: [
      { id: 'p1', text: bi('PET (PETE)', 'PET (PETE)') },
      { id: 'p2', text: bi('HDPE', 'HDPE') },
      { id: 'p3', text: bi('PVC', 'PVC') },
      { id: 'p4', text: bi('LDPE', 'LDPE') },
      { id: 'p5', text: bi('PP', 'PP') },
      { id: 'p6', text: bi('PS', 'PS') },
      { id: 'p7', text: bi('Other (O)', 'Lain-lain (O)') },
    ],
    minCorrectRequired: 7, freeText: true,
    requiresManualReview: true, maxPoints: 10,
  },
  q32: {
    id: 'q32', moduleId: 'module-10-plastic-recycling', order: 32, responseType: 'classification_matrix',
    prompt: bi('Sort each plastic item into Recyclable or Non-Recyclable.', 'Susun setiap item plastik ke dalam Boleh Dikitar Semula atau Tidak Boleh Dikitar Semula.'),
    categories: [
      { id: 'recyclable', label: bi('Recyclable', 'Boleh Dikitar Semula') },
      { id: 'non_recyclable', label: bi('Non-Recyclable', 'Tidak Boleh Dikitar Semula') },
    ],
    items: [
      { id: 'pet',    label: bi('PET ① — Drink bottle', 'PET ① — Botol minuman'),               correctCategory: 'recyclable',     imageUrl: '/plastics/pet.png' },
      { id: 'hdpe',   label: bi('HDPE ② — Milk jug', 'HDPE ② — Botol susu'),                     correctCategory: 'recyclable',     imageUrl: '/plastics/hdpe.png' },
      { id: 'ldpe',   label: bi('LDPE ④ — Plastic bag', 'LDPE ④ — Beg plastik'),                 correctCategory: 'recyclable',     imageUrl: '/plastics/ldpe.png' },
      { id: 'pp',     label: bi('PP ⑤ — Food container', 'PP ⑤ — Bekas makanan'),                correctCategory: 'recyclable',     imageUrl: '/plastics/pp.png' },
      { id: 'pvc',    label: bi('PVC ③ — Pipe', 'PVC ③ — Paip'),                                 correctCategory: 'non_recyclable', imageUrl: '/plastics/pvc.png' },
      { id: 'ps',     label: bi('PS ⑥ — Foam cup', 'PS ⑥ — Cawan polistirena'),                  correctCategory: 'non_recyclable', imageUrl: '/plastics/ps.png' },
      { id: 'others', label: bi('Other ⑦ — Multi-layer pouch', 'Lain-lain ⑦ — Paket berlapis'), correctCategory: 'non_recyclable', imageUrl: '/plastics/others.png' },
    ],
    requiresManualReview: false, maxPoints: 10,
  },
};

export function getModule(moduleId: string): GameModule | undefined {
  return MODULES.find((m) => m.id === moduleId);
}

export function getQuestionsForModule(moduleId: string): GameQuestion[] {
  const mod = getModule(moduleId);
  if (!mod) return [];
  return mod.questionIds.map((qid) => QUESTIONS[qid]).filter(Boolean);
}
