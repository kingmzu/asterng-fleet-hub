import { useEffect, useState } from 'react';
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
  TrendingUp,
} from 'lucide-react';
import Reveal from './Reveal';

/* ---- Live widget visuals ---- */

const FleetWidget = () => (
  <div className="space-y-2.5">
    <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
      <span>Active utilization</span>
      <span className="text-foreground">92%</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full w-[92%] rounded-full bg-primary transition-all duration-1000" />
    </div>
    <p className="text-[11px] font-semibold text-primary">46/50 bikes on the road</p>
  </div>
);

const MeterWidget = () => {
  const [fare, setFare] = useState(2350);
  useEffect(() => {
    const id = setInterval(() => setFare((f) => (f >= 2580 ? 2350 : f + 10)), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rounded-xl border border-border bg-muted/60 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current trip fare</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
        ₦{fare.toLocaleString()}
      </p>
      <p className="mt-2 flex items-center text-[10px] font-semibold text-primary">
        <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        METER RUNNING
      </p>
    </div>
  );
};

const GpsWidget = () => (
  <div className="relative h-20 w-full overflow-hidden rounded-xl border border-border bg-muted/50">
    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(hsl(var(--primary)/0.5)_1px,transparent_1px)] [background-size:12px_12px]" />
    {[
      { top: '30%', left: '22%', delay: '0s' },
      { top: '55%', left: '58%', delay: '0.6s' },
      { top: '25%', left: '76%', delay: '1.2s' },
    ].map((p, i) => (
      <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
        <span
          className="absolute -inset-2 animate-ping rounded-full bg-primary/30"
          style={{ animationDelay: p.delay }}
        />
        <span className="relative block h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
      </div>
    ))}
  </div>
);

const RidersWidget = () => (
  <div className="space-y-3">
    <div className="flex -space-x-2">
      {['AM', 'TU', 'BO', '+9'].map((n, i) => (
        <span
          key={n}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold ${
            i === 3 ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'
          }`}
        >
          {n}
        </span>
      ))}
    </div>
    <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
      3 active shifts
    </span>
  </div>
);

const RemittanceWidget = () => (
  <div className="space-y-2.5">
    <div className="flex items-end gap-2">
      <span className="font-display text-2xl font-bold text-foreground">₦8.4M</span>
      <span className="flex items-center pb-1 text-[11px] font-semibold text-primary">
        <TrendingUp className="mr-0.5 h-3 w-3" /> +12.5%
      </span>
    </div>
    <div className="flex gap-1">
      {[30, 45, 70, 100].map((o) => (
        <span key={o} className="h-1.5 flex-1 rounded-full bg-primary" style={{ opacity: o / 100 }} />
      ))}
    </div>
    <p className="text-[11px] text-muted-foreground">Collected this week</p>
  </div>
);

const MaintenanceWidget = () => (
  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
      <span className="text-[10px] font-bold uppercase tracking-tight text-destructive">Service alert</span>
    </div>
    <p className="mt-2 text-xs font-medium leading-snug text-foreground">
      Bike KJA-402: engine service due in 48km
    </p>
  </div>
);

const ComplianceWidget = () => (
  <div className="flex flex-col items-start gap-2">
    {['Insurance verified', 'Rider licence valid'].map((label) => (
      <span
        key={label}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary"
      >
        <CheckCircle2 className="h-3 w-3" /> {label}
      </span>
    ))}
  </div>
);

const AnalyticsWidget = () => (
  <div className="space-y-2">
    <div className="flex h-12 items-end gap-1.5">
      {[40, 65, 90, 55, 75, 85].map((h, i) => (
        <span
          key={i}
          className="w-full rounded-t bg-primary/20 transition-colors duration-300 group-hover:bg-primary"
          style={{ height: `${h}%`, transitionDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      Weekly revenue insight
    </p>
  </div>
);

const services = [
  { icon: Bike, title: 'Fleet Ownership & Leasing', widget: <FleetWidget /> },
  { icon: Gauge, title: 'Smart Meter Trips', widget: <MeterWidget /> },
  { icon: MapPin, title: 'Live GPS Tracking', widget: <GpsWidget /> },
  { icon: Users, title: 'Rider Management', widget: <RidersWidget /> },
  { icon: Wallet, title: 'Remittance Collection', widget: <RemittanceWidget /> },
  { icon: Wrench, title: 'Maintenance Control', widget: <MaintenanceWidget /> },
  { icon: ShieldCheck, title: 'Compliance & Safety', widget: <ComplianceWidget /> },
  { icon: BarChart3, title: 'Analytics & Reporting', widget: <AnalyticsWidget /> },
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
            commercial motorcycles and tricycles, and we back every asset with software, smart metering, GPS, KYC
            and financial controls.  So that riders earn transparently and owners see every naira.
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
              ASTERNG is committed to providing verified commercial riders with access to motorcycles through a
              disciplined fleet management system, while generating consistent and sustainable revenue through a
              controlled and transparent remittance model. 
            </p>
          </Reveal>
          <Reveal delay={160} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Eye className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">Our Vision</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To build a structured, scalable, and technology-driven motorcycle fleet network that enhances 
              urban mobility while creating sustainable and reliable income opportunities for riders across 
              multple regions. 
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
