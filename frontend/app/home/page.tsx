'use client';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function HomePage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Home</h1>
            <p>Welcome to VedaAI</p>
          </div>
        </div>
        <div className="page-content">
          <div className="empty-state fade-in">
            <div className="empty-state-graphic">
              <span style={{ fontSize: 64 }}>🚧</span>
            </div>
            <h2 className="empty-state-title">Coming Soon</h2>
            <p className="empty-state-sub">The Home dashboard is currently under construction.</p>
            <Link href="/" className="btn btn-primary">Go to Assignments</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
