import type { GitHubRepo } from '../types/project';

const CACHE_KEY = 'gh-repos-v1';
const CACHE_TTL = 1000 * 60 * 30; // 30 min — keeps us well under the 60 req/h unauthenticated limit

interface CacheEntry {
  at: number;
  data: GitHubRepo[];
}

function readCache(): GitHubRepo[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return Date.now() - entry.at < CACHE_TTL ? entry.data : null;
  } catch {
    return null;
  }
}

function writeCache(data: GitHubRepo[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data } satisfies CacheEntry));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

/** Fetch public, non-fork repositories sorted by most recently updated. */
export async function fetchRepos(user: string, timeoutMs = 9000): Promise<GitHubRepo[]> {
  const cached = readCache();
  if (cached) return cached;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      const reason = res.status === 403 ? 'GitHub API rate limit reached' : `GitHub responded with ${res.status}`;
      throw new Error(reason);
    }
    const all = (await res.json()) as GitHubRepo[];
    const repos = all
      .filter((r) => !r.fork)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    writeCache(repos);
    return repos;
  } finally {
    window.clearTimeout(timer);
  }
}

