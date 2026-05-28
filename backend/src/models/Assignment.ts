import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  instructions: string;
  filePath?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  generatedPaperId?: mongoose.Types.ObjectId;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    instructions: { type: String, default: '' },
    filePath: { type: String },
    fileName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String },
    generatedPaperId: { type: Schema.Types.ObjectId, ref: 'GeneratedPaper' },
    jobId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
