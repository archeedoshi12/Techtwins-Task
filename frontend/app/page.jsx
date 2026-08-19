'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', resumeText: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      router.push(`/status/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={s.page}>
      {/* Background blobs */}
      <div style={{ ...s.blob, top: '-120px', left: '-120px', background: 'rgba(139,92,246,0.35)' }} />
      <div style={{ ...s.blob, bottom: '-100px', right: '-80px', background: 'rgba(59,130,246,0.3)', width: 400, height: 400 }} />

      <div style={s.card} className="fade-up">
        {/* Header */}
        <div style={s.header}>
          <div style={s.iconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <h1 style={s.title}>Submit Application</h1>
            <p style={s.subtitle}>Let our AI parse your resume and extract your skills</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <Field label="Full Name" icon="👤">
            <input
              style={s.input}
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>

          <Field label="Email Address" icon="✉️">
            <input
              style={s.input}
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>

          <Field label="Resume / Bio" icon="📝">
            <textarea
              style={{ ...s.input, height: 150, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Describe your experience and skills (e.g. React, Python, AWS, Docker)…"
              value={form.resumeText}
              onChange={(e) => setForm({ ...form, resumeText: e.target.value })}
              required
            />
          </Field>

          {error && (
            <div style={s.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }} type="submit" disabled={loading}>
            {loading ? (
              <span style={s.btnInner}>
                <span style={s.spinner} /> Submitting…
              </span>
            ) : (
              <span style={s.btnInner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Submit Application
              </span>
            )}
          </button>
        </form>

        <p style={s.footer}>Your data is processed securely and never shared.</p>
      </div>
    </main>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>
        <span style={{ marginRight: 6 }}>{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: '40px 44px',
    width: '100%',
    maxWidth: 500,
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 8px 20px rgba(139,92,246,0.4)',
  },
  title: { fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  label: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center' },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  btn: {
    marginTop: 8,
    padding: '14px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(139,92,246,0.45)',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  btnDisabled: { opacity: 0.65, cursor: 'not-allowed' },
  btnInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 24,
  },
};
