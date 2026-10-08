import type { Project } from '../types/project';

/**
 * Featured, deployed projects — primary proof of work.
 * Exactly in the specified order:
 * 01 — Nana Perfume (Shopify client project, live link only, no GitHub button)
 * 02 — SafeKeys
 * 03 — Fit Coach
 * 04 — Books Box
 * 05 — Angular E-Commerce
 * 06 — Weather Application
 * 07 — Bookmarker
 */
export const projects: Project[] = [
  {
    id: 1,
    title: 'Nana Perfume',
    category: 'E-commerce / Shopify',
    description:
      'A luxury fragrance e-commerce storefront built on Shopify, offering smooth product browsing, responsive catalog presentation, and a streamlined shopping experience.',
    technologies: ['Shopify', 'Liquid', 'HTML5', 'CSS3', 'JavaScript'],
    liveUrl: 'https://nanaperfume.com/',
    githubUrl: '',
    preview: 'perfume',
    featured: true,
  },
  {
    id: 2,
    title: 'SafeKeys',
    category: 'Web Application',
    description:
      'A web-based utility focused on generating and managing secure, password-style credentials through a clean interactive interface.',
    technologies: ['React', 'TypeScript', 'React Router', 'Framer Motion', 'Tailwind CSS'],
    liveUrl: 'https://safe-keys.vercel.app/',
    githubUrl: 'https://github.com/IbrahimS369/safe-keys',
    preview: 'keys',
    featured: true,
  },
  {
    id: 3,
    title: 'Fit Coach',
    category: 'Frontend Development',
    description:
      'A modern fitness-focused web experience designed around presenting training and fitness content through a clean, responsive interface.',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    liveUrl: 'https://fit-coach-eta.vercel.app/',
    githubUrl: 'https://github.com/IbrahimS369/fitCoach',
    preview: 'fitness',
    featured: true,
  },
  {
    id: 4,
    title: 'Books Box',
    category: 'E-commerce Frontend',
    description:
      'An e-commerce-style bookstore interface featuring book discovery, search, authentication UI, cart interactions, and responsive product presentation.',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    liveUrl: 'https://books-box.vercel.app/',
    githubUrl: 'https://github.com/IbrahimS369/Books-Box',
    preview: 'books',
    featured: true,
  },
  {
    id: 5,
    title: 'Angular E-Commerce',
    category: 'Angular Application',
    description:
      'An Angular-based e-commerce application demonstrating component-based architecture, dynamic product interfaces, and modern frontend development patterns.',
    technologies: ['Angular', 'TypeScript', 'RxJS', 'Tailwind CSS', 'HTML'],
    liveUrl: 'https://angular-ecommerce-gold.vercel.app/',
    githubUrl: 'https://github.com/IbrahimS369/Angular-Ecommerce',
    preview: 'store',
    featured: true,
  },
  {
    id: 6,
    title: 'Weather Application',
    category: 'API Integration',
    description:
      'A responsive weather application that allows users to search for a location and retrieve live weather information through a weather API.',
    technologies: ['HTML', 'CSS', 'JavaScript', 'REST API', 'Fetch API'],
    liveUrl: 'https://weather-kappa-ivory.vercel.app/',
    githubUrl: 'https://github.com/IbrahimS369/Weather',
    preview: 'weather',
    featured: true,
  },
  {
    id: 7,
    title: 'Bookmarker',
    category: 'JavaScript Application',
    description:
      'A bookmark management application for saving and organizing favorite websites, with client-side validation and interactive CRUD functionality.',
    technologies: ['HTML', 'CSS', 'JavaScript', 'LocalStorage'],
    liveUrl: 'https://bookmarker-alpha-ten.vercel.app/',
    githubUrl: 'https://github.com/IbrahimS369/BookMarker',
    preview: 'bookmarks',
    featured: true,
  },
];
