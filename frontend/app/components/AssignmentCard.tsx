'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Assignment } from '../store/useAssignmentStore';
import { format } from 'date-fns';

interface Props {
  assignment: Assignment;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
}

const statusLabel: Record<string, string> = {
  pending: 'Queued', processing: 'Generating...', completed: 'Ready', failed: 'Failed',
};

export default function AssignmentCard({ assignment, onDelete, onRetry }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalQ = assignment.questionTypes?.reduce((s, qt) => s + qt.count, 0) ?? 0;
  const totalM = assignment.questionTypes?.reduce((s, qt) => s + qt.count * qt.marks, 0) ?? 0;

  return (
    <div className="assignment-card fade-in">
      <div className="assignment-card-header">
        <div>
          <span className="assignment-badge">Quiz</span>
          <div className="assignment-card-title">{assignment.title}</div>
        </div>
        <div className="menu-wrap">
          <button className="menu-dot-btn" onClick={() => setMenuOpen(o => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              {assignment.status === 'completed' && (
                <Link
                  href={`/output/${assignment._id}`}
                  className="dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View Paper
                </Link>
              )}
              <div
                className="dropdown-item danger"
                onClick={() => { setMenuOpen(false); onDelete(assignment._id); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                Delete
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="assignment-card-desc">
        {assignment.instructions || "No additional instructions provided for this assignment."}
      </div>

      <div className="assignment-card-meta">
        <div className="meta-item">
          <span className="meta-label">Subject & Grade</span>
          <span className="meta-value">{assignment.subject} · {assignment.grade}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Due Date</span>
          <span className="meta-value">{assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, yyyy') : '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Questions & Marks</span>
          <span className="meta-value">{totalQ} Qs · {totalM} Marks</span>
        </div>
      </div>

      <div className="assignment-card-footer">
        <span className={`status-badge status-${assignment.status}`}>
          {assignment.status === 'processing' && (
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#d97706', animation: 'wsGlow 1.5s infinite' }} />
          )}
          {statusLabel[assignment.status] || assignment.status}
        </span>
        {assignment.status === 'completed' ? (
          <Link href={`/output/${assignment._id}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>View Paper</Link>
        ) : assignment.status === 'failed' ? (
          <button className="btn btn-danger btn-sm" onClick={() => onRetry?.(assignment._id)}>Retry Generation</button>
        ) : (
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
        )}
      </div>
    </div>
  );
}
