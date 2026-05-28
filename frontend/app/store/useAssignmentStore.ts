import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type QuestionType = {
  id: string;
  type: string;
  count: number;
  marks: number;
};

export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Assignment = {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionType[];
  instructions: string;
  status: AssignmentStatus;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Question = {
  number: number;
  text: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  type: string;
};

export type Section = {
  title: string;
  instruction: string;
  questionType: string;
  totalMarks: number;
  questions: Question[];
};

export type AnswerKey = {
  questionNumber: number;
  sectionTitle: string;
  answer: string;
};

export type GeneratedPaper = {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: string;
  examRules: string;
  totalMarks: number;
  totalQuestions: number;
  sections: Section[];
  answerKey: AnswerKey[];
};

export type JobProgress = {
  assignmentId: string;
  status: AssignmentStatus;
  progress: number;
  message: string;
  paperId?: string;
};

export type FormData = {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionType[];
  instructions: string;
  file: File | null;
};

type AssignmentStore = {
  // Assignments list
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  updateAssignmentStatus: (id: string, status: AssignmentStatus) => void;

  // Form state
  formData: FormData;
  setFormField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  resetForm: () => void;

  // Generated paper
  currentPaper: GeneratedPaper | null;
  setCurrentPaper: (paper: GeneratedPaper | null) => void;

  // Job progress
  jobProgress: Record<string, JobProgress>;
  setJobProgress: (assignmentId: string, progress: JobProgress) => void;
  clearJobProgress: (assignmentId: string) => void;

  // WebSocket
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // UI State
  showAnswerKey: boolean;
  toggleAnswerKey: () => void;
};

const initialFormData: FormData = {
  title: '',
  subject: '',
  grade: '',
  dueDate: '',
  questionTypes: [
    { id: crypto.randomUUID(), type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: crypto.randomUUID(), type: 'Short Answer Questions', count: 3, marks: 2 },
  ],
  instructions: '',
  file: null,
};

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    (set) => ({
      assignments: [],
      setAssignments: (assignments) => set({ assignments }),
      addAssignment: (assignment) =>
        set((state) => ({ assignments: [assignment, ...state.assignments] })),
      removeAssignment: (id) =>
        set((state) => ({ assignments: state.assignments.filter((a) => a._id !== id) })),
      updateAssignmentStatus: (id, status) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a._id === id ? { ...a, status } : a
          ),
        })),

      formData: initialFormData,
      setFormField: (key, value) =>
        set((state) => ({ formData: { ...state.formData, [key]: value } })),
      resetForm: () => set({ formData: { ...initialFormData, questionTypes: [
        { id: crypto.randomUUID(), type: 'Multiple Choice Questions', count: 4, marks: 1 },
        { id: crypto.randomUUID(), type: 'Short Answer Questions', count: 3, marks: 2 },
      ]} }),

      currentPaper: null,
      setCurrentPaper: (paper) => set({ currentPaper: paper }),

      jobProgress: {},
      setJobProgress: (assignmentId, progress) =>
        set((state) => ({
          jobProgress: { ...state.jobProgress, [assignmentId]: progress },
        })),
      clearJobProgress: (assignmentId) =>
        set((state) => {
          const next = { ...state.jobProgress };
          delete next[assignmentId];
          return { jobProgress: next };
        }),

      wsConnected: false,
      setWsConnected: (connected) => set({ wsConnected: connected }),

      showAnswerKey: false,
      toggleAnswerKey: () => set((state) => ({ showAnswerKey: !state.showAnswerKey })),
    }),
    { name: 'veda-assignment-store' }
  )
);
