import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function TimetableListPage() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await API.get('/timetables'); setTimetables(data.data); }
    catch { toast.error('Failed to load timetables'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Delete this timetable?')) return;
    try { await API.delete(`/timetables/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Timetables</h1>
          <p className="text-sm text-slate-500 mt-0.5">{timetables.length} saved timetables</p>
        </div>
        <Link to="/generate" className="btn-primary">⚡ Generate New</Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}</div>
      ) : timetables.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-3">📅</p>
          <p className="font-medium text-slate-700 mb-1">No timetables yet</p>
          <p className="text-sm text-slate-400 mb-4">Generate your first automatic timetable</p>
          <Link to="/generate" className="btn-primary">⚡ Generate Timetable</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map(tt => (
            <Link key={tt._id} to={`/timetables/${tt._id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-all hover:border-primary-200 block">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📅</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{tt.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tt.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {tt.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {tt.department && <span className="text-xs text-slate-500">🏛 {tt.department}</span>}
                  {tt.semester && <span className="text-xs text-slate-500">📖 {tt.semester}</span>}
                  {tt.academicYear && <span className="text-xs text-slate-500">📅 {tt.academicYear}</span>}
                  <span className="text-xs text-slate-400">{new Date(tt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {tt.generationStats && (
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-slate-400">⚡ {tt.generationStats.timeTaken}ms</span>
                    <span className="text-xs text-slate-400">🔄 {tt.generationStats.iterations} iterations</span>
                    {tt.generationStats.conflicts > 0 && <span className="text-xs text-orange-500">⚠ {tt.generationStats.conflicts} backtracks</span>}
                  </div>
                )}
              </div>
              <button onClick={(e) => handleDelete(tt._id, e)}
                className="btn-danger text-xs py-1.5 px-3 flex-shrink-0 opacity-70 hover:opacity-100">
                Delete
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
