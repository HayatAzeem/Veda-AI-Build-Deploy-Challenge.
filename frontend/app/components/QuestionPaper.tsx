'use client';
import { useRef } from 'react';
import { GeneratedPaper, Section, Question } from '../store/useAssignmentStore';

interface Props {
  paper: GeneratedPaper;
  showAnswerKey: boolean;
  assignmentTitle?: string;
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const cls = difficulty === 'easy' ? 'diff-easy' : difficulty === 'hard' ? 'diff-hard' : 'diff-moderate';
  return <span className={`diff-badge ${cls}`}>{difficulty}</span>;
}

export default function QuestionPaper({ paper, showAnswerKey, assignmentTitle }: Props) {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = paperRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>${assignmentTitle || paper.subject} - Question Paper</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; padding: 20mm; }
        .paper-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
        .paper-school { font-size: 18pt; font-weight: bold; margin-bottom: 4px; }
        .paper-exam-title { font-size: 12pt; margin-bottom: 12px; }
        .paper-meta-row { display: flex; justify-content: space-between; font-size: 10pt; }
        .paper-student-section { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding: 12px 0; border-bottom: 1px solid #000; margin-bottom: 12px; }
        .student-field-label { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
        .student-field-line { height: 22px; border-bottom: 1px solid #000; }
        .paper-rules { font-size: 9pt; font-style: italic; margin-bottom: 16px; color: #555; }
        .paper-section { margin-bottom: 20px; }
        .paper-section-title { font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 4px; }
        .paper-section-sub { font-size: 9pt; color: #555; margin-bottom: 10px; }
        .question-row { display: flex; gap: 10px; margin-bottom: 10px; page-break-inside: avoid; }
        .question-num { font-weight: bold; min-width: 24px; }
        .question-text { flex: 1; line-height: 1.6; }
        .question-tags { display: flex; gap: 8px; margin-top: 3px; font-size: 9pt; }
        .diff-badge { padding: 1px 6px; border-radius: 3px; font-size: 8pt; font-weight: bold; text-transform: uppercase; }
        .diff-easy { background: #dcfce7; } .diff-moderate { background: #fef9c3; } .diff-hard { background: #fee2e2; }
        .question-marks { font-weight: bold; }
        .answer-key { margin-top: 20px; padding-top: 16px; border-top: 2px dashed #000; }
        @media print { body { padding: 10mm; } }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const easyCount = paper.sections.flatMap(s => s.questions).filter(q => q.difficulty === 'easy').length;
  const modCount = paper.sections.flatMap(s => s.questions).filter(q => q.difficulty === 'moderate').length;
  const hardCount = paper.sections.flatMap(s => s.questions).filter(q => q.difficulty === 'hard').length;

  return (
    <div className="paper-container" ref={paperRef}>
      {/* Official Header */}
      <div className="paper-header-official">
        <div className="paper-school-name">{paper.schoolName}</div>
        <div className="paper-exam-type">{assignmentTitle || `${paper.subject} Examination`}</div>
        
        <div className="paper-meta-grid">
          <div><strong>Subject:</strong> {paper.subject}</div>
          <div style={{ textAlign: 'right' }}><strong>Time Allowed:</strong> {paper.timeAllowed}</div>
          <div><strong>Class / Grade:</strong> {paper.grade}</div>
          <div style={{ textAlign: 'right' }}><strong>Maximum Marks:</strong> {paper.totalMarks}</div>
        </div>
      </div>

      {/* Student Details section */}
      <div className="paper-student-info">
        <div>Name of Student: <span className="blank-line" style={{ width: '220px' }}></span></div>
        <div>Roll Number: <span className="blank-line" style={{ width: '120px' }}></span></div>
        <div>Section: <span className="blank-line" style={{ width: '120px' }}></span></div>
        <div>Date: <span className="blank-line" style={{ width: '120px' }}></span></div>
      </div>

      {/* General Instructions */}
      <div className="paper-instructions">
        <strong>General Instructions:</strong>
        <br/>
        {paper.examRules || 'All questions are compulsory. Marks for each question are indicated against it. Maintain clean handwriting.'}
      </div>

      {/* Sections & Questions */}
      {paper.sections.map((section: Section) => (
        <div key={section.title} className="paper-section">
          <div className="paper-section-title">{section.title}</div>
          <div style={{ fontWeight: 'bold', marginBottom: 16 }}>
            {section.questionType} ({section.instruction})
          </div>
          
          {section.questions.map((q: Question) => (
            <div key={q.number} className="paper-question">
              <div className="paper-qnum">Q{q.number}.</div>
              <div className="paper-qtext">
                {q.text}
                {!showAnswerKey && q.type !== 'Multiple Choice Questions' && q.type !== 'True/False Questions' && (
                  <div style={{ marginTop: 24, marginBottom: 24 }}>
                    <div className="blank-line" style={{ width: '100%', marginBottom: 12 }}></div>
                    <div className="blank-line" style={{ width: '100%', marginBottom: 12 }}></div>
                    {q.marks > 2 && <div className="blank-line" style={{ width: '100%' }}></div>}
                  </div>
                )}
              </div>
              <div className="paper-qmarks">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</div>
            </div>
          ))}
        </div>
      ))}

      {/* Answer Key */}
      {showAnswerKey && paper.answerKey && paper.answerKey.length > 0 && (
        <div className="answer-key-official">
          <h3 style={{ marginBottom: 20 }}>Answer Key</h3>
          {paper.answerKey.map(ak => (
            <div key={`${ak.sectionTitle}-${ak.questionNumber}`} style={{ marginBottom: 12 }}>
              <strong>Q{ak.questionNumber}:</strong> {ak.answer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
