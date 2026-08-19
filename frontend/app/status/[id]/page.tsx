'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './status.module.css';

interface Application {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'processed';
  skills: string[] | null;
  created_at: string;
}

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Application | null>(null);
  const [error, setError] = useState('');
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!id) return;
    const poll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${id}`);
        if (!res.ok) throw new Error('Application not found');
        const json: Application = await res.json();
        setData(json);
        if (json.status !== 'processed') setTimeout(poll, 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    };
    poll();
  }, [id]);

  useEffect(() => {
    if (data?.status === 'processed') return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(t);
  }, [data?.status]);

  const isPending = !data || data.status === 'pending';

  return (
    <main className={styles.page}>
      <div className={styles.blobPurple} />
      <div className={styles.blobBlue} />

      <div className={styles.card}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          New Application
        </button>

        <h1 className={styles.title}>Application Status</h1>
        <div className={styles.idRow}>
          <span className={styles.idLabel}>ID</span>
          <span className={styles.idValue}>{id}</span>
        </div>

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        {!error && (
          <div className={isPending ? styles.badgePending : styles.badgeDone}>
            {isPending ? (
              <>
                <span className={styles.pulseRing} />
                <span className={styles.pulseDot} />
                <span>Processing{dots}</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Processed
              </>
            )}
          </div>
        )}

        {isPending && !error && (
          <div className={styles.processingCard}>
            <div className={styles.aiIcon}>🤖</div>
            <div>
              <p className={styles.processingTitle}>AI is analyzing your resume</p>
              <p className={styles.processingHint}>Extracting skills and experience — usually takes 2–3 seconds</p>
            </div>
          </div>
        )}

        {data?.status === 'processed' && (
          <div className={styles.fadeUp}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><span>⚡</span> Extracted Skills</h2>
              {data.skills && data.skills.length > 0 ? (
                <div className={styles.skillsWrap}>
                  {data.skills.map((skill) => (
                    <span key={skill} className={styles.skill}>{skill}</span>
                  ))}
                </div>
              ) : (
                <p className={styles.noSkills}>No matching skills detected in the resume text.</p>
              )}
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>👤</span>
                <div><p className={styles.infoLabel}>Name</p><p className={styles.infoValue}>{data.name}</p></div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>✉️</span>
                <div><p className={styles.infoLabel}>Email</p><p className={styles.infoValue}>{data.email}</p></div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>🕐</span>
                <div><p className={styles.infoLabel}>Submitted</p><p className={styles.infoValue}>{new Date(data.created_at).toLocaleString()}</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
