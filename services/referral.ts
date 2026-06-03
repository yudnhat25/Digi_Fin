/**
 * Referral attribution.
 *
 * Flow: a referrer shares ${origin}/?ref=CODE → the invitee lands on the app,
 * the code is captured to localStorage → when the invitee SIGNS UP (not on mere
 * click), the referrer is credited exactly once.
 *
 * Why credit on signup and not on click: a click-based reward is trivially
 * gamed (open the link in a loop = infinite points). Crediting only when a new
 * Firebase account is created — plus a self-referral guard — makes each reward
 * correspond to a real new user.
 *
 * Note: attribution runs client-side, so it depends on the Realtime DB rules
 * allowing the write to the referrer's counters. It's correct for this demo;
 * a production system would do the credit in a trusted backend / Cloud Function.
 */
import { db } from '../firebaseConfig';
import { ref, get, set, runTransaction } from 'firebase/database';

const PENDING_KEY = 'coinwise_pending_ref';

/** Simulated reward added to the referrer per successful referred signup. */
export const REFERRAL_SIGNUP_REWARD_USD = 5;

/** Stable, human-readable referral code derived from the Firebase uid. */
export function referralCodeForUid(uid: string): string {
  return `CW-${uid.slice(0, 8).toUpperCase()}`;
}

/** Shareable signup link for a referral code, on the real app origin. */
export function referralLink(code: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://coinwise.app';
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}

/** Read ?ref=CODE from the URL once at startup, remember it, and clean the URL. */
export function captureReferralFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    if (!code) return;
    localStorage.setItem(PENDING_KEY, code.trim());
    params.delete('ref');
    const qs = params.toString();
    const clean = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.replaceState({}, '', clean);
  } catch { /* ignore */ }
}

export function getPendingReferral(): string | null {
  try { return localStorage.getItem(PENDING_KEY); } catch { return null; }
}

export function clearPendingReferral(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

/** Publish a user's code → uid mapping so referred signups can find them. */
export async function registerReferralCode(uid: string, code: string): Promise<void> {
  try { await set(ref(db, `referralCodes/${code}`), uid); } catch { /* best-effort */ }
}

/** One referred signup, as shown in the referrer's "Recent Referrals" list. */
export interface ReferralRecord {
  uid: string;
  name: string;
  joinedAt: number;
  rewardUsd: number;
}

/**
 * Credit the referrer for a successful NEW signup.
 *  - credits only on registration (never on click)
 *  - ignores unknown codes and self-referral
 *  - one new account credits its referrer exactly once
 *  - records the referred user under referrals/{referrerUid} for the list
 * Returns the referrer uid if credited, else null.
 */
export async function creditReferrer(
  code: string | null,
  newUid: string,
  info?: { name?: string },
): Promise<string | null> {
  if (!code) return null;
  try {
    const snap = await get(ref(db, `referralCodes/${code}`));
    if (!snap.exists()) return null;
    const referrerUid = snap.val() as string;
    if (!referrerUid || referrerUid === newUid) return null; // no self-referral
    await runTransaction(ref(db, `users/${referrerUid}/referralCount`), (n) => (Number(n) || 0) + 1);
    await runTransaction(ref(db, `users/${referrerUid}/referralEarnings`),
      (n) => Number(((Number(n) || 0) + REFERRAL_SIGNUP_REWARD_USD).toFixed(2)));
    await set(ref(db, `referrals/${referrerUid}/${newUid}`), {
      name: info?.name || 'New user',
      joinedAt: Date.now(),
      rewardUsd: REFERRAL_SIGNUP_REWARD_USD,
    });
    return referrerUid;
  } catch {
    return null;
  }
}

/** Real list of people who signed up via this user's code, newest first. */
export async function getReferralList(referrerUid: string): Promise<ReferralRecord[]> {
  try {
    const snap = await get(ref(db, `referrals/${referrerUid}`));
    if (!snap.exists()) return [];
    const val = snap.val() as Record<string, { name?: string; joinedAt?: number; rewardUsd?: number }>;
    return Object.entries(val)
      .map(([uid, r]) => ({
        uid,
        name: r?.name || 'New user',
        joinedAt: Number(r?.joinedAt) || 0,
        rewardUsd: Number(r?.rewardUsd) || 0,
      }))
      .sort((a, b) => b.joinedAt - a.joinedAt);
  } catch {
    return [];
  }
}
