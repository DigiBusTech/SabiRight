import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StatutoryCard {
  statute: string;
  section: string;
  title: string;
  summary: string;
  whatToSay: string;
}

export const OFFLINE_LEGAL_MOAT: StatutoryCard[] = [
  {
    statute: '1999 Constitution of Nigeria',
    section: 'Section 37',
    title: 'Right to Privacy (Phone Search Protection)',
    summary: 'The privacy of citizens, their homes, correspondence, telephone conversations, and telegraphic communications is hereby guaranteed and protected.',
    whatToSay: '"Officer, respectfully, under Section 37 of the 1999 Constitution, my phone is my private property. Do you have a search warrant or formal reason to inspect my device?"'
  },
  {
    statute: 'Police Act 2020',
    section: 'Section 38 & 35',
    title: 'Arrest Procedure & Right to Remain Silent',
    summary: 'No person shall be arrested merely on a civil wrong. An officer must inform the arrested person immediately of the cause of arrest and their right to remain silent.',
    whatToSay: '"Officer, am I under arrest or free to go? If I am under arrest, please inform me of the specific statutory offense, as guaranteed under the Police Act 2020."'
  },
  {
    statute: 'Police Act 2020 & ACJA 2015',
    section: 'Section 66',
    title: 'Right to Free Bail',
    summary: 'Police bail is legally free. Demanding or receiving money ("bail fee" or "roger") for administrative release constitutes extortion and misconduct under the law.',
    whatToSay: '"Bail is free under Section 66 of the Police Act 2020 and the Administration of Criminal Justice Act. Requesting bail money is prohibited."'
  },
  {
    statute: '1999 Constitution of Nigeria',
    section: 'Section 34',
    title: 'Right to Dignity of Human Person',
    summary: 'Every individual is entitled to respect for the dignity of his person. No citizen shall be subjected to torture, cruel, or inhuman treatment.',
    whatToSay: '"I am cooperating with you peacefully. Please maintain professional conduct as required under Section 34 of our Constitution."'
  }
];

export const DE_ESCALATION_SCRIPTS: Record<string, string[]> = {
  English: [
    "1. Stay calm. Keep both hands visible on the steering wheel or at your sides.",
    "2. Do not argue aggressively. Speak in a respectful, firm, and polite tone.",
    "3. State your rights clearly without insulting the officer's authority.",
    "4. Ask for their identification number or unit if they request unauthorized items.",
    "5. Note down badge numbers, patrol vehicle registration, and exact checkpoint location."
  ],
  "Nigerian Pidgin": [
    "1. Calm down. Put your two hands where the officer go see am clearly.",
    "2. No shout, no drag with officer. Talk with respect but stand on your right.",
    "3. Tell officer say Section 37 of Constitution no allow phone search without warrant.",
    "4. Remember say Police Bail na FREE. No give bribe or roger.",
    "5. Check their vehicle plate number, their name tag, and time of stop."
  ]
};

const CACHE_KEY_LEGAL = 'sabiright_offline_legal_moat';

export async function getOfflineLegalCards(): Promise<StatutoryCard[]> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY_LEGAL);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  return OFFLINE_LEGAL_MOAT;
}

export async function saveOfflineLegalCards(cards: StatutoryCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY_LEGAL, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to cache legal cards offline:', e);
  }
}

/**
 * Fetches the latest admin-curated MOAT data from the server and caches it locally
 * for resilient offline rights defense.
 */
export async function syncRemoteMoatData(apiBaseUrl = 'http://localhost:5000'): Promise<StatutoryCard[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/moat/public`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remoteData = await res.json();
    if (Array.isArray(remoteData) && remoteData.length > 0) {
      const mapped: StatutoryCard[] = remoteData.map((item: any) => ({
        statute: item.category || 'Nigerian Law',
        section: item.title || 'Statute Provision',
        title: item.title,
        summary: item.content,
        whatToSay: item.metadata?.whatToSay || `Under ${item.title}, my rights are protected by law.`
      }));

      // Combine with core constitutional cards if not present
      const combined = [...mapped, ...OFFLINE_LEGAL_MOAT.filter(base => !mapped.some(m => m.title === base.title))];
      await saveOfflineLegalCards(combined);
      return combined;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Remote MOAT sync skipped:', err);
  }
  return getOfflineLegalCards();
}

// ============================================================================
// OFFLINE CREDITS & ASYNC DEDUCTION SYNC ENGINE
// ============================================================================

export const OFFLINE_GUEST_SESSION_MAX_CREDITS = 10;
const KEY_GUEST_OFFLINE_CREDITS = 'sabiright_guest_offline_credits_used';
const KEY_CACHED_USER_CREDITS_PREFIX = 'sabiright_user_cached_credits_';
const KEY_PENDING_DEDUCTIONS_PREFIX = 'sabiright_pending_offline_deductions_';

/**
 * Returns how many free session credits the unauthenticated/guest user has remaining (out of 10).
 */
export async function getGuestOfflineCreditsRemaining(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEY_GUEST_OFFLINE_CREDITS);
    const used = val ? parseInt(val, 10) : 0;
    return Math.max(0, OFFLINE_GUEST_SESSION_MAX_CREDITS - used);
  } catch {
    return OFFLINE_GUEST_SESSION_MAX_CREDITS;
  }
}

/**
 * Consumes 1 credit from the guest session budget. Returns the new remaining balance.
 */
export async function consumeGuestOfflineCredit(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEY_GUEST_OFFLINE_CREDITS);
    const used = (val ? parseInt(val, 10) : 0) + 1;
    await AsyncStorage.setItem(KEY_GUEST_OFFLINE_CREDITS, String(used));
    return Math.max(0, OFFLINE_GUEST_SESSION_MAX_CREDITS - used);
  } catch {
    return 0;
  }
}

/**
 * Resets the guest session credit budget (e.g., when a user logs out to start a new session).
 */
export async function resetGuestOfflineSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_GUEST_OFFLINE_CREDITS);
  } catch {}
}

/**
 * Caches the logged-in user's available credit balance locally for offline use.
 */
export async function cacheUserCreditsOffline(userId: string, credits: number): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEY_CACHED_USER_CREDITS_PREFIX}${userId}`, String(credits));
  } catch {}
}

/**
 * Retrieves the logged-in user's cached available credit balance.
 */
export async function getCachedUserCreditsOffline(userId: string): Promise<number | null> {
  try {
    const val = await AsyncStorage.getItem(`${KEY_CACHED_USER_CREDITS_PREFIX}${userId}`);
    return val !== null ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Decrements local cached credits and records a pending offline deduction for the logged-in user.
 */
export async function recordOfflineCreditDeduction(userId: string, amount = 1): Promise<number> {
  try {
    const currentCached = await getCachedUserCreditsOffline(userId);
    const newBal = Math.max(0, (currentCached ?? 10) - amount);
    await cacheUserCreditsOffline(userId, newBal);

    const pendingVal = await AsyncStorage.getItem(`${KEY_PENDING_DEDUCTIONS_PREFIX}${userId}`);
    const pendingCount = (pendingVal ? parseInt(pendingVal, 10) : 0) + amount;
    await AsyncStorage.setItem(`${KEY_PENDING_DEDUCTIONS_PREFIX}${userId}`, String(pendingCount));

    return newBal;
  } catch {
    return 0;
  }
}

/**
 * Syncs any pending offline deductions to the server when connection is restored.
 */
export async function syncOfflineDeductionsToServer(apiBaseUrl: string, token: string, userId: string): Promise<boolean> {
  try {
    const pendingVal = await AsyncStorage.getItem(`${KEY_PENDING_DEDUCTIONS_PREFIX}${userId}`);
    const pendingCount = pendingVal ? parseInt(pendingVal, 10) : 0;
    if (pendingCount <= 0) return true;

    const res = await fetch(`${apiBaseUrl}/api/credits/sync-offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ deductions: pendingCount })
    });

    if (res.ok) {
      const data = await res.json();
      await AsyncStorage.removeItem(`${KEY_PENDING_DEDUCTIONS_PREFIX}${userId}`);
      if (data.balance !== undefined) {
        await cacheUserCreditsOffline(userId, Number(data.balance));
      }
      return true;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Pending offline deductions sync deferred:', err);
  }
  return false;
}

