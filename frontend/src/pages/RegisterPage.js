import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', institution: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.institution);
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary-600 rounded-2xl items-center justify-center shadow-lg mb-4">
            <span className="text-3xl">📅</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">SmartTable</h1>
          <p className="text-slate-500 text-sm mt-1">Create your institution account</p>
        </div>
        <div className="card p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 font-display">Create an account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. John Smith' },
              { key: 'institution', label: 'Institution', type: 'text', placeholder: 'Sample University' },
              { key: 'email', label: 'Email address', type: 'email', placeholder: 'admin@college.edu' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type} required value={form[key]} onChange={set(key)}
                  className="input-field" placeholder={placeholder} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
