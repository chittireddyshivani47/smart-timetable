import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SLOTS = [
  '8:00 AM - 8:55 AM', '9:00 AM - 9:55 AM', '10:00 AM - 10:55 AM',
  '11:00 AM - 11:55 AM', '12:00 PM - 12:55 PM', '1:00 PM - 1:55 PM',
  '2:00 PM - 2:55 PM', '3:00 PM - 3:55 PM'
];

export default function GeneratePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [config, setConfig] = useState({
    name: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    semester: 'Odd Semester',
    department: '',
    className: 'Class A',
    subjectIds: [],
    facultyIds: [],
    classroomIds: [],
    workingDays: [...DEFAULT_DAYS],
    timeSlots: [...DEFAULT_SLOTS],
    breakSlots: ['12:00 PM - 12:55 PM'],
    priorityMorning: true
  });

  useEffect(() => {
    async function load() {
      try {
        const [s, f, c] = await Promise.all([API.get('/subjects'), API.get('/faculty'), API.get('/classrooms')]);
        setSubjects(s.data.data);
        setFaculty(f.data.data);
        setClassrooms(c.data.data);
        // Auto-select all
        setConfig(p => ({
          ...p,
          subjectIds: s.data.data.map(x => x._id),
          facultyIds: f.data.data.map(x => x._id),
          classroomIds: c.data.data.map(x => x._id),
        }));
      } catch { toast.error('Failed to load data'); }
      setLoading(false);
    }
    load();
  }, []);

  const toggleItem = (key, id) => setConfig(p => ({
    ...p,
    [key]: p[key].includes(id) ? p[key].filter(x => x !== id) : [...p[key], id]
  }));

  const toggleDay = (day) => setConfig(p => ({
    ...p,
    workingDays: p.workingDays.includes(day) ? p.workingDays.filter(d => d !== day) : [...p.workingDays, day]
  }));

  const toggleBreak = (slot) => setConfig(p => ({
    ...p,
    breakSlots: p.breakSlots.includes(slot) ? p.breakSlots.filter(s => s !== slot) : [...p.breakSlots, slot]
  }));

  const handleGenerate = async () => {
    if (!config.name.trim()) { toast.error('Please enter a timetable name'); setStep(1); return; }
    if (config.subjectIds.length === 0) { toast.error('Select at least one subject'); setStep(2); return; }
    if (config.classroomIds.length === 0) { toast.error('Select at least one classroom'); setStep(3); return; }

    setGenerating(true);
    try {
      const { data } = await API.post('/timetables/generate', config);
      toast.success(`Timetable generated! ${data.stats?.conflicts || 0} conflicts resolved.`);
      navigate(`/timetables/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
    setGenerating(false);
  };

  const steps = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Subjects' },
    { n: 3, label: 'Faculty & Rooms' },
    { n: 4, label: 'Schedule' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 font-display">Generate Timetable</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure and auto-generate your optimized schedule</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <button onClick={() => setStep(s.n)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${step === s.n ? 'bg-primary-600 text-white' : step > s.n ? 'text-primary-600 hover:bg-primary-50' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold border ${step === s.n ? 'bg-white text-primary-600 border-white' : step > s.n ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-300 text-slate-400'}`}>
                {step > s.n ? '✓' : s.n}
              </span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-primary-600' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6 animate-slide-up">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900 font-display mb-4">Basic Information</h2>
            <div>
              <label className="label">Timetable Name *</label>
              <input value={config.name} onChange={e => setConfig(p => ({ ...p, name: e.target.value }))}
                className="input-field" placeholder="e.g. CSE First Year - 2024" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Academic Year</label>
                <input value={config.academicYear} onChange={e => setConfig(p => ({ ...p, academicYear: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Semester</label>
                <select value={config.semester} onChange={e => setConfig(p => ({ ...p, semester: e.target.value }))} className="input-field">
                  {['Odd Semester', 'Even Semester', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Department</label>
                <input value={config.department} onChange={e => setConfig(p => ({ ...p, department: e.target.value }))} className="input-field" placeholder="Computer Science" />
              </div>
              <div>
                <label className="label">Class Name</label>
                <input value={config.className} onChange={e => setConfig(p => ({ ...p, className: e.target.value }))} className="input-field" placeholder="CSE-A" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={config.priorityMorning} onChange={e => setConfig(p => ({ ...p, priorityMorning: e.target.checked }))} />
              <span className="text-sm text-slate-700">Schedule priority subjects in morning slots</span>
            </label>
          </div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 font-display">Select Subjects</h2>
              <div className="flex gap-2">
                <button onClick={() => setConfig(p => ({ ...p, subjectIds: subjects.map(s => s._id) }))} className="text-xs text-primary-600 hover:underline">Select All</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setConfig(p => ({ ...p, subjectIds: [] }))} className="text-xs text-slate-400 hover:underline">Clear</button>
              </div>
            </div>
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No subjects found. <a href="/subjects" className="text-primary-600 underline">Add subjects first</a></div>
            ) : (
              <div className="space-y-2">
                {subjects.map(s => {
                  const selected = config.subjectIds.includes(s._id);
                  return (
                    <div key={s._id} onClick={() => toggleItem('subjectIds', s._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#3B82F6' }} />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-900">{s.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{s.code}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s.hoursPerWeek}h/wk</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">{s.type}</span>
                        {s.isPriority && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">★</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">{config.subjectIds.length} of {subjects.length} selected • Total: {subjects.filter(s => config.subjectIds.includes(s._id)).reduce((a,s) => a + s.hoursPerWeek, 0)} hrs/week</p>
          </div>
        )}

        {/* Step 3: Faculty & Rooms */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900 font-display">Faculty</h2>
                <button onClick={() => setConfig(p => ({ ...p, facultyIds: faculty.map(f => f._id) }))} className="text-xs text-primary-600 hover:underline">Select All</button>
              </div>
              {faculty.length === 0 ? (
                <p className="text-sm text-slate-400">No faculty found. <a href="/faculty" className="text-primary-600 underline">Add faculty first</a></p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {faculty.map(f => {
                    const selected = config.facultyIds.includes(f._id);
                    return (
                      <div key={f._id} onClick={() => toggleItem('facultyIds', f._id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${selected ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>
                          {selected && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{f.name}</p>
                          <p className="text-xs text-slate-400 truncate">{f.subjects?.map(s => s.code).join(', ')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900 font-display">Classrooms</h2>
                <button onClick={() => setConfig(p => ({ ...p, classroomIds: classrooms.map(c => c._id) }))} className="text-xs text-primary-600 hover:underline">Select All</button>
              </div>
              {classrooms.length === 0 ? (
                <p className="text-sm text-slate-400">No classrooms found. <a href="/classrooms" className="text-primary-600 underline">Add classrooms first</a></p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {classrooms.map(c => {
                    const selected = config.classroomIds.includes(c._id);
                    return (
                      <div key={c._id} onClick={() => toggleItem('classroomIds', c._id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${selected ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>
                          {selected && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">{c.roomNumber}</p>
                          <p className="text-xs text-slate-400 capitalize">{c.type} • {c.capacity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Schedule Config */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-slate-900 font-display">Schedule Configuration</h2>
            <div>
              <label className="label mb-2">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${config.workingDays.includes(day) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    {day.slice(0,3)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label mb-2">Time Slots & Breaks</label>
              <p className="text-xs text-slate-400 mb-2">Check slots to mark as lunch break</p>
              <div className="space-y-1.5">
                {DEFAULT_SLOTS.map(slot => {
                  const isBreak = config.breakSlots.includes(slot);
                  return (
                    <div key={slot} onClick={() => toggleBreak(slot)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${isBreak ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <span className="text-sm text-slate-700">{slot}</span>
                      {isBreak && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">🍽 Break</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Generation Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>📚 Subjects: <strong>{config.subjectIds.length}</strong></div>
                <div>👩‍🏫 Faculty: <strong>{config.facultyIds.length}</strong></div>
                <div>🏫 Rooms: <strong>{config.classroomIds.length}</strong></div>
                <div>📅 Days: <strong>{config.workingDays.length}</strong></div>
                <div>⏰ Slots: <strong>{DEFAULT_SLOTS.length - config.breakSlots.length}</strong>/day</div>
                <div>☕ Breaks: <strong>{config.breakSlots.length}</strong>/day</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="btn-secondary disabled:opacity-40">← Previous</button>
          {step < 4 ? (
            <button onClick={() => setStep(s => Math.min(4, s + 1))} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary px-6">
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : '⚡ Generate Timetable'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
