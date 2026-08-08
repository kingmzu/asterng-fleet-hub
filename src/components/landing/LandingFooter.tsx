import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import logoMark from '@/assets/asterng-logo-mark.png';
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from './ContactSection';

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });


const LandingFooter = () => (
  <footer className="bg-sidebar py-14 text-sidebar-foreground">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img src={logoMark} alt="ASTERNG logo" className="h-9 w-9 object-contain" width={36} height={36} loading="lazy" />
            <span className="font-display text-lg font-bold text-sidebar-accent-foreground">ASTERNG</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sidebar-foreground/60">
            Smart mobility and fleet management infrastructure for Nigerian cities — metering, tracking, rider
            compliance and transparent remittance in one platform.
          </p>
          <div className="mt-6 flex gap-3">
            {[Linkedin, Twitter, Instagram, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#contact"
                aria-label="ASTERNG social profile"
                className="rounded-full border border-sidebar-border p-2.5 text-sidebar-foreground/60 transition-colors hover:text-sidebar-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-sidebar-primary">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ['about', 'About us'],
              ['services', 'Services'],
              ['team', 'Team'],
              ['contact', 'Contact'],
            ].map(([id, label]) => (
              <li key={id}>
                <button onClick={() => go(id)} className="text-sidebar-foreground/65 hover:text-sidebar-accent-foreground">
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-sidebar-primary">Platform</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/login" className="text-sidebar-foreground/65 hover:text-sidebar-accent-foreground">
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-sidebar-foreground/65 hover:text-sidebar-accent-foreground">
                Create account
              </Link>
            </li>
            <li>
              <button onClick={() => go('fleet')} className="text-sidebar-foreground/65 hover:text-sidebar-accent-foreground">
                Platform preview
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-sidebar-border pt-6 text-xs text-sidebar-foreground/50 sm:flex-row">
        <p>© {new Date().getFullYear()} ASTERNG. All rights reserved.</p>
        <p>Aster A+ Fleet · Abuja, Nigeria</p>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
