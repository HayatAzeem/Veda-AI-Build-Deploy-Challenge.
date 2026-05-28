import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  number: number;
  text: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  type: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questionType: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface IAnswerKey {
  questionNumber: number;
  sectionTitle: string;
  answer: string;
}

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: string;
  examRules: string;
  totalMarks: number;
  totalQuestions: number;
  sections: ISection[];
  answerKey: IAnswerKey[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'moderate', 'hard'], required: true },
  marks: { type: Number, required: true },
  type: { type: String, required: true },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questionType: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
  totalMarks: { type: Number, required: true },
});

const AnswerKeySchema = new Schema<IAnswerKey>({
  questionNumber: { type: Number, required: true },
  sectionTitle: { type: String, required: true },
  answer: { type: String, required: true },
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    schoolName: { type: String, default: 'VedaAI Academy' },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    timeAllowed: { type: String, required: true },
    examRules: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    answerKey: { type: [AnswerKeySchema], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IGeneratedPaper>('GeneratedPaper', GeneratedPaperSchema);
