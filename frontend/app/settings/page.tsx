'use client';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function SettingsPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Settings</h1>
            <p>Manage your account and preferences</p>
          </div>
        </div>
        <div className="page-content">
          <div className="empty-state fade-in">
            <div className="empty-state-graphic">
              <span style={{ fontSize: 64 }}>🚧</span>
            </div>
            <h2 className="empty-state-title">Coming Soon</h2>
            <p className="empty-state-sub">Settings and preferences are currently under construction.</p>
            <Link href="/" className="btn btn-primary">Go to Assignments</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
