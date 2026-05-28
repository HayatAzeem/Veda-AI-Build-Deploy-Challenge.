'use client';
import { useAssignmentStore, QuestionType } from '../store/useAssignmentStore';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Answer Questions',
  'Long Answer Questions',
  'True/False Questions',
  'Fill in the Blanks',
  'Match the Following',
  'Assertion & Reason',
  'Case Study Questions',
];

export default function QuestionTypeTable() {
  const { formData, setFormField } = useAssignmentStore();
  const { questionTypes } = formData;

  const updateRow = (id: string, field: keyof QuestionType, value: string | number) => {
    const updated = questionTypes.map(qt =>
      qt.id === id ? { ...qt, [field]: field === 'type' ? value : Math.max(1, Number(value) || 1) } : qt
    );
    setFormField('questionTypes', updated);
  };

  const removeRow = (id: string) => {
    if (questionTypes.length > 1) {
      setFormField('questionTypes', questionTypes.filter(qt => qt.id !== id));
    }
  };

  const addRow = () => {
    setFormField('questionTypes', [
      ...questionTypes,
      { id: crypto.randomUUID(), type: 'Short Answer Questions', count: 2, marks: 2 },
    ]);
  };

  const totalQ = questionTypes.reduce((s, qt) => s + qt.count, 0);
  const totalM = questionTypes.reduce((s, qt) => s + qt.count * qt.marks, 0);

  return (
    <div className="fade-in">
      <div className="qt-list">
        {questionTypes.map(qt => (
          <div key={qt.id} className="qt-item">
            <div className="qt-info">
              <select
                className="form-input"
                style={{ width: 220, padding: '8px 12px', fontSize: 14, marginBottom: 4 }}
                value={qt.type}
                onChange={e => updateRow(qt.id, 'type', e.target.value)}
              >
                {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="qt-controls">
              <div className="counter-widget">
                <span className="counter-label">Questions</span>
                <div className="counter-buttons">
                  <button className="counter-btn" onClick={() => updateRow(qt.id, 'count', qt.count - 1)} disabled={qt.count <= 1}>−</button>
                  <span className="counter-value">{qt.count}</span>
                  <button className="counter-btn" onClick={() => updateRow(qt.id, 'count', qt.count + 1)}>+</button>
                </div>
              </div>
              
              <div className="counter-widget">
                <span className="counter-label">Marks</span>
                <div className="counter-buttons">
                  <button className="counter-btn" onClick={() => updateRow(qt.id, 'marks', qt.marks - 1)} disabled={qt.marks <= 1}>−</button>
                  <span className="counter-value">{qt.marks}</span>
                  <button className="counter-btn" onClick={() => updateRow(qt.id, 'marks', qt.marks + 1)}>+</button>
                </div>
              </div>

              <button className="qt-delete" onClick={() => removeRow(qt.id)} title="Remove Type">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" onClick={addRow} style={{ marginTop: 16 }}>
        + Add Question Type
      </button>

      <div className="qt-summary-bar">
        <div className="qt-summary-stat">
          <span className="label">Total Questions</span>
          <span className="value">{totalQ}</span>
        </div>
        <div className="qt-summary-stat">
          <span className="label">Total Marks</span>
          <span className="value">{totalM}</span>
        </div>
      </div>
    </div>
  );
}
