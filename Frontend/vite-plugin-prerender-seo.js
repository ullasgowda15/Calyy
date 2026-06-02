import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://yourcaly.com';
const DEFAULT_OG_IMAGE = 'https://yourcaly.com/YourCalyLogo.png';

const routes = [
  {
    path: '/',
    title: 'YourCaly | Scheduling Platform For Indian Professionals',
    desc: 'Create professional booking pages and schedule meetings easily. Built for Indian professionals.',
  },
  {
    path: '/for-coaches',
    title: 'YourCaly | Scheduling Software for Coaches',
    desc: 'Streamline your coaching sessions with automated scheduling, custom booking pages, and client management tools.',
  },
  {
    path: '/for-consultants',
    title: 'YourCaly | Scheduling Software for Consultants',
    desc: 'Professional scheduling for consultants. Automated booking, calendar sync, and client management tools.',
  },
  {
    path: '/for-freelancers',
    title: 'YourCaly | Scheduling Software for Freelancers',
    desc: 'Streamline client bookings with automated scheduling, calendar sync, and professional booking pages.',
  },
  {
    path: '/calendly-alternative-india',
    title: 'YourCaly | Best Calendly Alternative for India',
    desc: 'Indian-owned scheduling platform with \u20b9 pricing, UPI support, and timezone-ready booking pages. A better Calendly alternative for Indian professionals.',
  },
  {
    path: '/how-it-works',
    title: 'YourCaly | How It Works',
    desc: 'Learn how YourCaly works \u2014 set your availability, create event types, share your booking link, and get booked in minutes.',
  },
  {
    path: '/about',
    title: 'YourCaly | About YourCaly \u2014 Scheduling Platform For Indian Professionals',
    desc: 'YourCaly is a scheduling platform built for Indian professionals. Learn about our mission, values, and roadmap.',
  },
  {
    path: '/privacy',
    title: 'YourCaly | Privacy Policy',
    desc: 'YourCaly privacy policy \u2014 how we collect, use, and protect your personal data.',
  },
  {
    path: '/terms',
    title: 'YourCaly | Terms of Service',
    desc: 'YourCaly terms of service \u2014 the terms governing your use of our scheduling platform.',
  },
  {
    path: '/login',
    title: 'YourCaly | Sign In',
    desc: 'Sign in to YourCaly to manage your bookings, availability, and event types.',
  },
  {
    path: '/register',
    title: 'YourCaly | Create Account',
    desc: 'Create your YourCaly account and start scheduling meetings in minutes. Free trial available.',
  },
  {
    path: '/pricing',
    title: 'YourCaly | Pricing',
    desc: 'Simple, transparent pricing for Indian professionals. Start with a free trial, upgrade when you grow.',
  },
];

function injectMeta(html, route) {
  const canonical = route.path === '/' ? SITE_URL : `${SITE_URL}${route.path}`;
  let r = html;

  r = r.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
  r = r.replace(/<meta name="description"[^>]*\/?>/, `<meta name="description" content="${route.desc}">`);
  r = r.replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${route.title}">`);
  r = r.replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${route.desc}">`);
  r = r.replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${canonical}">`);
  r = r.replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${route.title}">`);
  r = r.replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${route.desc}">`);
  r = r.replace(/<link rel="canonical"[^>]*\/?>/, `<link rel="canonical" href="${canonical}" />`);
  r = r.replace(/<meta property="og:image"[^>]*\/?>/, `<meta property="og:image" content="${DEFAULT_OG_IMAGE}">`);
  r = r.replace(/<meta name="twitter:image"[^>]*\/?>/, `<meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">`);

  return r;
}

function updateVercelJson() {
  const vercelPath = path.resolve(__dirname, 'vercel.json');
  if (!fs.existsSync(vercelPath)) return;

  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
  const prerenderSources = new Set(routes.filter((r) => r.path !== '/').map((r) => r.path));
  const existingNonPrerender = (vercel.rewrites || []).filter(
    (r) => !prerenderSources.has(r.source) && r.source !== '/(.*)'
  );
  const prerenderRewrites = routes
    .filter((r) => r.path !== '/')
    .map((r) => ({
      source: r.path,
      destination: `${r.path}/index.html`,
    }));
  const spaCatchAll = { source: '/(.*)', destination: '/index.html' };

  vercel.rewrites = [...existingNonPrerender, ...prerenderRewrites, spaCatchAll];
  fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n', 'utf-8');
  console.log(`[prerender-seo] Updated vercel.json with ${prerenderRewrites.length} prerender rewrites`);
}

export default function prerenderSeoPlugin() {
  return {
    name: 'vite:prerender-seo',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      const indexPath = path.join(outDir, 'index.html');

      if (!fs.existsSync(indexPath)) {
        console.warn('[prerender-seo] dist/index.html not found, skipping');
        return;
      }

      const indexHtml = fs.readFileSync(indexPath, 'utf-8');

      for (const route of routes) {
        const dirPath = route.path === '/'
          ? outDir
          : path.join(outDir, route.path.slice(1));

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const html = injectMeta(indexHtml, route);
        fs.writeFileSync(path.join(dirPath, 'index.html'), html, 'utf-8');
        console.log(`  [prerender-seo] \u2713 ${route.path}`);
      }

      console.log(`[prerender-seo] Prerendered ${routes.length} routes`);
      updateVercelJson();
    },
  };
}
