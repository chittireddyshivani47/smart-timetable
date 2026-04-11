import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const defaultForm = { roomNumber: '', building: '', capacity: 60, type: 'lecture', facilities: [] };
const FACILITIES = ['Projector', 'Whiteboard', 'AC', 'Smart Board', 'Computers', 'Equipment', 'Fume Hood'];
const TYPES = ['lecture', 'lab', 'seminar'];

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="card w-full max-w-md p-6 shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 font-display">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const TYPE_ICONS = { lecture: '🏫', lab: '🔬', seminar: '📝' };
const TYPE_COLORS = { lecture: 'bg-blue-50 text-blue-700', lab: 'bg-green-50 text-green-700', seminar: 'bg-purple-50 text-purple-700' };

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try { const { data } = await API.get('/classrooms'); setClassrooms(data.data); }
    catch { toast.error('Failed to load classrooms'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(defaultForm); setEditing(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ roomNumber: c.roomNumber, building: c.building || '', capacity: c.capacity, type: c.type, facilities: c.facilities || [] });
    setEditing(c._id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await API.put(`/classrooms/${editing}`, form); toast.success('Classroom updated'); }
      else { await API.post('/classrooms', form); toast.success('Classroom added'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this classroom?')) return;
    try { await API.delete(`/classrooms/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleFacility = (f) => setForm(p => ({
    ...p, facilities: p.facilities.includes(f) ? p.facilities.filter(x => x !== f) : [...p.facilities, f]
  }));

  const handleCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      toast.success('Classrooms imported');
      load();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">Classrooms</h1>
          <p className="text-sm text-slate-500 mt-0.5">{classrooms.length} rooms configured</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={() => window.open('/api/upload/sample/classrooms', '_blank')} className="btn-secondary text-xs">📥 Sample CSV</button>
          <button onClick={() => fileRef.current.click()} className="btn-secondary text-xs">📤 Import</button>
          <button onClick={openAdd} className="btn-primary">+ Add Room</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 shimmer rounded-xl" />)}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🏫</p>
          <p className="font-medium text-slate-700 mb-1">No classrooms yet</p>
          <p className="text-sm text-slate-400 mb-4">Add classrooms and labs</p>
          <button onClick={openAdd} className="btn-primary">+ Add First Room</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(c => (
            <div key={c._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICONS[c.type]}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{c.roomNumber}</p>
                    <p className="text-xs text-slate-400">{c.building || 'Main Building'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[c.type]}`}>{c.type}</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-slate-500">👥 Capacity:</span>
                <span className="text-xs font-medium text-slate-700">{c.capacity} students</span>
              </div>
              {c.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.facilities.map(f => (
                    <span key={f} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEdit(c)} className="btn-secondary text-xs py-1 flex-1 justify-center">Edit</button>
                <button onClick={() => handleDelete(c._id)} className="btn-danger text-xs py-1 flex-1 justify-center">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Classroom' : 'Add Classroom'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Room Number *</label>
              <input required value={form.roomNumber} onChange={e => setForm(p => ({ ...p, roomNumber: e.target.value }))} className="input-field" placeholder="A101" />
            </div>
            <div>
              <label className="label">Building</label>
              <input value={form.building} onChange={e => setForm(p => ({ ...p, building: e.target.value }))} className="input-field" placeholder="Block A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capacity *</label>
              <input type="number" min="1" required value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) }))} className="input-field" />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field">
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Facilities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {FACILITIES.map(f => (
                <button key={f} type="button" onClick={() => toggleFacility(f)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${form.facilities.includes(f) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : (editing ? 'Update' : 'Add Room')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
