import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1'];
const TYPES = ['theory', 'lab', 'tutorial'];

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="card w-full max-w-md p-6 shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 font-display">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const defaultForm = { name: '', code: '', hoursPerWeek: 3, type: 'theory', isPriority: false, color: '#3B82F6' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const { data } = await API.get('/subjects');
      setSubjects(data.data);
    } catch { toast.error('Failed to load subjects'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(defaultForm); setEditing(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, code: s.code, hoursPerWeek: s.hoursPerWeek, type: s.type, isPriority: s.isPriority, color: s.color || '#3B82F6' }); setEditing(s._id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/subjects/${editing}`, form);
        toast.success('Subject updated');
      } else {
        await API.post('/subjects', form);
        toast.success('Subject added');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await API.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await API.post('/upload/subjects', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${data.count} subjects`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
    e.target.value = '';
  };

  const downloadSample = () => { window.open('/api/upload/sample/subjects', '_blank'); };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Subjects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subjects.length} subjects configured</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={downloadSample} className="btn-secondary text-xs">📥 Sample CSV</button>
          <button onClick={() => fileRef.current.click()} className="btn-secondary text-xs">📤 Import CSV</button>
          <button onClick={openAdd} className="btn-primary">+ Add Subject</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 shimmer rounded-xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-medium text-slate-700 mb-1">No subjects yet</p>
          <p className="text-sm text-slate-400 mb-4">Add subjects to start building your timetable</p>
          <button onClick={openAdd} className="btn-primary">+ Add First Subject</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#3B82F6' }} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.code}</p>
                  </div>
                </div>
                {s.isPriority && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">★ Priority</span>}
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.hoursPerWeek} hrs/week</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{s.type}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(s)} className="btn-secondary text-xs py-1 flex-1 justify-center">Edit</button>
                <button onClick={() => handleDelete(s._id)} className="btn-danger text-xs py-1 flex-1 justify-center">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subject Name *</label>
              <input required value={form.name} onChange={set('name')} className="input-field" placeholder="Mathematics" />
            </div>
            <div>
              <label className="label">Subject Code *</label>
              <input required value={form.code} onChange={set('code')} className="input-field" placeholder="MATH101" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hours/Week *</label>
              <input type="number" min="1" max="30" required value={form.hoursPerWeek} onChange={set('hoursPerWeek')} className="input-field" />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={set('type')} className="input-field">
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPriority} onChange={set('isPriority')} className="rounded" />
            <span className="text-sm text-slate-700">Priority subject (schedule in morning)</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : (editing ? 'Update' : 'Add Subject')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
