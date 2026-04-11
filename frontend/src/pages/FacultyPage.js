import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const defaultForm = { name: '', email: '', department: '', subjects: [], maxHoursPerDay: 6, availableDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'] };

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="card w-full max-w-lg p-6 shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 font-display">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const [f, s] = await Promise.all([API.get('/faculty'), API.get('/subjects')]);
      setFaculty(f.data.data);
      setSubjects(s.data.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(defaultForm); setEditing(null); setShowModal(true); };
  const openEdit = (f) => {
    setForm({
      name: f.name, email: f.email || '', department: f.department || '',
      subjects: f.subjects?.map(s => s._id || s) || [],
      maxHoursPerDay: f.maxHoursPerDay || 6,
      availableDays: f.availableDays || ['Monday','Tuesday','Wednesday','Thursday','Friday']
    });
    setEditing(f._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await API.put(`/faculty/${editing}`, form); toast.success('Faculty updated'); }
      else { await API.post('/faculty', form); toast.success('Faculty added'); }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty member?')) return;
    try { await API.delete(`/faculty/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleSubject = (id) => setForm(p => ({
    ...p,
    subjects: p.subjects.includes(id) ? p.subjects.filter(s => s !== id) : [...p.subjects, id]
  }));

  const toggleDay = (day) => setForm(p => ({
    ...p,
    availableDays: p.availableDays.includes(day) ? p.availableDays.filter(d => d !== day) : [...p.availableDays, day]
  }));

  const handleCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await API.post('/upload/faculty', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${data.count} faculty`); load();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Faculty</h1>
          <p className="text-sm text-slate-500 mt-0.5">{faculty.length} faculty members</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={() => window.open('/api/upload/sample/faculty', '_blank')} className="btn-secondary text-xs">📥 Sample CSV</button>
          <button onClick={() => fileRef.current.click()} className="btn-secondary text-xs">📤 Import CSV</button>
          <button onClick={openAdd} className="btn-primary">+ Add Faculty</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 shimmer rounded-xl" />)}</div>
      ) : faculty.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">👩‍🏫</p>
          <p className="font-medium text-slate-700 mb-1">No faculty members yet</p>
          <p className="text-sm text-slate-400 mb-4">Add faculty to assign subjects</p>
          <button onClick={openAdd} className="btn-primary">+ Add Faculty</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Subjects</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 hidden lg:table-cell">Max hrs/day</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((f, i) => (
                <tr key={f._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 text-xs font-bold">{f.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{f.name}</p>
                        {f.email && <p className="text-xs text-slate-400">{f.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{f.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {f.subjects?.slice(0,3).map(s => (
                        <span key={s._id} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s.code || s.name}</span>
                      ))}
                      {f.subjects?.length > 3 && <span className="text-xs text-slate-400">+{f.subjects.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{f.maxHoursPerDay}h</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => openEdit(f)} className="btn-secondary text-xs py-1 px-2">Edit</button>
                      <button onClick={() => handleDelete(f._id)} className="btn-danger text-xs py-1 px-2">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Faculty' : 'Add Faculty'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Dr. Smith" />
            </div>
            <div>
              <label className="label">Department</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input-field" placeholder="Mathematics" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="smith@college.edu" />
            </div>
            <div>
              <label className="label">Max Hours/Day</label>
              <input type="number" min="1" max="10" value={form.maxHoursPerDay} onChange={e => setForm(p => ({ ...p, maxHoursPerDay: parseInt(e.target.value) }))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">Can Teach Subjects</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {subjects.map(s => (
                <button key={s._id} type="button" onClick={() => toggleSubject(s._id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${form.subjects.includes(s._id) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
                  {s.code} – {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Available Days</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${form.availableDays.includes(day) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {day.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : (editing ? 'Update' : 'Add Faculty')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
