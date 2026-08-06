import {
  Bike,
  Gauge,
  MapPin,
  Users,
  Wallet,
  Wrench,
  ShieldCheck,
  BarChart3,
  Target,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import Reveal from './Reveal';

const services = [
  { icon: Bike, title: 'Fleet Ownership & Leasing', desc: 'Motorcycles and tricycles owned, assigned and managed under one accountable structure.' },
  { icon: Gauge, title: 'Smart Meter Trips', desc: 'Automated fare computation from base rate, distance, time, night and luggage charges.' },
  { icon: MapPin, title: 'Live GPS Tracking', desc: 'Real-time rider positions, trip routes and status monitoring across the whole fleet.' },
  { icon: Users, title: 'Rider Management', desc: 'Onboarding, KYC verification, licence tracking and compliance scoring for every rider.' },
  { icon: Wallet, title: 'Remittance Collection', desc: 'Daily and weekly remittance capture with automatic overdue balance allocation.' },
  { icon: Wrench, title: 'Maintenance Control', desc: 'Service history, mechanic expenses and per-bike cost tracking that protects margins.' },
  { icon: ShieldCheck, title: 'Compliance & Safety', desc: 'Document expiry alerts, incident records and verification workflows for peace of mind.' },
  { icon: BarChart3, title: 'Analytics & Reporting', desc: 'Revenue, expense and profitability insight exportable to PDF and Excel on demand.' },
];

const AboutSection = () => (
  <section id="about" className="relative py-24 lg:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Who we are</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Building Nigeria's most accountable mobility operator
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            ASTERNG is a Nigerian smart mobility and fleet ownership company. We acquire, assign and operate
            commercial motorcycles and tricycles, and we back every asset with software — smart metering, GPS,
            KYC and financial controls — so that riders earn transparently and owners see every naira.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              'Technology-first operations, not paperwork and guesswork',
              'Verified riders with structured onboarding and compliance scoring',
              'Transparent daily and weekly remittance for every asset',
              'Data that makes each motorcycle a measurable business unit',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          <Reveal delay={80} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:mt-10">
            <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Target className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">Our Mission</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To make commercial mobility profitable, safe and transparent through technology that serves both
              riders and fleet owners.
            </p>
          </Reveal>
          <Reveal delay={160} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Eye className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">Our Vision</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To become West Africa's leading smart mobility infrastructure company, powering thousands of
              connected vehicles across cities.
            </p>
          </Reveal>
          <Reveal
            delay={240}
            className="rounded-2xl border border-border bg-[image:var(--gradient-brand)] p-6 text-primary-foreground shadow-[var(--shadow-elevated)] sm:col-span-2"
          >
            <h3 className="font-display text-lg font-bold">Our Values</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Accountability', 'Safety', 'Innovation', 'Rider dignity', 'Transparency', 'Discipline'].map((v) => (
                <span key={v} className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
                  {v}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);

const ServicesSection = () => (
  <section id="services" className="relative border-y border-border bg-muted/40 py-24 lg:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">What we do</p>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          A full operating system for commercial fleets
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Every service below runs on the same platform, so operations, finance and compliance never fall out of sync.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => (
          <Reveal
            key={s.title}
            delay={i * 60}
            className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
          >
            <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export { AboutSection, ServicesSection };
