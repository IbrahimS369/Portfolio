/** Visual style of the CSS-only illustrative preview shown when no screenshot exists. */
export type PreviewKind = 'perfume' | 'weather' | 'fitness' | 'keys' | 'bookmarks' | 'books' | 'store';

export interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  technologies: string[];
  liveUrl: string;
  /** Leave empty ("") when the repository URL is unknown — the Source Code button is then hidden. */
  githubUrl?: string;
  /** Optional real screenshot path, e.g. "/projects/weather.webp" (placed in /public/projects). */
  image?: string;
  preview: PreviewKind;
  featured: boolean;
}

/** Subset of the GitHub REST "repository" object that the portfolio uses. */
export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  updated_at: string;
  fork: boolean;
  homepage: string | null;
}

