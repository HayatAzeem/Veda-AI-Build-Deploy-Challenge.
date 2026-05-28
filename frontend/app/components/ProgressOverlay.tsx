'use client';
import { JobProgress } from '../store/useAssignmentStore';

export default function ProgressOverlay({ progress }: { progress: JobProgress }) {
  const icons: Record<string, string> = {
    pending: '⏳', processing: '🤖', completed: '✅', failed: '❌',
  };
  return (
    <div className="progress-overlay">
      <div className="progress-card fade-in">
        <div className="progress-icon">{icons[progress.status] || '⏳'}</div>
        <div className="progress-title">
          {progress.status === 'completed' ? 'Paper Generated!' :
           progress.status === 'failed' ? 'Generation Failed' :
           'Generating Question Paper'}
        </div>
        <div className="progress-msg">{progress.message}</div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress.progress}%` }} />
        </div>
        <div className="progress-pct">{progress.progress}%</div>
        {progress.status === 'failed' && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 12 }}>
            Please try regenerating the assignment.
          </p>
        )}
      </div>
    </div>
  );
}
