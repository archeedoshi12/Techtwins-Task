'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function StatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!id) return;
    const poll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${id}`);
        if (!res.ok) throw new Error('Application not found');
        const json = await res.json();
        setData(json);
        if (json.status !== 'processed') setTimeout(poll, 2000);
      } catch (err) {
        setError(err.message);
      }
    };
    poll();
  }, [id]);

  // Animated dots for "processing" state
  useEffect(() => {
    if (data?.status === 'processed') return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(t);
  }, [data?.status]);

  const isPending = !data || data.status === 'pending';

  return (
    <main style={s.page}>
      <div style={{ ...s.blob, top: '-100px', right: '-100px', background: 'rgba(139,92,246,0.3)' }} />
      <div style={{ ...s.blob, bottom: '-80px', left: '-80px', background: 'rgba(59,130,246,0.25)', width: 350, height: 350 }} />

      <div style={s.card} className="fade-up">
        {/* Back button */}
        <button style={s.backBtn} onClick={() => router.push('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          New Application
        </button>

        {/* Title */}
        <h1 style={s.title}>Application Status</h1>
        <p style={s.idText}>
          <span style={s.idLabel}>ID</span>
          <span style={s.idValue}>{id}</span>
        </p>

        {error && (
          <div style={s.errorBox}>⚠️ {error}</div>
        )}

        {/* Status badge */}
        {!error && (
          <div style={isPending ? s.badgePending : s.badgeDone}>
            {isPending ? (
              <>
                <span style={s.pulseRing} />
                <span style={s.pulseDot} />
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

        {/* Processing state */}
        {isPending && !error && (
          <div style={s.processingCard}>
            <div style={s.aiIcon}>🤖</div>
            <div>
              <p style={s.processingTitle}>AI is analyzing your resume</p>
              <p style={s.processingHint}>Extracting skills and experience — usually takes 2–3 seconds</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data?.status === 'processed' && (
          <div className="fade-up">
            {/* Skills */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>
                <span style={s.sectionIcon}>⚡</span> Extracted Skills
              </h2>
              {data.skills?.length > 0 ? (
                <div style={s.skillsWrap}>
                  {data.skills.map((skill) => (
                    <span key={skill} style={s.skill}>{skill}</span>
                  ))}
                </div>
              ) : (
                <p style={s.noSkills}>No matching skills detected in the resume text.</p>
              )}
            </div>

            {/* Applicant info */}
            <div style={s.infoGrid}>
              <InfoRow icon="👤" label="Name" value={data.name} />
              <InfoRow icon="✉️" label="Email" value={data.email} />
              <InfoRow icon="🕐" label="Submitted" value={new Date(data.created_at).toLocaleString()} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoIcon}>{icon}</span>
      <div>
        <p style={s.infoLabel}>{label}</p>
        <p style={s.infoValue}>{value}</p>
      </div>
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
    width: 450,
    height: 450,
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
    padding: '36px 44px',
    width: '100%',
    maxWidth: 540,
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '6px 12px',
    marginBottom: 24,
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  title: { fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 },
  idText: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  idLabel: {
    fontSize: 11,
    fontWeight: 700,
    background: 'rgba(139,92,246,0.3)',
    color: '#c4b5fd',
    padding: '2px 8px',
    borderRadius: 6,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  idValue: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', wordBreak: 'break-all' },
  badgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    background: 'rgba(251,191,36,0.15)',
    border: '1px solid rgba(251,191,36,0.35)',
    color: '#fde68a',
    borderRadius: 50,
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 24,
  },
  badgeDone: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(52,211,153,0.15)',
    border: '1px solid rgba(52,211,153,0.35)',
    color: '#6ee7b7',
    borderRadius: 50,
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    left: 16,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'rgba(251,191,36,0.5)',
    animation: 'pulse-ring 1.4s ease-out infinite',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#fbbf24',
    flexShrink: 0,
  },
  processingCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 8,
  },
  aiIcon: { fontSize: 32, lineHeight: 1 },
  processingTitle: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 },
  processingHint: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: { fontSize: 16 },
  skillsWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skill: {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
    border: '1px solid rgba(139,92,246,0.4)',
    color: '#c4b5fd',
    padding: '6px 14px',
    borderRadius: 50,
    fontSize: 13,
    fontWeight: 600,
  },
  noSkills: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 },
  infoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
  infoValue: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  errorBox: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 13,
    color: '#fca5a5',
    marginBottom: 16,
  },
};
