'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface FormState {
  name: string;
  email: string;
  resumeText: string;
}

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ name: '', email: '', resumeText: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={`${styles.blob} ${styles.blobPurple}`} />
      <div className={`${styles.blob} ${styles.blobBlue}`} />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Submit Application</h1>
            <p className={styles.subtitle}>Let our AI parse your resume and extract your skills</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}><span>👤</span> Full Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}><span>✉️</span> Email Address</label>
            <input
              className={styles.input}
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}><span>📝</span> Resume / Bio</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Describe your experience and skills (e.g. React, Python, AWS, Docker)…"
              value={form.resumeText}
              onChange={(e) => setForm({ ...form, resumeText: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button className={styles.btn} type="submit" disabled={loading}>
            <span className={styles.btnInner}>
              {loading ? (
                <><span className={styles.spinner} /> Submitting…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Submit Application
                </>
              )}
            </span>
          </button>
        </form>

        <p className={styles.footer}>Your data is processed securely and never shared.</p>
        <p className={styles.footer} style={{ marginTop: 8 }}>
          <a href="/credits" style={{ color: 'rgba(139,92,246,0.8)', textDecoration: 'none' }}>💳 Test Credits Webhook →</a>
        </p>
      </div>
    </main>
  );
}
