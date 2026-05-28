'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import WSProvider from '../../components/WSProvider';
import QuestionPaper from '../../components/QuestionPaper';
import ProgressOverlay from '../../components/ProgressOverlay';
import { useAssignmentStore, GeneratedPaper, Assignment } from '../../store/useAssignmentStore';
import { fetchAssignment, regenerateAssignment } from '../../lib/api';
import { subscribeToAssignment } from '../../lib/websocket';

export default function OutputPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { jobProgress, setJobProgress, showAnswerKey, toggleAnswerKey } = useAssignmentStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    subscribeToAssignment(id);
    loadData();
  }, [id]);

  // Listen for completion via WS
  useEffect(() => {
    const prog = jobProgress[id];
    if (prog?.status === 'completed' && !paper) {
      loadData();
    }
  }, [jobProgress[id]?.status]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAssignment(id);
      setAssignment(data.assignment);
      if (data.paper) setPaper(data.paper);
      else if (data.assignment.status === 'pending' || data.assignment.status === 'processing') {
        setJobProgress(id, {
          assignmentId: id,
          status: data.assignment.status,
          progress: data.assignment.status === 'processing' ? 40 : 10,
          message: data.assignment.status === 'processing' ? 'Generating with Gemini AI...' : 'Queued for generation...',
        });
      }
    } catch {
      setError('Could not load this assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('This will regenerate the question paper from scratch. Continue?')) return;
    setRegenerating(true);
    setPaper(null);
    try {
      await regenerateAssignment(id);
      subscribeToAssignment(id);
      setJobProgress(id, {
        assignmentId: id,
        status: 'pending',
        progress: 5,
        message: 'Regeneration queued...',
      });
    } catch {
      alert('Failed to queue regeneration.');
      setRegenerating(false);
    }
  };

  const handlePrint = async () => {
    const element = document.querySelector('.paper-container') as HTMLElement;
    if (!element) {
      alert('Paper content not found!');
      return;
    }
    
    try {
      // Dynamically import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt: any = {
        margin:       10,
        filename:     `${assignment?.title || 'question_paper'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const activeProgress = jobProgress[id];
  const easyCount = paper?.sections.flatMap(s => s.questions).filter(q => q.difficulty === 'easy').length ?? 0;
  const modCount = paper?.sections.flatMap(s => s.questions).filter(q => q.difficulty === 'moderate').length ?? 0;
  const hardCount = paper?.sections.flatMap(s => s.questions).filter(q => q.difficulty === 'hard').length ?? 0;
  const totalQ = paper?.totalQuestions ?? 0;

  return (
    <WSProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-left">
              <h1>{assignment?.title || 'Question Paper'}</h1>
              <p>{assignment ? `${assignment.subject} · Grade ${assignment.grade}` : 'Loading...'}</p>
            </div>
            <div className="topbar-right">
              <Link href="/" className="btn btn-secondary btn-sm">← Dashboard</Link>
              {paper && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={toggleAnswerKey}>
                    {showAnswerKey ? '🙈 Hide Answers' : '📋 Answer Key'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨️ Print / PDF</button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >🔄 Regenerate</button>
                </>
              )}
            </div>
          </div>

          <div className="page-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div className="spinner" />
                <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>Loading paper...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h2 className="empty-state-title">Error</h2>
                <p className="empty-state-sub">{error}</p>
                <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
              </div>
            ) : !paper ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <h2 className="empty-state-title">Paper Not Ready Yet</h2>
                <p className="empty-state-sub">The question paper is being generated. You&apos;ll be notified when it&apos;s done.</p>
                <Link href="/" className="btn btn-secondary">Back to Dashboard</Link>
              </div>
            ) : (
              <div className="output-layout fade-in">
                {/* Paper */}
                <div className="paper-wrap">
                  <QuestionPaper
                    paper={paper}
                    showAnswerKey={showAnswerKey}
                    assignmentTitle={assignment?.title}
                  />
                </div>

                {/* Action Panel */}
                <div className="action-panel">
                  {/* Chat bubble */}
                  <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f1724)', borderRadius: '12px 12px 12px 0', padding: '12px 16px', color: 'white', fontSize: 12.5, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11, opacity: 0.7 }}>🤖 Gemini AI</div>
                      I&apos;ve generated a structured question paper for <strong>{assignment?.subject}</strong> with {paper.totalQuestions} questions worth {paper.totalMarks} marks. The questions are distributed across {paper.sections.length} sections with balanced difficulty levels.
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="paper-stats">
                    <div className="stat-box">
                      <div className="stat-value">{paper.totalQuestions}</div>
                      <div className="stat-label">Questions</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{paper.totalMarks}</div>
                      <div className="stat-label">Total Marks</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{paper.sections.length}</div>
                      <div className="stat-label">Sections</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{paper.timeAllowed}</div>
                      <div className="stat-label">Duration</div>
                    </div>
                  </div>

                  {/* Difficulty Breakdown */}
                  {totalQ > 0 && (
                    <div className="diff-breakdown">
                      <div className="diff-breakdown-title">Difficulty Distribution</div>
                      {[
                        { label: 'Easy', count: easyCount, cls: 'easy' },
                        { label: 'Moderate', count: modCount, cls: 'moderate' },
                        { label: 'Hard', count: hardCount, cls: 'hard' },
                      ].map(({ label, count, cls }) => (
                        <div key={label} className="diff-bar-row">
                          <span className="diff-bar-label">{label}</span>
                          <div className="diff-bar-track">
                            <div className={`diff-bar-fill ${cls}`} style={{ width: `${(count / totalQ) * 100}%` }} />
                          </div>
                          <span className="diff-bar-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="action-panel-body">
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={toggleAnswerKey}>
                      {showAnswerKey ? '🙈 Hide Answer Key' : '📋 Show Answer Key'}
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePrint}>
                      🖨️ Download / Print PDF
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleRegenerate}
                      disabled={regenerating}
                    >
                      🔄 Regenerate Paper
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {activeProgress && (activeProgress.status === 'pending' || activeProgress.status === 'processing') && (
        <ProgressOverlay progress={activeProgress} />
      )}
    </WSProvider>
  );
}
