import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { IQuestionType } from '../models/Assignment';
import { IGeneratedPaper, ISection, IQuestion, IAnswerKey } from '../models/GeneratedPaper';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerationParams {
  subject: string;
  grade: string;
  questionTypes: IQuestionType[];
  instructions: string;
  fileContent?: string;
}

interface RawQuestion {
  number: number;
  text: string;
  difficulty: string;
  marks: number;
  type: string;
}

interface RawSection {
  title: string;
  instruction: string;
  questionType: string;
  questions: RawQuestion[];
  totalMarks: number;
}

interface RawAnswerKey {
  questionNumber: number;
  sectionTitle: string;
  answer: string;
}

interface RawPaper {
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: string;
  examRules: string;
  totalMarks: number;
  totalQuestions: number;
  sections: RawSection[];
  answerKey: RawAnswerKey[];
}

function buildPrompt(params: GenerationParams): string {
  const { subject, grade, questionTypes, instructions, fileContent } = params;

  const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);

  const qtDetails = questionTypes
    .map((qt, i) => `  Section ${String.fromCharCode(65 + i)}: ${qt.count} ${qt.type} questions, ${qt.marks} marks each`)
    .join('\n');

  const sectionSchema = questionTypes.map((qt, i) => ({
    sectionLetter: String.fromCharCode(65 + i),
    questionType: qt.type,
    count: qt.count,
    marksEach: qt.marks,
  }));

  return `You are an expert exam paper creator for school students. Generate a complete, structured question paper.

**Assignment Details:**
- Subject: ${subject}
- Grade/Class: ${grade}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}

**Question Sections Required:**
${qtDetails}

**Additional Instructions:**
${instructions || 'Create a balanced exam paper suitable for school students.'}

${fileContent ? `**Reference Material:**\n${fileContent}` : ''}

**CRITICAL REQUIREMENTS:**
1. Generate EXACTLY the specified number of questions for each section
2. Assign difficulty: distribute roughly 30% easy, 40% moderate, 30% hard per section
3. Questions must be academically appropriate for ${grade} grade students
4. Each question must be unique, clear, and educational
5. Provide complete, accurate answer key entries
6. For timeAllowed: estimate based on total marks (roughly 1 min per mark)
7. Section titles: use "Section A", "Section B", etc.
8. schoolName: use "VedaAI Academy"
9. examRules: "All questions are compulsory unless stated otherwise. Write your answers clearly."

**Section Schema:** ${JSON.stringify(sectionSchema, null, 2)}

Return ONLY valid JSON matching the exact schema provided. No markdown, no extra text.`;
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    schoolName: { type: SchemaType.STRING },
    subject: { type: SchemaType.STRING },
    grade: { type: SchemaType.STRING },
    timeAllowed: { type: SchemaType.STRING },
    examRules: { type: SchemaType.STRING },
    totalMarks: { type: SchemaType.NUMBER },
    totalQuestions: { type: SchemaType.NUMBER },
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          instruction: { type: SchemaType.STRING },
          questionType: { type: SchemaType.STRING },
          totalMarks: { type: SchemaType.NUMBER },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                number: { type: SchemaType.NUMBER },
                text: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
                marks: { type: SchemaType.NUMBER },
                type: { type: SchemaType.STRING },
              },
              required: ['number', 'text', 'difficulty', 'marks', 'type'],
            },
          },
        },
        required: ['title', 'instruction', 'questionType', 'questions', 'totalMarks'],
      },
    },
    answerKey: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: { type: SchemaType.NUMBER },
          sectionTitle: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING },
        },
        required: ['questionNumber', 'sectionTitle', 'answer'],
      },
    },
  },
  required: ['schoolName', 'subject', 'grade', 'timeAllowed', 'examRules', 'totalMarks', 'totalQuestions', 'sections', 'answerKey'],
};

export async function generateQuestionPaper(params: GenerationParams): Promise<RawPaper> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const prompt = buildPrompt(params);

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed: RawPaper = JSON.parse(text);

      // Validate structure
      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new Error('Invalid response: missing sections');
      }

      // Normalize difficulty values
      parsed.sections.forEach((section) => {
        section.questions.forEach((q) => {
          const d = q.difficulty.toLowerCase();
          if (d.includes('easy')) q.difficulty = 'easy';
          else if (d.includes('hard') || d.includes('challeng')) q.difficulty = 'hard';
          else q.difficulty = 'moderate';
        });
      });

      return parsed;
    } catch (error) {
      attempt++;
      console.error(`Gemini attempt ${attempt} failed:`, error);
      if (attempt >= maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw new Error('Failed to generate question paper after multiple attempts');
}
