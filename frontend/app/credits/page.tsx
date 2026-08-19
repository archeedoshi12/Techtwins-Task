'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './credits.module.css';

interface WebhookResult {
  status: 'ok' | 'duplicate' | 'error';
  message?: string;
  userId?: string;
  amount?: number;
  credits?: number;
}

interface Balance {
  userId: string;
  credits: number;
}

export default function CreditsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    eventId: `evt_${Date.now()}`,
    userId: 'user_1',
    amount: '100',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebhookResult | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchBalance = async (userId: string) => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/credits/${userId}`);
      const data = await res.json();
      setBalance(data);
    } catch {
      // silently fail
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: form.eventId,
          type: 'credit.purchased',
          userId: form.userId,
          amount: Number(form.amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ status: 'error', message: data.error || 'Request failed' });
      } else {
        setResult({ ...data });
        await fetchBalance(form.userId);
      }
    } catch {
      setResult({ status: 'error', message: 'Failed to reach server' });
    } finally {
      setLoading(false);
    }
  };

  const resultClass =
    result?.status === 'ok'
      ? styles.resultOk
      : result?.status === 'duplicate'
      ? styles.resultDuplicate
      : styles.resultError;

  return (
    <main className={styles.page}>
      <div className={styles.blobGreen} />
      <div className={styles.blobPurple} />

      <div className={styles.card}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>💳</div>
          <div>
            <h1 className={styles.title}>Credits Webhook</h1>
          </div>
        </div>
        <p className={styles.subtitle}>
          Simulates a Stripe-style webhook. Sending the same <code>eventId</code> twice will NOT add credits again — idempotency guaranteed.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Event ID</label>
            <input
              className={styles.input}
              value={form.eventId}
              onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              placeholder="evt_001"
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>User ID</label>
              <input
                className={styles.input}
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                placeholder="user_1"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Amount</label>
              <input
                className={styles.input}
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="100"
                required
              />
            </div>
          </div>

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Sending…' : '⚡ Send Webhook'}
          </button>
        </form>

        {result && (
          <div className={`${styles.result} ${resultClass}`}>
            <p className={styles.resultTitle}>
              {result.status === 'ok' && ' Credits Added'}
              {result.status === 'duplicate' && ' Duplicate Event — Credits NOT Added'}
              {result.status === 'error' && 'Error'}
            </p>
            <pre className={styles.resultBody}>
              {JSON.stringify(result, null, 2)}
            </pre>
            {result.status === 'ok' && result.amount && (
              <div className={styles.credits}>
                <span className={styles.creditsLabel}>Credits added:</span>
                <span className={styles.creditsValue}>+{result.amount}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.balanceSection}>
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>💰 Current Balance</span>
            <button
              className={styles.checkBtn}
              type="button"
              onClick={() => fetchBalance(form.userId)}
              disabled={balanceLoading}
            >
              {balanceLoading ? '…' : 'Check'}
            </button>
          </div>
          {balance && (
            <div className={styles.balanceDisplay}>
              <span className={styles.balanceUser}>{balance.userId}</span>
              <span className={styles.balanceCredits}>{balance.credits} credits</span>
            </div>
          )}
        </div>

        <p className={styles.hint}>
          Try sending the same Event ID twice to see idempotency in action.
        </p>
      </div>
    </main>
  );
}
