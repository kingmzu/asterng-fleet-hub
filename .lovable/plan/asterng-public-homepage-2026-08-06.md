# ASTERNG Public Homepage

Turn the company profile into the public landing page. Login/Sign Up become secondary actions in the navbar. The existing dashboard, roles, and auth flow stay exactly as they are.

## Routing

- `/` — new public landing page (no login required). If a signed-in user opens `/`, they are sent straight to their dashboard: staff to `/dashboard`, riders to `/smart-meter`.
- `/dashboard` — the current staff dashboard (moved from `/`). All internal redirects that currently point at `/` are updated.
- `/login`, `/signup` — the existing auth page, unchanged in behaviour. Role selection (Admin, Operational Manager, Rider) stays. `/signup` opens the same page with the sign-up tab active.
- All other app routes (riders, motorcycles, smart meter, etc.) are untouched.

## Homepage sections

1. **Sticky navbar** — logo left; Home / About / Services / Fleet / Team / Contact center (smooth scroll to anchors); Login + Sign Up right. Transparent at top, blurred glass background on scroll, hamburger drawer on mobile.
2. **Hero** — headline "Smart Mobility & Fleet Management for the Future", the given subheadline, "Get Started" and "Login to Dashboard" buttons, animated gradient background, floating glass UI cards and a stylised dashboard mockup, staggered entrance animations.
3. **Who We Are** — the supplied company overview copy, with a supporting visual.
4. **Our Services** — 8 icon cards: Smart Meter System, Fleet Management, Rider Management, Live GPS Tracking, Logistics & Delivery, Transport Operations, Revenue Monitoring, Compliance & KYC. Lift + glow on hover.
5. **Live Platform Preview** — tabbed mock dashboards for Smart Meter, Live GPS Tracking, Fleet Dashboard, Rider Management, KYC. Includes a "Live Operations" panel showing Active Trips, Online Riders, Fleet Status, System Activity (static marketing figures, not live database reads).
6. **Vision & Mission** — two contrasting premium cards with the supplied copy.
7. **Why ASTERNG** — 6 feature cards as specified.
8. **Statistics** — count-up animation on scroll: 10+ Active Riders, 13+ Fleet Vehicles, 500+ Trips Managed, 1 Operational Zone.
9. **Team** — Founder & CEO (Abdullahi Kabir Muazu), Operational Manager (Ali Muhammad Sani), and four marketing cards (Abdulkadir Halilu, Nasir Abdullahi Bardi, Auwal Musa, Abdurrahman Kabir Muazu). Circular initials avatars as placeholders, easy to swap for the photos you send later; social icon placeholders; hover animation.
10. **Contact** — phone (234) 9011331000, asterngofficial@gmail.com, Gombe State, Nigeria, plus a Name / Email / Subject / Message form.
11. **Social** — TikTok, Instagram, X icons linking out in a new tab with hover animation.
12. **Footer** — logo, description, quick links, services, contact, socials, Privacy Policy, Terms & Conditions, copyright.

## Contact form behaviour

- Submissions are validated (zod) and stored in a new `contact_messages` table (name, email, subject, message, timestamp). Anyone can submit; only staff can read them.
- A notification email is sent to asterngofficial@gmail.com for each submission, plus a confirmation to the sender.
- Sending email requires a sender domain you own to be set up first. If none is configured yet, I will show the email setup step; until it is verified, submissions still save safely and the email starts flowing once the domain is live.

## Design

Reuses the existing ASTERNG tokens — orange primary, dark brown surfaces, Space Grotesk headings, Inter body — so the page works in both light and dark mode. Glassmorphism panels, rounded cards, soft shadows, gradient accents, scroll-reveal animations, fully responsive down to small Android screens.

## Technical notes

- New files: `src/pages/Home.tsx` plus section components under `src/components/landing/` (Navbar, Hero, About, Services, PlatformPreview, VisionMission, WhyUs, Stats, Team, Contact, Social, Footer), a `useCountUp` hook, and a `useScrollReveal` hook using IntersectionObserver.
- `src/App.tsx`: `/` becomes public, dashboard moves to `/dashboard`; `ProtectedRoute` and `LoginPage` redirects updated from `/` to `/dashboard`.
- Migration adds `contact_messages` with grants and RLS (public insert, staff select).
- Contact email uses Lovable's built-in email system (no third-party keys).
- `index.html` title/description/OG tags updated for the public marketing page.
