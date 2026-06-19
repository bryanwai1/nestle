import type { ExamConfig, ExamQuestion } from "@/components/ExamEngine";

export const CONFIG: ExamConfig = {
  moduleId: 6, gameId: 3,
  title: "Max Heart Rate Calculation",
  subtitle: "Module 6 . Game 3 of 4",
  icon: "MHR",
  totalTimeSeconds: 90,
  pointsCorrect: 10, pointsWrong: -5, passPct: 100,
};

export const QUESTIONS: ExamQuestion[] = [
  { id:1, question:"A 50-year-old man is jogging. Using the standard formula (Max Heart Rate = 220 minus Age), calculate his Maximum Heart Rate yourself. What is the correct figure?", options:[
    {id:"a",text:"150 bpm",isCorrect:false},
    {id:"b",text:"160 bpm",isCorrect:false},
    {id:"c",text:"170 bpm",isCorrect:true},
    {id:"d",text:"180 bpm",isCorrect:false},
    {id:"e",text:"190 bpm",isCorrect:false},
    {id:"f",text:"200 bpm",isCorrect:false}]},
];
