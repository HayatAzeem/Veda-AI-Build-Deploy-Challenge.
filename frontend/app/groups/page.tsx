'use client';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function GroupsPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>My Groups</h1>
            <p>Manage your student groups and classes</p>
          </div>
        </div>
        <div className="page-content">
          <div className="empty-state fade-in">
            <div className="empty-state-graphic">
              <span style={{ fontSize: 64 }}>🚧</span>
            </div>
            <h2 className="empty-state-title">Coming Soon</h2>
            <p className="empty-state-sub">The Groups feature is currently under construction.</p>
            <Link href="/" className="btn btn-primary">Go to Assignments</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
