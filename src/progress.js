// Per-stage results saved in the browser: stars, best score, best time, coins, secrets.
// Read by the Stage Clear card (src/levelClear.js) and the Victory screen.
const STORAGE_KEY = 'nokor-adventure-progress';

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return saved && typeof saved.levels === 'object' && saved.levels ? saved : { levels: {} };
  } catch {
    return { levels: {} };
  }
}

const progress = read();

function write() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Storage may be unavailable. */ }
}

export function levelRecord(level) {
  return progress.levels[level] || null;
}

// 1 star = cleared, 2 = at least 80% of the coins, 3 = every coin and every secret.
export function starsFor({ coins, coinTotal, secrets, secretTotal }) {
  const ratio = coinTotal > 0 ? coins / coinTotal : 1;
  if (ratio >= 1 && secrets >= secretTotal) return 3;
  if (ratio >= 0.8) return 2;
  return 1;
}

// Save one finished run. Returns what changed so the card can show "NEW BEST!".
export function saveLevelResult(level, result) {
  const previous = levelRecord(level);
  const record = previous ? { ...previous } : {};
  const newBestScore = !!previous && result.score > (previous.bestScore ?? -Infinity);
  const newBestTime = !!previous && result.seconds < (previous.bestTime ?? Infinity);
  record.stars = Math.max(previous?.stars || 0, result.stars);
  record.bestScore = Math.max(previous?.bestScore ?? 0, result.score);
  record.bestTime = Math.min(previous?.bestTime ?? Infinity, result.seconds);
  record.bestCoins = Math.max(previous?.bestCoins ?? 0, result.coins);
  record.coinTotal = result.coinTotal;
  record.secretTotal = result.secretTotal;
  record.secretsFound = Math.max(previous?.secretsFound ?? 0, result.secrets);
  record.clears = (previous?.clears || 0) + 1;
  progress.levels[level] = record;
  write();
  return { record, previous, firstClear: !previous, newBestScore, newBestTime };
}

// Totals for the Victory screen, across every stage cleared at least once.
export function journeyTotals(totalLevels) {
  const totals = { cleared: 0, stars: 0, coins: 0, coinTotal: 0, secrets: 0, secretTotal: 0, seconds: 0 };
  for (let level = 1; level <= totalLevels; level++) {
    const record = levelRecord(level);
    if (!record) continue;
    totals.cleared++;
    totals.stars += record.stars || 0;
    totals.coins += record.bestCoins || 0;
    totals.coinTotal += record.coinTotal || 0;
    totals.secrets += record.secretsFound || 0;
    totals.secretTotal += record.secretTotal || 0;
    totals.seconds += Number.isFinite(record.bestTime) ? record.bestTime : 0;
  }
  return totals;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
