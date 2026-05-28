'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAssignmentStore } from '../store/useAssignmentStore';

const navItems = [
  { href: '/home', icon: '🏠', label: 'Home' },
  { href: '/groups', icon: '👥', label: 'My Groups' },
  { href: '/', icon: '📝', label: 'Assignments' },
  { href: '/toolkit', icon: '🤖', label: "AI Teacher's Toolkit" },
  { href: '/library', icon: '📚', label: 'My Library' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { assignments, wsConnected } = useAssignmentStore();
  const pendingCount = assignments.filter(a => a.status === 'processing' || a.status === 'pending').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">V</div>
          <div className="logo-text-wrap">
            <div className="logo-text">VedaAI</div>
            <div className="logo-sub">Assessment Creator</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={label}
            href={href}
            className={`sidebar-item ${(pathname === href || (pathname === '/create' && label === 'Assignments')) ? 'active' : ''}`}
          >
            <span className="sidebar-item-icon">{icon}</span>
            <span>{label}</span>
            {label === 'Assignments' && assignments.length > 0 && (
              <span className="sidebar-badge">{assignments.length}</span>
            )}
          </Link>
        ))}

        {pendingCount > 0 && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 12 }}>Active Jobs</div>
            <div className="sidebar-item">
              <span className="sidebar-item-icon">⚡</span>
              <span>Processing</span>
              <span className="sidebar-badge" style={{ background: '#f59e0b' }}>{pendingCount}</span>
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: 12, padding: '4px 12px' }}>
          <div className="ws-indicator">
            <div className={`ws-dot ${wsConnected ? 'connected' : ''}`} />
            <span>{wsConnected ? 'Live Updates On' : 'Connecting...'}</span>
          </div>
        </div>

        <Link href="/settings" className={`sidebar-item ${pathname === '/settings' ? 'active' : ''}`} style={{ marginBottom: 16 }}>
          <span className="sidebar-item-icon">⚙️</span>
          <span>Settings</span>
        </Link>
        <div className="sidebar-avatar">
          <img src="/logo.png" alt="Profile" className="avatar-image" />
          <div className="avatar-details">
            <div className="avatar-name">John Doe</div>
            <div className="avatar-role" title="Delhi Public School">Delhi Public School</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
