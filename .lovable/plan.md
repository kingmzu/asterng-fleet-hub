# Fix ASTERNG Contact Section

## Why the form fails today

The stored contact table has only name, email, subject, message, created_at. The form sends a `phone` field (column does not exist) and allows an empty subject (the column is required and the access rule demands 1-200 characters). Every submission is rejected by the database, so nothing is ever saved.

## 1. Correct contact details everywhere

Replace the placeholders (`info@asterng.com`, `+234 800 000 0000`, `Abuja, Nigeria`) with:

- Phone: +234 901 133 1000 — clickable `tel:` link
- Email: asterngofficial@gmail.com — clickable `mailto:` link
- Office: Gombe State, Nigeria

Applied to the homepage contact section and the footer (footer gains a small contact block with the same phone/email/address). Social icons that currently link to `#contact` stay as-is unless you give real profile URLs.

## 2. Working contact form

Fields: Full Name (required), Email (required, validated), Phone (optional), Subject (required), Message (required). Button: "Send Message" with spinner + disabled state while submitting.

- Client validation blocks submission and highlights the first problem.
- On success: "Thank you for contacting ASTERNG. Your message has been received and our team will get back to you shortly." and the form clears.
- On failure: "Your message could not be sent. Please try again or contact us directly at asterngofficial@gmail.com." The real error is logged; nothing is silently swallowed.
- Success is only shown after the database confirms the write.

## 3. Storage

Database change to the contact messages table:

- add `phone` (optional)
- add `status` with values unread / read / replied, defaulting to unread
- keep name, email, subject, message, timestamp
- update the public submit rule to allow the new fields; reading stays staff-only, plus staff can update the status

## 4. Admin view

The dashboard Messages page gets a second tab, "Website enquiries", listing submissions newest-first with sender name, email, phone, subject, message, date received and an unread/read/replied badge. Opening a message marks it read; a control lets staff switch between unread / read / replied. Unread count shows on the tab. Staff-only, enforced in the database.

## 5. Email notification

Email sending requires a verified sender domain for this project. I will check the current status during the build:

- If a sender domain is already set up, each submission also emails asterngofficial@gmail.com with the sender's name, email, phone, subject and message.
- If not, storage + admin view still work and I will tell you plainly that no email was sent and offer to set the domain up. No false "email sent" claim.

## 6. UI/UX

Cleaner card layout for the contact details, consistent spacing, lucide icons, responsive one-column stacking on mobile, inline field labels, focus states, loading animation on the button and toast notifications for success/error.

## Technical notes

- Migration: `ALTER TABLE public.contact_messages ADD COLUMN phone text, ADD COLUMN status text NOT NULL DEFAULT 'unread'` with a status check, replace the INSERT policy, add a staff UPDATE policy, grant staff update.
- `src/components/landing/ContactSection.tsx`: corrected details, subject required, phone written to the new column, new success/error copy.
- `src/components/landing/LandingFooter.tsx`: contact block with the same details.
- `src/pages/MessagesPage.tsx` + a new `src/hooks/api/useContactMessages.ts`: enquiries tab with list, detail view and status updates.
- Email notification (conditional): a `send-transactional-email` template plus an invoke from the submit handler.
