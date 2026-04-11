import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const VIEW_MODES = ['class', 'faculty', 'room'];

function SlotCell({ slot, isBreak, onEdit, editing }) {
  if (!slot) return (
    <td className="timetable-cell border border-slate-100 p-1.5 text-center cursor-pointer hover:bg-primary-50 transition-colors"
      onClick={onEdit}>
      <span className="text-xs text-slate-300">Free</span>
    </td>
  );
  if (isBreak || slot?.isBreak) return (
    <td className="timetable-cell border border-amber-200 bg-amber-50 p-1.5 text-center">
      <span className="text-xs font-medium text-amber-600">🍽 {slot?.breakLabel || 'Lunch Break'}</span>
    </td>
  );
  const subColor = slot?.subject?.color || '#3B82F6';
  return (
    <td className="timetable-cell border border-slate-100 p-1 cursor-pointer transition-colors hover:opacity-90"
      onClick={onEdit} style={{ backgroundColor: subColor + '15' }}>
      <div className="flex flex-col h-full min-h-[60px] justify-between p-1">
        <div>
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold leading-tight" style={{ color: subColor }}>
              {slot?.subject?.name || '—'}
            </span>
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: subColor }} />
          </div>
          {slot?.subject?.code && <span className="text-xs text-slate-400">{slot.subject.code}</span>}
        </div>
        <div className="mt-1 space-y-0.5">
          {slot?.faculty?.name && (
            <div className="flex items-center gap-1">
              <span className="text-xs">👤</span>
              <span className="text-xs text-slate-500 truncate">{slot.faculty.name.split(' ').slice(-1)[0]}</span>
            </div>
          )}
          {slot?.classroom?.roomNumber && (
            <div className="flex items-center gap-1">
              <span className="text-xs">🏫</span>
              <span className="text-xs text-slate-500">{slot.classroom.roomNumber}</span>
            </div>
          )}
        </div>
      </div>
    </td>
  );
}

function EditModal({ show, slot, day, timeSlot, subjects, faculty, classrooms, onSave, onClose }) {
  const [form, setForm] = useState({ subject: '', faculty: '', classroom: '' });

  useEffect(() => {
    if (slot) {
      setForm({
        subject: slot.subject?._id || '',
        faculty: slot.faculty?._id || '',
        classroom: slot.classroom?._id || ''
      });
    } else {
      setForm({ subject: '', faculty: '', classroom: '' });
    }
  }, [slot, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="card w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 font-display text-sm">Edit Slot</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <div className="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded">{day} • {timeSlot}</div>
        <div className="space-y-3">
          <div>
            <label className="label">Subject</label>
            <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="input-field">
              <option value="">— Free Slot —</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Faculty</label>
            <select value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))} className="input-field">
              <option value="">— None —</option>
              {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Classroom</label>
            <select value={form.classroom} onChange={e => setForm(p => ({ ...p, classroom: e.target.value }))} className="input-field">
              <option value="">— None —</option>
              {classrooms.map(c => <option key={c._id} value={c._id}>{c.roomNumber} ({c.type})</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center text-xs">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary flex-1 justify-center text-xs">Save Slot</button>
        </div>
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('class');
  const [editSlot, setEditSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tt, s, f, c] = await Promise.all([
        API.get(`/timetables/${id}`),
        API.get('/subjects'),
        API.get('/faculty'),
        API.get('/classrooms'),
      ]);
      setTimetable(tt.data.data);
      setSubjects(s.data.data);
      setFaculty(f.data.data);
      setClassrooms(c.data.data);
    } catch { toast.error('Failed to load timetable'); navigate('/timetables'); }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const getSlot = (day, timeSlot) => {
    return timetable?.slots?.find(s => s.day === day && s.timeSlot === timeSlot) || null;
  };

  const handleEditSave = async (form) => {
    setSaving(true);
    try {
      await API.patch(`/timetables/${id}/slot`, {
        day: editSlot.day,
        timeSlot: editSlot.timeSlot,
        subject: form.subject || null,
        faculty: form.faculty || null,
        classroom: form.classroom || null,
      });
      toast.success('Slot updated');
      setEditSlot(null);
      load();
    } catch { toast.error('Failed to update slot'); }
    setSaving(false);
  };

  const getFacultySlots = (fac) => {
    return timetable?.slots?.filter(s => s.faculty?._id === fac._id || s.faculty?.toString() === fac._id) || [];
  };

  const getRoomSlots = (room) => {
    return timetable?.slots?.filter(s => s.classroom?._id === room._id || s.classroom?.toString() === room._id) || [];
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  if (!timetable) return null;

  const days = timetable.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = timetable.timeSlots || [];
  const uniqueFaculty = [...new Map(
    timetable.slots?.filter(s => s.faculty).map(s => [s.faculty._id, s.faculty])
  ).values()];
  const uniqueRooms = [...new Map(
    timetable.slots?.filter(s => s.classroom).map(s => [s.classroom._id, s.classroom])
  ).values()];

  return (
    <div className="max-w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/timetables')} className="text-slate-400 hover:text-slate-600 text-sm">← Back</button>
          </div>
          <h1 className="text-xl font-bold text-slate-900 font-display">{timetable.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1">
            {timetable.department && <span className="text-xs text-slate-500">🏛 {timetable.department}</span>}
            {timetable.semester && <span className="text-xs text-slate-500">📖 {timetable.semester}</span>}
            {timetable.academicYear && <span className="text-xs text-slate-500">📅 {timetable.academicYear}</span>}
          </div>
          {timetable.generationStats && (
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-slate-400">⚡ Generated in {timetable.generationStats.timeTaken}ms</span>
              <span className="text-xs text-slate-400">🔄 {timetable.generationStats.iterations} iterations</span>
              <span className="text-xs text-slate-400">✅ {timetable.generationStats.sessionsAssigned}/{timetable.generationStats.sessionsRequired} sessions</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToPDF(timetable, viewMode)} className="btn-secondary text-xs">📄 PDF</button>
          <button onClick={() => exportToExcel(timetable)} className="btn-secondary text-xs">📊 Excel</button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        {VIEW_MODES.map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${viewMode === mode ? 'bg-white shadow-sm text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}>
            {mode === 'class' ? '📚 Class' : mode === 'faculty' ? '👩‍🏫 Faculty' : '🏫 Room'}-wise
          </button>
        ))}
      </div>

      {/* Class-wise View */}
      {viewMode === 'class' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="timetable-grid w-full text-sm">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="px-3 py-3 text-left text-xs font-semibold sticky left-0 bg-slate-700 z-10 min-w-[130px]">Time / Day</th>
                  {days.map(day => (
                    <th key={day} className="px-2 py-3 text-center text-xs font-semibold min-w-[140px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot}>
                    <td className="border border-slate-100 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 sticky left-0 z-10 whitespace-nowrap">
                      {slot}
                    </td>
                    {days.map(day => {
                      const cellSlot = getSlot(day, slot);
                      const isBreak = timetable.breakSlots?.includes(slot);
                      return (
                        <SlotCell
                          key={day}
                          slot={cellSlot}
                          isBreak={isBreak}
                          onEdit={() => !isBreak && setEditSlot({ day, timeSlot: slot, slot: cellSlot })}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Faculty-wise View */}
      {viewMode === 'faculty' && (
        <div className="space-y-4">
          {uniqueFaculty.length === 0 ? (
            <div className="card p-8 text-center text-slate-400">No faculty assignments found</div>
          ) : uniqueFaculty.map(fac => {
            const facSlots = getFacultySlots(fac);
            return (
              <div key={fac._id} className="card overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-700">{fac.name?.[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{fac.name}</p>
                    <p className="text-xs text-slate-400">{facSlots.length} sessions assigned</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-700 text-white">
                      <th className="px-3 py-2 text-left">Time</th>
                      {days.map(d => <th key={d} className="px-2 py-2 text-center min-w-[120px]">{d.slice(0,3)}</th>)}
                    </tr></thead>
                    <tbody>
                      {slots.map(slot => (
                        <tr key={slot} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-600 bg-slate-50 whitespace-nowrap">{slot}</td>
                          {days.map(day => {
                            const s = facSlots.find(x => x.day === day && x.timeSlot === slot);
                            const isBreak = timetable.breakSlots?.includes(slot);
                            return (
                              <td key={day} className={`px-2 py-2 text-center border-l border-slate-100 ${isBreak ? 'bg-amber-50' : s ? 'bg-primary-50' : ''}`}>
                                {isBreak ? <span className="text-amber-500">Break</span>
                                  : s ? <div>
                                    <div className="font-medium text-primary-700">{s.subject?.name}</div>
                                    <div className="text-slate-400">{s.classroom?.roomNumber}</div>
                                  </div>
                                  : <span className="text-slate-200">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room-wise View */}
      {viewMode === 'room' && (
        <div className="space-y-4">
          {uniqueRooms.length === 0 ? (
            <div className="card p-8 text-center text-slate-400">No room assignments found</div>
          ) : uniqueRooms.map(room => {
            const roomSlots = getRoomSlots(room);
            return (
              <div key={room._id} className="card overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <span className="text-xl">{room.type === 'lab' ? '🔬' : room.type === 'seminar' ? '📝' : '🏫'}</span>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{room.roomNumber} — {room.building}</p>
                    <p className="text-xs text-slate-400 capitalize">{room.type} • Capacity: {room.capacity} • {roomSlots.length} sessions</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-700 text-white">
                      <th className="px-3 py-2 text-left">Time</th>
                      {days.map(d => <th key={d} className="px-2 py-2 text-center min-w-[120px]">{d.slice(0,3)}</th>)}
                    </tr></thead>
                    <tbody>
                      {slots.map(slot => (
                        <tr key={slot} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-600 bg-slate-50 whitespace-nowrap">{slot}</td>
                          {days.map(day => {
                            const s = roomSlots.find(x => x.day === day && x.timeSlot === slot);
                            const isBreak = timetable.breakSlots?.includes(slot);
                            return (
                              <td key={day} className={`px-2 py-2 text-center border-l border-slate-100 ${isBreak ? 'bg-amber-50' : s ? 'bg-green-50' : ''}`}>
                                {isBreak ? <span className="text-amber-500">Break</span>
                                  : s ? <div>
                                    <div className="font-medium text-green-700">{s.subject?.name}</div>
                                    <div className="text-slate-400">{s.faculty?.name?.split(' ').slice(-1)[0]}</div>
                                  </div>
                                  : <span className="text-slate-200">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 card p-3 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-medium text-slate-500">Legend:</span>
        {subjects.slice(0,8).map(s => (
          <div key={s._id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color || '#3B82F6' }} />
            <span className="text-xs text-slate-600">{s.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-200" />
          <span className="text-xs text-slate-600">Break</span>
        </div>
      </div>

      <EditModal
        show={!!editSlot}
        slot={editSlot?.slot}
        day={editSlot?.day}
        timeSlot={editSlot?.timeSlot}
        subjects={subjects}
        faculty={faculty}
        classrooms={classrooms}
        onSave={handleEditSave}
        onClose={() => setEditSlot(null)}
      />
    </div>
  );
}
