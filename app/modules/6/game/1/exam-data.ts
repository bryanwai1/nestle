import type { ExamConfig, ExamQuestion } from "@/components/ExamEngine";

export const CONFIG: ExamConfig = {
  moduleId: 6, gameId: 1,
  title: "Heart Attack Assessment Exam",
  subtitle: "Module 6 . Game 1 of 4",
  icon: "HA",
  totalTimeSeconds: 15 * 60,
  pointsCorrect: 10, pointsWrong: -5, passPct: 70,
};

export const QUESTIONS: ExamQuestion[] = [
  { id:1, question:"Which of the following is recognised as a classic symptom of a heart attack?", options:[
    {id:"a",text:"Improved appetite",isCorrect:false},
    {id:"b",text:"Chest pain or pressure radiating to the arm, neck, or jaw",isCorrect:true},
    {id:"c",text:"Increased energy levels",isCorrect:false},
    {id:"d",text:"Better sleep quality",isCorrect:false},
    {id:"e",text:"Improved digestion",isCorrect:false},
    {id:"f",text:"Enhanced muscle tone",isCorrect:false}]},
  { id:2, question:"Heart attack symptoms often present differently in women. Which is more commonly reported?", options:[
    {id:"a",text:"Unusual fatigue and shortness of breath",isCorrect:true},
    {id:"b",text:"Loss of appetite only",isCorrect:false},
    {id:"c",text:"Improved vision",isCorrect:false},
    {id:"d",text:"Increased flexibility",isCorrect:false},
    {id:"e",text:"Better balance",isCorrect:false},
    {id:"f",text:"Reduced heart rate variability noticed by the patient",isCorrect:false}]},
  { id:3, question:"What is the FIRST action to take if you suspect someone is having a heart attack?", options:[
    {id:"a",text:"Give them food",isCorrect:false},
    {id:"b",text:"Wait to see if the symptoms pass",isCorrect:false},
    {id:"c",text:"Call emergency services (999) immediately",isCorrect:true},
    {id:"d",text:"Drive them to the pharmacy",isCorrect:false},
    {id:"e",text:"Apply ice directly to the chest",isCorrect:false},
    {id:"f",text:"Encourage them to walk it off",isCorrect:false}]},
  { id:4, question:"If the person is conscious while waiting for help to arrive, what should you do?", options:[
    {id:"a",text:"Make them walk around",isCorrect:false},
    {id:"b",text:"Keep them calm, seated comfortably, and loosen tight clothing",isCorrect:true},
    {id:"c",text:"Give them a cold shower",isCorrect:false},
    {id:"d",text:"Leave them alone to rest",isCorrect:false},
    {id:"e",text:"Elevate their legs above heart level",isCorrect:false},
    {id:"f",text:"Give them a strong cup of coffee",isCorrect:false}]},
  { id:5, question:"If the person becomes unresponsive and stops breathing normally, what is the correct response?", options:[
    {id:"a",text:"Wait for the ambulance to arrive",isCorrect:false},
    {id:"b",text:"Begin CPR immediately",isCorrect:true},
    {id:"c",text:"Give them water",isCorrect:false},
    {id:"d",text:"Elevate their legs only, take no other action",isCorrect:false},
    {id:"e",text:"Place them in the recovery position only",isCorrect:false},
    {id:"f",text:"Shout for ten minutes before taking action",isCorrect:false}]},
  { id:6, question:"Which lifestyle factor most directly INCREASES the risk of heart disease?", options:[
    {id:"a",text:"Regular exercise",isCorrect:false},
    {id:"b",text:"Smoking",isCorrect:true},
    {id:"c",text:"Drinking enough water",isCorrect:false},
    {id:"d",text:"Adequate sleep",isCorrect:false},
    {id:"e",text:"Eating vegetables daily",isCorrect:false},
    {id:"f",text:"Maintaining a healthy body weight",isCorrect:false}]},
  { id:7, question:"In emergency cardiac response, what does the phrase \"time is muscle\" refer to?", options:[
    {id:"a",text:"Exercise builds muscle over time",isCorrect:false},
    {id:"b",text:"The longer treatment is delayed, the more heart muscle is permanently damaged",isCorrect:true},
    {id:"c",text:"Muscles need time to recover after exercise",isCorrect:false},
    {id:"d",text:"Heart muscle grows stronger with age",isCorrect:false},
    {id:"e",text:"Muscle mass predicts heart attack risk",isCorrect:false},
    {id:"f",text:"Heart muscle repairs itself instantly",isCorrect:false}]},
  { id:8, question:"Which group is generally at HIGHER risk of a heart attack?", options:[
    {id:"a",text:"People who exercise regularly",isCorrect:false},
    {id:"b",text:"People with diabetes or high blood pressure",isCorrect:true},
    {id:"c",text:"People who eat balanced diets",isCorrect:false},
    {id:"d",text:"People who sleep 8 hours nightly",isCorrect:false},
    {id:"e",text:"Non-smokers with no other risk factors",isCorrect:false},
    {id:"f",text:"People under 30 with no family history",isCorrect:false}]},
  { id:9, question:"A burning chest sensation often mistaken for indigestion could actually be:", options:[
    {id:"a",text:"Always just indigestion, never serious",isCorrect:false},
    {id:"b",text:"A possible heart attack warning sign",isCorrect:true},
    {id:"c",text:"A sign of good digestion",isCorrect:false},
    {id:"d",text:"Completely unrelated to the heart",isCorrect:false},
    {id:"e",text:"Only occurs after fatty meals and nothing else",isCorrect:false},
    {id:"f",text:"A condition that always resolves within seconds",isCorrect:false}]},
  { id:10, question:"What is the recommended body position for a conscious person experiencing chest pain?", options:[
    {id:"a",text:"Lying completely flat",isCorrect:false},
    {id:"b",text:"Standing upright",isCorrect:false},
    {id:"c",text:"Semi-sitting, in a comfortable position",isCorrect:true},
    {id:"d",text:"Lying face down",isCorrect:false},
    {id:"e",text:"Lying on the left side only",isCorrect:false},
    {id:"f",text:"Squatting position",isCorrect:false}]},
  { id:11, question:"Which symptom combination most strongly suggests a heart attack rather than a minor issue?", options:[
    {id:"a",text:"Mild headache only",isCorrect:false},
    {id:"b",text:"Chest pressure with sweating, nausea, and shortness of breath",isCorrect:true},
    {id:"c",text:"Slight finger tingling only",isCorrect:false},
    {id:"d",text:"Dry skin",isCorrect:false},
    {id:"e",text:"Sore throat only",isCorrect:false},
    {id:"f",text:"Mild ankle swelling",isCorrect:false}]},
  { id:12, question:"Why should you stay with the person after calling emergency services?", options:[
    {id:"a",text:"It is not necessary to stay",isCorrect:false},
    {id:"b",text:"To monitor their condition and respond immediately if it worsens",isCorrect:true},
    {id:"c",text:"Only to keep them company socially",isCorrect:false},
    {id:"d",text:"To take photos for records",isCorrect:false},
    {id:"e",text:"To wait and see if they recover on their own",isCorrect:false},
    {id:"f",text:"To confirm their personal details for paperwork",isCorrect:false}]},
];
