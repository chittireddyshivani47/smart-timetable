import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon, color, to }) {
  const content = (
    <div className={`card p-5 hover:shadow-md transition-shadow duration-200 ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>{icon}</div>
        {to && <span className="text-xs text-slate-400">View →</span>}
      </div>
      <p className="text-2xl font-bold text-slate-900 font-display">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ subjects: 0, faculty: 0, classrooms: 0, timetables: 0 });
  const [recentTimetables, setRecentTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, f, c, t] = await Promise.all([
          API.get('/subjects'),
          API.get('/faculty'),
          API.get('/classrooms'),
          API.get('/timetables'),
        ]);
        setStats({
          subjects: s.data.data.length,
          faculty: f.data.data.length,
          classrooms: c.data.data.length,
          timetables: t.data.data.length,
        });
        setRecentTimetables(t.data.data.slice(0, 5));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-display">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {user?.institution || 'Your Institution'} — Smart Timetable Management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Subjects" value={loading ? '—' : stats.subjects} icon="📚" color="bg-blue-50 text-blue-600" to="/subjects" />
        <StatCard label="Faculty Members" value={loading ? '—' : stats.faculty} icon="👩‍🏫" color="bg-green-50 text-green-600" to="/faculty" />
        <StatCard label="Classrooms" value={loading ? '—' : stats.classrooms} icon="🏫" color="bg-amber-50 text-amber-600" to="/classrooms" />
        <StatCard label="Timetables" value={loading ? '—' : stats.timetables} icon="📅" color="bg-purple-50 text-purple-600" to="/timetables" />
      </div>

      {/* Quick actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 font-display text-sm">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/subjects', label: 'Add Subject', icon: '📚', desc: 'Manage course subjects' },
              { to: '/faculty', label: 'Add Faculty', icon: '👩‍🏫', desc: 'Manage teaching staff' },
              { to: '/classrooms', label: 'Add Classroom', icon: '🏫', desc: 'Manage rooms & labs' },
              { to: '/generate', label: 'Generate Timetable', icon: '⚡', desc: 'Auto-generate schedule', primary: true },
            ].map(({ to, label, icon, desc, primary }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ${
                  primary ? 'bg-primary-600 text-white hover:bg-primary-700' : 'hover:bg-slate-50 border border-slate-100'
                }`}>
                <span className="text-base">{icon}</span>
                <div>
                  <p className={`text-xs font-semibold ${primary ? 'text-white' : 'text-slate-800'}`}>{label}</p>
                  <p className={`text-xs ${primary ? 'text-primary-100' : 'text-slate-400'}`}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Timetables */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 font-display text-sm">Recent Timetables</h2>
            <Link to="/timetables" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 shimmer rounded-lg" />)}
            </div>
          ) : recentTimetables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm text-slate-500">No timetables yet</p>
              <Link to="/generate" className="btn-primary mt-3 text-xs py-1.5 px-3">Generate First Timetable</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTimetables.map(tt => (
                <Link key={tt._id} to={`/timetables/${tt._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tt.name}</p>
                    <p className="text-xs text-slate-400">{tt.department || 'General'} • {tt.semester || ''}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tt.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tt.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(tt.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Setup Guide */}
      {stats.subjects === 0 && !loading && (
        <div className="mt-6 card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100">
          <h3 className="font-semibold text-primary-900 font-display mb-2">🚀 Getting Started</h3>
          <p className="text-sm text-primary-700 mb-4">Follow these steps to generate your first timetable:</p>
          <div className="flex flex-wrap gap-3">
            {['1. Add Subjects', '2. Add Faculty', '3. Add Classrooms', '4. Generate Timetable'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-primary-700 bg-white px-3 py-1.5 rounded-full border border-primary-200">
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
