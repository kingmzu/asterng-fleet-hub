# Team Section: Six Leadership Cards with Photos

Replace the current four initial-based team cards on the homepage with six photo cards using the uploaded portraits.

## Team lineup (in order)

1. Abdullahi Kabir Muazu — Founder & Chief Executive Officer (photo 1: white shirt, blue striped tie)
2. Aliyu Muhammad Sani — Operational Manager (photo 2: warm orange backdrop portrait)
3. Abdulkadir Halilu — Business Development & Human Resources Officer (photo 3: dark pinstripe suit)
4. Nasir Abdullahi Bardi — Sales & Customer Success Officer (photo 4: teal blazer, seated)
5. Auwal Musa — Marketing & Communications Officer (photo 5: patterned cap, white kaftan)
6. Abdurrahman Kabir Muazu — Community Engagement Officer (photo 6: colourful cap, light green kaftan)

## Card design

- Circular profile image, face-centred crop, ring in the brand gold/orange accent
- Name in display font, position beneath in small uppercase tracking
- Social icon placeholders (LinkedIn, X, Mail) — non-linked, styled as subtle circular buttons
- Hover animation: card lifts with elevated shadow, image ring intensifies and photo scales slightly, social icons fade to full opacity
- Grid: 1 column mobile, 2 columns tablet, 3 columns desktop (6 cards fill two clean rows)
- Staggered scroll-reveal retained for each card

## Technical notes

- Upload the six portraits through the CDN asset pipeline and reference their pointer files; no binaries added to the repo
- Update the `team` array and card markup in `src/components/landing/TeamSection.tsx`
- Use existing semantic tokens (`--gradient-gold`, `--shadow-card`, `--shadow-elevated`) — no hardcoded colours
- Images get descriptive alt text and lazy loading
