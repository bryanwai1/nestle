import type { ExamConfig, ExamQuestion } from "@/components/ExamEngine";

export const CONFIG: ExamConfig = {
  moduleId: 6, gameId: 2,
  title: "Diagnostic Accuracy Exam",
  subtitle: "Module 6 . Game 2 of 4",
  icon: "DX",
  totalTimeSeconds: 10 * 60,
  pointsCorrect: 10, pointsWrong: -5, passPct: 70,
};

export const QUESTIONS: ExamQuestion[] = [
  { id:1, question:"Which cardiology screening test has the LOWEST diagnostic accuracy of the three covered in this briefing?", options:[
    {id:"a",text:"Angiogram",isCorrect:false},{id:"b",text:"Stress Test",isCorrect:true},{id:"c",text:"CT Scan",isCorrect:false},
    {id:"d",text:"All three are equal",isCorrect:false},{id:"e",text:"ECG",isCorrect:false},{id:"f",text:"Blood pressure monitor",isCorrect:false}]},
  { id:2, question:"What is the approximate diagnostic accuracy of a Stress Test?", options:[
    {id:"a",text:"50%",isCorrect:false},{id:"b",text:"70%",isCorrect:true},{id:"c",text:"90%",isCorrect:false},
    {id:"d",text:"99%",isCorrect:false},{id:"e",text:"60%",isCorrect:false},{id:"f",text:"80%",isCorrect:false}]},
  { id:3, question:"Which test offers HIGHER accuracy than a Stress Test but LOWER accuracy than an Angiogram?", options:[
    {id:"a",text:"CT Scan",isCorrect:true},{id:"b",text:"Blood pressure check",isCorrect:false},{id:"c",text:"ECG only",isCorrect:false},
    {id:"d",text:"Stress Test",isCorrect:false},{id:"e",text:"Pulse oximetry",isCorrect:false},{id:"f",text:"Home heart rate monitor",isCorrect:false}]},
  { id:4, question:"What is the approximate diagnostic accuracy of a CT Scan for cardiac checks?", options:[
    {id:"a",text:"70%",isCorrect:false},{id:"b",text:"99%",isCorrect:false},{id:"c",text:"90%",isCorrect:true},
    {id:"d",text:"60%",isCorrect:false},{id:"e",text:"50%",isCorrect:false},{id:"f",text:"95%",isCorrect:false}]},
  { id:5, question:"Which test is considered the gold standard, offering the highest diagnostic accuracy?", options:[
    {id:"a",text:"Stress Test",isCorrect:false},{id:"b",text:"Angiogram",isCorrect:true},{id:"c",text:"CT Scan",isCorrect:false},
    {id:"d",text:"Home blood pressure monitor",isCorrect:false},{id:"e",text:"ECG",isCorrect:false},{id:"f",text:"Manual pulse check",isCorrect:false}]},
  { id:6, question:"What is the approximate diagnostic accuracy of an Angiogram?", options:[
    {id:"a",text:"99%",isCorrect:true},{id:"b",text:"80%",isCorrect:false},{id:"c",text:"90%",isCorrect:false},
    {id:"d",text:"75%",isCorrect:false},{id:"e",text:"85%",isCorrect:false},{id:"f",text:"70%",isCorrect:false}]},
  { id:7, question:"Why might doctors begin with a Stress Test before considering more invasive options?", options:[
    {id:"a",text:"It is always the most accurate test available",isCorrect:false},
    {id:"b",text:"It is non-invasive and serves as a useful first screening tool",isCorrect:true},
    {id:"c",text:"It requires no doctor supervision",isCorrect:false},
    {id:"d",text:"It replaces the need for any other test",isCorrect:false},
    {id:"e",text:"It is cheaper than an ECG",isCorrect:false},
    {id:"f",text:"It is only used for elderly patients",isCorrect:false}]},
  { id:8, question:"Why is an Angiogram considered an invasive diagnostic procedure?", options:[
    {id:"a",text:"It only uses external sensors",isCorrect:false},
    {id:"b",text:"It involves inserting a catheter into the blood vessels",isCorrect:true},
    {id:"c",text:"It requires no medical equipment",isCorrect:false},
    {id:"d",text:"It is performed entirely at home",isCorrect:false},
    {id:"e",text:"It uses only a blood sample",isCorrect:false},
    {id:"f",text:"It is entirely non-invasive",isCorrect:false}]},
];
