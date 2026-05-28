'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from './components/Sidebar';
import AssignmentCard from './components/AssignmentCard';
import WSProvider from './components/WSProvider';
import { useAssignmentStore } from './store/useAssignmentStore';
import { fetchAssignments, deleteAssignment, regenerateAssignment } from './lib/api';

export default function HomePage() {
  const { assignments, setAssignments, removeAssignment } = useAssignmentStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssignments()
      .then(setAssignments)
      .catch(() => setError('Could not load assignments. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [setAssignments]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment and its generated paper?')) return;
    try {
      await deleteAssignment(id);
      removeAssignment(id);
    } catch {
      alert('Failed to delete assignment.');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await regenerateAssignment(id);
      const updated = await fetchAssignments();
      setAssignments(updated);
    } catch {
      alert('Failed to retry assignment.');
    }
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <WSProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-left">
              <h1>My Assignments</h1>
              <p>{assignments.length} total · {assignments.filter(a => a.status === 'completed').length} completed</p>
            </div>
            <div className="topbar-right">
              <input
                className="form-input"
                style={{ width: 220, height: 36, fontSize: 13 }}
                placeholder="🔍 Search assignments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Link href="/create" className="btn btn-primary">
                ＋ Create Assignment
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="page-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <div className="spinner" />
                <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>Loading assignments...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h2 className="empty-state-title">Backend Offline</h2>
                <p className="empty-state-sub">{error}</p>
                <Link href="/create" className="btn btn-primary btn-lg">Create Assignment Anyway</Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state fade-in">
                <div className="empty-state-graphic">
                  <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="100" height="100" rx="24" fill="#F4F4F5" />
                    <rect x="35" y="35" width="70" height="70" rx="16" fill="white" />
                    <circle cx="70" cy="65" r="24" stroke="#E4E4E7" strokeWidth="4" />
                    <path d="M85 80L100 95" stroke="#E4E4E7" strokeWidth="4" strokeLinecap="round" />
                    <path d="M70 55V65" stroke="#E84525" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="70" cy="73" r="2" fill="#E84525" />
                  </svg>
                </div>
                <h2 className="empty-state-title">
                  {search ? 'No results found' : 'Created Assignments will appear here'}
                </h2>
                <p className="empty-state-sub">
                  {search
                    ? `No assignments match "${search}". Try a different search.`
                    : 'Create your first AI-powered assignment. Fill in the details and let Gemini generate a structured question paper for you.'}
                </p>
                {!search && (
                  <Link href="/create" className="btn btn-primary">
                    <span style={{ fontSize: 18, marginRight: 4 }}>+</span> Create Assignment
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  {['all', 'completed', 'processing', 'pending', 'failed'].map(s => {
                    const count = s === 'all' ? assignments.length : assignments.filter(a => a.status === s).length;
                    if (count === 0 && s !== 'all') return null;
                    return (
                      <div key={s} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6, textTransform: 'capitalize' }}>{s === 'all' ? 'Total' : s}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="assignments-grid">
                  {filtered.map(a => (
                    <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} onRetry={handleRetry} />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </WSProvider>
  );
}
