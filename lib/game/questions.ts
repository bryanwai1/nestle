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
    questionIds: ['q19', 'q20', 'q21', 'q33'],
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
    prompt: bi('Which are the 6 critical vehicle components that will affect the safety of driving?', 'Apakah 6 komponen kritikal kenderaan yang menjejaskan keselamatan pemanduan?'),
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
    prompt: bi('While you are on a long-distance drive, what is the required rest break after each period of driving?', 'Semasa perjalanan jauh, berapa kerap anda perlu berhenti berehat?'),
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
      'If you feel sleepy while driving, what should you do to avoid DOZING OFF while driving? (More than one answer)',
      'Jika anda rasa mengantuk semasa memandu, tindakan manakah yang perlu diambil? Pilih SEMUA yang betul. '
    ),
    correctChoices: [
      { id: 't_window',      text: bi('Open the window for fresh air', 'Buka tingkap untuk udara segar') },
      { id: 'c_stop_rest',    text: bi('Pull over in a safe place and take a rest', 'Berhenti di tempat yang selamat dan berehat') },
      { id: 'c_stretching',  text: bi('Pull over in a safe place and do some stretching', 'Berhenti di tempat yang selamat dan lakukan regangan') },    ],
    trapChoices: [
      { id: 't_radio',       text: bi('Lowering the temperature of the aircond', 'Merendahkan suhu penyaman udara') },
      { id: 't_lean_back',   text: bi('Lean back the seat to get more comfortable', 'Sandarkan tempat duduk ke belakang untuk lebih selesa') },
      { id: 't_slow',        text: bi('Eat a heavy and oily meal', 'Makan makanan yang berat dan berminyak') },
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
    requiresManualReview: false, maxPoints: 10,
  },
  q5: {
    id: 'q5', moduleId: 'module-1-safe-driving', order: 5, responseType: 'math_input',
    prompt: bi(
      'How many seconds gap must you keep from the car in front to avoid an incident? Type your answer.',
      'Berapa saat jarak yang perlu anda kekalkan daripada kereta di hadapan untuk mengelakkan kemalangan? Taip jawapan anda.'
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
    requiresManualReview: false, maxPoints: 20,
  },
  q7: {
    id: 'q7', moduleId: 'module-1-safe-driving', order: 7, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q8-seatbelt.mp4',
    acceptedKeywords: [
      'not wearing seatbelt', 'no seatbelt', 'seatbelt', 'seat belt', 'tidak pakai tali pinggang keledar', 'tiada tali pinggang keledar', 'tali pinggang keledar',
      'fasten seatbelt', 'wear seatbelt', 'wear seat belt', 'buckle up', 'put on seatbelt', 'pakai tali pinggang keledar', 'ikat tali pinggang keledar'
    ],
    requiresManualReview: false, maxPoints: 20,
  },
  q8: {
    id: 'q8', moduleId: 'module-1-safe-driving', order: 8, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q10-distracted.mp4',
    acceptedKeywords: [
      'distracted', 'texting', 'handphone', 'mobile', 'phone', 'not paying attention', 'using phone', 'leka', 'bertelefon', 'guna telefon', 'tidak fokus',
      'not using handphone', 'focus', 'pay attention', 'no handphone', 'not texting', 'put phone away', 'avoid phone', 'jangan guna telefon', 'fokus', 'beri perhatian', 'tumpukan perhatian'
    ],
    requiresManualReview: false, maxPoints: 20,
  },
  q9: {
    id: 'q9', moduleId: 'module-1-safe-driving', order: 9, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q12-reckless.mp4',
    acceptedKeywords: [
      'rushing', 'reckless driving', 'reckless', 'unsafe driving', 'dangerous', 'speeding', 'tergesa-gesa', 'memandu cuai', 'memandu merbahaya', 'laju',
      'drive safely', 'avoid reckless driving', 'slow down', 'do not rush', "don't rush", 'memandu dengan selamat', 'elak memandu cuai', 'perlahankan'
    ],
    requiresManualReview: false, maxPoints: 20,
  },
  q10: {
    id: 'q10', moduleId: 'module-1-safe-driving', order: 10, responseType: 'video_identify',
    prompt: bi('Watch the video, then answer both parts below.', 'Tonton video, kemudian jawab kedua-dua bahagian di bawah.'),
    videoUrl: '/media/safe-driving/q14-mirror.mp4',
    acceptedKeywords: [
      'not checking mirror', 'side mirror', 'no signal', 'no indicator', 'blind spot', 'not signaling', 'tidak periksa cermin', 'cermin sisi', 'tiada isyarat', 'bintik buta',
      'scan side mirror', 'give signal', 'give indicator', 'check mirrors', 'use indicator', 'use signal', 'periksa cermin sisi', 'beri isyarat', 'guna lampu isyarat'
    ],
    requiresManualReview: false, maxPoints: 20,
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
    requiresDescription: true,
    requiresManualReview: false, maxPoints: 10,
  },
  q17: {
    id: 'q17', moduleId: 'module-2-stf', order: 17, responseType: 'hazard_canvas',
    prompt: bi(
      'Tap every hazard you can find in each photo. Go through all 3 scenes. Each photo has 7 hazards, max 7 taps. If you tap the wrong spot, one point will be deducted.',
      'Ketik setiap bahaya yang anda jumpa dalam setiap gambar. Lalui kesemua 3 senario. Setiap gambar mempunyai 7 bahaya, maksimum 7 ketikan. Jika anda ketik tempat yang salah, satu mata akan ditolak.'
    ),
    imageUrl: '/hazards/warehouse-forklift.png',
    targetHazardCount: 7,
    hazards: [],
    decoyZones: [],
    scenes: [
      {
        imageUrl: '/hazards/warehouse-forklift.png',
        label: bi('Warehouse', 'Gudang'),
        targetHazardCount: 7,
        hazards: [
          { id: 'w1', x: 48, y: 80, radius: 10, label: bi('Large water spill on the floor', 'Tumpahan air besar di lantai') },
          { id: 'w2', x: 10, y: 50, radius: 10, label: bi('Unstable stacked boxes', 'Timbunan kotak tidak stabil') },
          { id: 'w3', x: 25, y: 52, radius: 8, label: bi('Worker looking at phone while walking', 'Pekerja melihat telefon semasa berjalan') },
          { id: 'w4', x: 88, y: 80, radius: 9, label: bi('Loose wooden pallets and broken wood pieces', 'Palet kayu longgar dan kepingan kayu pecah') },
          { id: 'w5', x: 80, y: 20, radius: 9, label: bi('Box falling from the shelf', 'Kotak jatuh dari rak') },
          { id: 'w6', x: 78, y: 55, radius: 8, label: bi('Fire extinguisher blocked', 'Alat pemadam api disekat') },
          { id: 'w7', x: 12, y: 75, radius: 8, label: bi('Loose cable or hose on the floor', 'Kabel atau hos longgar di lantai') },
        ],
        decoyZones: [],
      },
      {
        imageUrl: '/hazards/office-2.jpg',
        label: bi('Office', 'Pejabat'),
        targetHazardCount: 7,
        hazards: [
          { id: 'o1', x: 32, y: 71, radius: 9, label: bi('Open drawer protruding into walkway', 'Laci terbuka menganjur ke laluan') },
          { id: 'o2', x: 48, y: 67, radius: 7, label: bi('Power cable trailing across walkway', 'Wayar kuasa merentasi laluan') },
          { id: 'o3', x: 66, y: 70, radius: 6, label: bi('Coffee spill no wet-floor sign', 'Kopi tertumpah tiada tanda lantai basah') },
          { id: 'o4', x: 70, y: 33, radius: 8, label: bi('Boxes stacked too high and leaning', 'Kotak bertindan terlalu tinggi dan condong') },
          { id: 'o5', x: 14, y: 90, radius: 8, label: bi('Overloaded power strip under desk', 'Soket kuasa berlebihan di bawah meja') },
          { id: 'o6', x: 59, y: 40, radius: 8, label: bi('Boxes blocking the walkway', 'Kotak menghalang laluan') },
          { id: 'o7', x: 88, y: 62, radius: 11, label: bi('Boxes stacked high could fall', 'Kotak bertindan tinggi boleh jatuh') },
        ],
        decoyZones: [],
      },
      {
        imageUrl: '/hazards/staircase.jpg',
        label: bi('Staircase', 'Tangga'),
        targetHazardCount: 7,
        hazards: [
          { id: 's1', x: 62, y: 52, radius: 10, label: bi('Boxes blocking the stairs', 'Kotak menyekat tangga') },
          { id: 's2', x: 45, y: 82, radius: 10, label: bi('Wet floor at base of stairs', 'Lantai basah di kaki tangga') },
          { id: 's3', x: 35, y: 88, radius: 8, label: bi('Loose cable across walkway', 'Kabel longgar merentasi laluan') },
          { id: 's4', x: 72, y: 55, radius: 8, label: bi('Handrail blocked by boxes', 'Pemegang tangan disekat kotak') },
          { id: 's5', x: 82, y: 18, radius: 8, label: bi('Poor lighting broken light fixture', 'Pencahayaan lemah lampu rosak') },
          { id: 's6', x: 18, y: 38, radius: 9, label: bi('Fire extinguisher blocked', 'Alat pemadam api disekat') },
          { id: 's7', x: 50, y: 22, radius: 9, label: bi('Exit door blocked by boxes', 'Pintu keluar disekat kotak') },
        ],
        decoyZones: [],
      },
    ],
    requiresManualReview: false, maxPoints: 30,
  },
  q18: {
    id: 'q18', moduleId: 'module-2-stf', order: 18, responseType: 'drag_sequence', imageUrl: '/q18-shelf.png',
    prompt: bi(
      'This scenario is in a Key Account Customer Warehouse. Besides using a forklift to unload, if sales staff have to unload manually with a ladder, what are the safe steps in sequence?',
      'Senario ini berlaku di Gudang Pelanggan Key Account. Selain menggunakan forklift, jika kakitangan jualan perlu membuat penurunan secara manual dengan tangga, apakah langkah selamat yang perlu diambil mengikut turutan?'
    ),
    steps: [
      { id: 'clear_aisles', label: bi('Clear the aisle / remove block stacking along the aisle', 'Bersihkan laluan / alihkan susunan kotak di sepanjang laluan'), imageUrl: '/q18/aisle.jpg' },
      { id: 'inspect_ladder', label: bi('Use only a good condition ladder', 'Gunakan tangga yang dalam keadaan baik sahaja'), imageUrl: '/q18/ladder.jpg' },
      { id: 'hold_ladder', label: bi('Have someone hold the ladder', 'Minta seseorang pegang tangga'), imageUrl: '/q18/hold.jpg' },
      { id: 'confirm_floor', label: bi('Unload the product safely', 'Turunkan produk dengan selamat'), imageUrl: '/q18/floor.jpg' },
    ],
    correctOrder: ['clear_aisles', 'inspect_ladder', 'hold_ladder', 'confirm_floor'],
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 3 — HEART HEALTH =====================
  q19: {
    id: 'q19', moduleId: 'module-3-heart-health', order: 19, responseType: 'classification_matrix',
    prompt: bi(
      'Specify the differences between heart attack and cardiac arrest by dragging the symptoms into the respective box.',
      'Nyatakan perbezaan antara serangan jantung dan henti jantung dengan menyeret gejala ke dalam kotak masing-masing.'
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
      'What are the healthy lifestyles that are good for your heart?',
      'Apakah gaya hidup sihat yang baik untuk jantung anda?'
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
    prompt: bi('Name 4 different tests that can diagnose your heart condition.', 'Namakan 4 ujian berbeza yang boleh mendiagnosis keadaan jantung anda.'),
    acceptableAnswers: [
      { id: 'a1', text: bi('Stress Test', 'Ujian Tekanan (Stress Test)') },
      { id: 'a2', text: bi('ECG', 'ECG') },
      { id: 'a3', text: bi('CT Scan (CT Coronary Angiography)', 'Imbasan CT (CT Coronary Angiography)') },
      { id: 'a4', text: bi('Angiogram (Coronary Angiogram)', 'Angiogram (Coronary Angiogram)') },
    ],
    minCorrectRequired: 4, freeText: true,
    requiresManualReview: false, maxPoints: 10,
  },
  q33: {
    id: 'q33', moduleId: 'module-3-heart-health', order: 33, responseType: 'drag_sequence',
    prompt: bi(
      'Rearrange the correct sequence while performing CPR.',
      'Susun semula urutan yang betul semasa melakukan CPR.'
    ),
    steps: [
      { id: 'danger', label: bi('Danger', 'Bahaya') },
      { id: 'response', label: bi('Response', 'Gerak Balas') },
      { id: 'airway', label: bi('Airway', 'Salur Udara') },
      { id: 'breathing', label: bi('Breathing', 'Pernafasan') },
      { id: 'circulation', label: bi('Circulation', 'Peredaran Darah') },
    ],
    correctOrder: ['danger', 'response', 'airway', 'breathing', 'circulation'],
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 5 — ERGONOMICS =====================
  q22: {
    id: 'q22', moduleId: 'module-5-ergonomics', order: 22, responseType: 'media_upload',
    prompt: bi('Record a team member lifting a heavy box the safe way.', 'Rakam seorang ahli pasukan mengangkat kotak berat dengan cara yang selamat.'),
    mediaKind: 'video',
    requiresManualReview: true, maxPoints: 10,
  },
  q23: {
    id: 'q23', moduleId: 'module-5-ergonomics', order: 23, responseType: 'media_upload',
    prompt: bi('Take a photo of the correct sitting position at a desk.', 'Ambil gambar kedudukan duduk yang betul di meja kerja.'),
    mediaKind: 'photo',
    requiresManualReview: true, maxPoints: 10,
  },

  // ===================== MODULE 6 — EXERCISE & STRETCHING =====================
  q24: {
    id: 'q24', moduleId: 'module-6-exercise', order: 24, responseType: 'media_upload',
    prompt: bi('Record a 10-second video of a correct squat.', 'Rakam video 10 saat menunjukkan squat yang betul.'),
    mediaKind: 'video', maxDurationSeconds: 10,
    requiresManualReview: true, maxPoints: 10,
  },
  q25: {
    id: 'q25', moduleId: 'module-6-exercise', order: 25, responseType: 'media_upload',
    prompt: bi('Upload a photo of the correct push-up position.', 'Muat naik gambar kedudukan push-up yang betul.'),
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
    prompt: bi('A safe heart rate applies to every age. A 50-year-old man goes jogging, what is his safe heart rate?', 'Kadar denyutan jantung selamat terpakai untuk semua peringkat umur. Seorang lelaki berusia 50 tahun pergi berjoging, apakah kadar denyutan jantung selamat beliau?'),
    // formulaDisplay intentionally blank — players must recall the formula themselves
    formulaDisplay: bi('', ''), expectedValue: 170, tolerance: 0,
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 7 — BALANCED DIET =====================
  q28: {
    id: 'q28', moduleId: 'module-7-balanced-diet', order: 28, responseType: 'budget_canvas',
    prompt: bi(
      'Build a healthy plate using Suku-Suku Separuh within the budget of RM12.',
      'Bina pinggan sihat menggunakan Suku-Suku Separuh dalam bajet RM12.'
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
    requiresManualReview: false, maxPoints: 10,
  },

  // ===================== MODULE 8 — MEDICAL EMERGENCY =====================
  q29: {
    id: 'q29', moduleId: 'module-8-medical-emergency', order: 29, responseType: 'media_upload',
    prompt: bi(
      'A teammate suddenly has chest pain, trouble breathing, sweating and feels dizzy. Show what to do using C-A-L-M.',
      'Seorang rakan sepasukan tiba-tiba mengalami sakit dada, sukar bernafas, berpeluh dan pening. Tunjukkan apa yang perlu dilakukan menggunakan C-A-L-M.'
    ),
    mediaKind: 'photo',
    photoSteps: [
      { id: 'call',   label: bi('Step 1', 'Langkah 1') },
      { id: 'assist', label: bi('Step 2', 'Langkah 2') },
      { id: 'look',   label: bi('Step 3', 'Langkah 3') },
      { id: 'move',   label: bi('Step 4', 'Langkah 4') },
    ],
    requiresManualReview: true, maxPoints: 10,
  },

  // ===================== MODULE 9 — FIRE EMERGENCY =====================
  q30: {
    id: 'q30', moduleId: 'module-9-fire-emergency', order: 30, responseType: 'exact_sequence',
    prompt: bi(
      'Name the 4 steps of operating a fire extinguisher. Fill in all 4 boxes (in English).',
      'Namakan 4 langkah mengendalikan alat pemadam api. Isi keempat-empat kotak (dalam Bahasa Inggeris).'
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
    requiresManualReview: false, maxPoints: 10,
  },
  q32: {
    id: 'q32', moduleId: 'module-10-plastic-recycling', order: 32, responseType: 'classification_matrix',
    prompt: bi('Which plastics are recyclable and which are non-recyclable? Drag the answers into the right box.', 'Plastik manakah yang boleh dikitar semula dan yang manakah tidak boleh? Seret jawapan ke dalam kotak yang betul.'),
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
