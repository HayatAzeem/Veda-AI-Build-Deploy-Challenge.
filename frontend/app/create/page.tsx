'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import WSProvider from '../components/WSProvider';
import FileUpload from '../components/FileUpload';
import QuestionTypeTable from '../components/QuestionTypeTable';
import ProgressOverlay from '../components/ProgressOverlay';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { createAssignment } from '../lib/api';
import { subscribeToAssignment } from '../lib/websocket';

type Errors = Partial<Record<string, string>>;

export default function CreatePage() {
  const router = useRouter();
  const { formData, setFormField, resetForm, addAssignment, jobProgress, setJobProgress } = useAssignmentStore();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.subject.trim()) e.subject = 'Subject is required';
    if (!formData.grade.trim()) e.grade = 'Grade is required';
    if (!formData.dueDate) e.dueDate = 'Due date is required';
    if (new Date(formData.dueDate) < new Date()) e.dueDate = 'Due date must be in the future';
    if (formData.questionTypes.length === 0) e.questionTypes = 'Add at least one question type';
    for (const qt of formData.questionTypes) {
      if (!qt.type.trim()) { e.questionTypes = 'All question types must have a type'; break; }
      if (qt.count < 1) { e.questionTypes = 'Question count must be at least 1'; break; }
      if (qt.marks < 1) { e.questionTypes = 'Marks must be at least 1'; break; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('subject', formData.subject);
      fd.append('grade', formData.grade);
      fd.append('dueDate', formData.dueDate);
      fd.append('questionTypes', JSON.stringify(formData.questionTypes));
      fd.append('instructions', formData.instructions);
      if (formData.file) fd.append('file', formData.file);

      const result = await createAssignment(fd);
      const assignmentId = result.assignment._id;

      addAssignment({ ...result.assignment, questionTypes: formData.questionTypes });
      setActiveJobId(assignmentId);

      setJobProgress(assignmentId, {
        assignmentId,
        status: 'pending',
        progress: 5,
        message: 'Assignment created, queued for generation...',
      });

      // Subscribe to WS updates
      subscribeToAssignment(assignmentId);

      // Poll & redirect when complete
      const pollInterval = setInterval(async () => {
        const state = useAssignmentStore.getState();
        const prog = state.jobProgress[assignmentId];
        if (prog?.status === 'completed') {
          clearInterval(pollInterval);
          resetForm();
          setTimeout(() => router.push(`/output/${assignmentId}`), 800);
        }
        if (prog?.status === 'failed') {
          clearInterval(pollInterval);
          setSubmitting(false);
          setActiveJobId(null);
        }
      }, 1000);

      // Timeout fallback after 3 min
      setTimeout(() => clearInterval(pollInterval), 180000);
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.error || 'Failed to create assignment. Is the backend running?' });
      setSubmitting(false);
    }
  };

  const [step, setStep] = useState(1);
  const activeProgress = activeJobId ? jobProgress[activeJobId] : null;

  const nextStep = () => {
    // Validate step 1
    if (step === 1) {
      const e: Errors = {};
      if (!formData.title.trim()) e.title = 'Title is required';
      if (!formData.subject.trim()) e.subject = 'Subject is required';
      if (!formData.grade.trim()) e.grade = 'Grade is required';
      if (!formData.dueDate) e.dueDate = 'Due date is required';
      if (new Date(formData.dueDate) < new Date()) e.dueDate = 'Due date must be in the future';
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    // Validate step 2
    if (step === 2) {
      const e: Errors = {};
      if (formData.questionTypes.length === 0) e.questionTypes = 'Add at least one question type';
      for (const qt of formData.questionTypes) {
        if (!qt.type.trim()) { e.questionTypes = 'All question types must have a type'; break; }
        if (qt.count < 1) { e.questionTypes = 'Question count must be at least 1'; break; }
        if (qt.marks < 1) { e.questionTypes = 'Marks must be at least 1'; break; }
      }
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <WSProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="topbar">
            <div className="topbar-left">
              <h1>Create Assignment</h1>
              <p>Fill in the details and AI will generate your question paper</p>
            </div>
            <div className="topbar-right">
              <Link href="/" className="btn btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="page-content">
            <div className="wizard-container fade-in">
              {/* Wizard Tabs */}
              <div className="wizard-header">
                {[
                  { num: 1, title: 'Assignment Details' },
                  { num: 2, title: 'Question Structure' },
                  { num: 3, title: 'Instructions & Material' }
                ].map(s => (
                  <div key={s.num} className={`wizard-step-tab ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
                    <div className="wizard-step-num">
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <div className="wizard-step-title">{s.title}</div>
                  </div>
                ))}
              </div>

              <div className="wizard-body">
                {errors.submit && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#991b1b', fontSize: 14 }}>
                    ⚠️ {errors.submit}
                  </div>
                )}

                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="fade-in">
                    <div className="form-row">
                      <div className="form-group full">
                        <label className="form-label">Assignment Title <span style={{color:'var(--accent)'}}>*</span></label>
                        <input
                          id="title"
                          className={`form-input ${errors.title ? 'error' : ''}`}
                          placeholder="e.g. Unit 3 — Chemical Reactions Test"
                          value={formData.title}
                          onChange={e => { setFormField('title', e.target.value); setErrors(er => ({ ...er, title: '' })); }}
                        />
                        {errors.title && <span className="form-error">{errors.title}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject <span style={{color:'var(--accent)'}}>*</span></label>
                        <input
                          id="subject"
                          className={`form-input ${errors.subject ? 'error' : ''}`}
                          placeholder="e.g. Chemistry, Mathematics"
                          value={formData.subject}
                          onChange={e => { setFormField('subject', e.target.value); setErrors(er => ({ ...er, subject: '' })); }}
                        />
                        {errors.subject && <span className="form-error">{errors.subject}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Grade / Class <span style={{color:'var(--accent)'}}>*</span></label>
                        <input
                          id="grade"
                          className={`form-input ${errors.grade ? 'error' : ''}`}
                          placeholder="e.g. Grade 10, Class 8"
                          value={formData.grade}
                          onChange={e => { setFormField('grade', e.target.value); setErrors(er => ({ ...er, grade: '' })); }}
                        />
                        {errors.grade && <span className="form-error">{errors.grade}</span>}
                      </div>
                      <div className="form-group full">
                        <label className="form-label">Due Date <span style={{color:'var(--accent)'}}>*</span></label>
                        <input
                          id="dueDate"
                          type="date"
                          style={{ maxWidth: 300 }}
                          className={`form-input ${errors.dueDate ? 'error' : ''}`}
                          value={formData.dueDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => { setFormField('dueDate', e.target.value); setErrors(er => ({ ...er, dueDate: '' })); }}
                        />
                        {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Question Types */}
                {step === 2 && (
                  <div className="fade-in">
                    <QuestionTypeTable />
                    {errors.questionTypes && (
                      <p className="form-error" style={{ marginTop: 16 }}>{errors.questionTypes}</p>
                    )}
                  </div>
                )}

                {/* Step 3: Instructions + File */}
                {step === 3 && (
                  <div className="fade-in">
                    <div className="form-group" style={{ marginBottom: 32 }}>
                      <label className="form-label">Additional Instructions</label>
                      <textarea
                        id="instructions"
                        className="form-input"
                        placeholder="e.g. Focus on chapters 4-6, include application-based questions, avoid repetition..."
                        value={formData.instructions}
                        onChange={e => setFormField('instructions', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reference Material <span style={{ color: 'var(--text-muted)' }}>(Optional context file)</span></label>
                      <FileUpload />
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Footer */}
              <div className="wizard-footer">
                <div>
                  {step > 1 && (
                    <button className="btn btn-secondary" onClick={prevStep} disabled={submitting}>
                      Back
                    </button>
                  )}
                </div>
                <div>
                  {step < 3 ? (
                    <button className="btn btn-primary" onClick={nextStep}>
                      Continue →
                    </button>
                  ) : (
                    <button
                      id="generate-btn"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? '⏳ Generating...' : '🤖 Generate Paper'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {activeProgress && (
        <ProgressOverlay progress={activeProgress} />
      )}
    </WSProvider>
  );
}
