import { footerLinks, profile } from '../data/profile';
import { esc, safeUrl } from '../utils/dom';

const ext = 'target="_blank" rel="noopener noreferrer"';

export function initContact(): void {
  const actions = document.getElementById('contact-actions');
  const elsewhere = document.getElementById('contact-elsewhere');
  const footer = document.getElementById('footer-links');

  if (actions) {
    const email = safeUrl(`mailto:${profile.email}`);
    const phone = safeUrl(`tel:${profile.phone}`);
    const linkedin = safeUrl(profile.linkedin);
    const github = safeUrl(profile.github);

    actions.innerHTML = [
      `<a class="btn btn--primary btn--lg" href="${esc(email)}" aria-label="Send email to ${esc(profile.email)}">
        <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        ${esc(profile.email)} <span class="btn__arrow" aria-hidden="true">→</span>
      </a>`,
      `<a class="btn btn--outline btn--lg" href="${esc(phone)}" aria-label="Call ${esc(profile.phoneDisplay)}">
        <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        ${esc(profile.phoneDisplay)}
      </a>`,
      `<a class="btn btn--light btn--lg" href="${esc(linkedin)}" ${ext} aria-label="LinkedIn profile (opens in a new tab)">
        <svg class="btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.54a1.63 1.63 0 1 0 1.63 1.63 1.63 1.63 0 0 0-1.63-1.63z"/></svg>
        LinkedIn <span class="btn__arrow" aria-hidden="true">↗</span>
      </a>`,
      `<a class="btn btn--light btn--lg" href="${esc(github)}" ${ext} aria-label="GitHub profile (opens in a new tab)">
        <svg class="btn__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub <span class="btn__arrow" aria-hidden="true">↗</span>
      </a>`,
    ].join('');
  }

  if (elsewhere) {
    const freelance = [
      { label: 'Mostaql', url: profile.mostaql },
      { label: 'Khamsat', url: profile.khamsat },
    ];
    elsewhere.innerHTML =
      '<span class="mono">Freelance platforms:</span>' +
      freelance
        .map((l) => `<a class="text-link" href="${esc(safeUrl(l.url))}" ${ext}>${esc(l.label)} <span aria-hidden="true">↗</span></a>`)
        .join('');
  }

  if (footer) {
    footer.innerHTML = footerLinks
      .map((l) => `<li><a href="${esc(safeUrl(l.url))}" ${ext}>${esc(l.label)}</a></li>`)
      .join('');
  }
}
