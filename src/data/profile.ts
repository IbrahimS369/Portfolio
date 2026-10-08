/**
 * Professional profiles and contact details.
 * All links verified and clickable.
 */
export const profile = {
  name: 'Ibrahim Saleh',
  role: 'Frontend Developer | Angular | ASP.NET Core',
  phone: '+201025232525',
  phoneDisplay: '+20 102 523 2525',
  email: 'ibrahim.saleh366@gmail.com',
  githubUser: 'IbrahimS369',
  github: 'https://github.com/IbrahimS369',
  githubRepos: 'https://github.com/IbrahimS369?tab=repositories',
  linkedin: 'https://www.linkedin.com/in/ibrahim-salehh',
  mostaql: 'https://mostaql.com/u/IbrahimS369',
  khamsat: 'https://khamsat.com/user/ibrahims369',
} as const;

export interface SocialLink {
  label: string;
  url: string;
}

export const footerLinks: SocialLink[] = [
  { label: 'GitHub', url: profile.github },
  { label: 'LinkedIn', url: profile.linkedin },
  { label: 'Mostaql', url: profile.mostaql },
  { label: 'Khamsat', url: profile.khamsat },
];
