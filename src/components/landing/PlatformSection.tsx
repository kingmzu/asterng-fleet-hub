import { Gauge, MapPin, Wallet, Users, Bike, TrendingUp } from 'lucide-react';
import Reveal from './Reveal';
import { useCountUp } from '@/hooks/useReveal';

const previewCards = [
  { icon: Gauge, title: 'Smart Meter', desc: 'Riders start a trip and watch the fare build live — distance, time, night rate and extras.' },
  { icon: MapPin, title: 'Live Tracking', desc: 'Operations see every rider on the map with colour-coded on-trip, idle and offline states.' },
  { icon: Wallet, title: 'Remittances', desc: 'Cash, transfer and mobile money captured, allocated to overdue balances automatically.' },
  { icon: Users, title: 'Rider KYC', desc: 'Documents uploaded, reviewed and verified with a live compliance score per rider.' },
];

const stats = [
  { value: 24, suffix: '/7', label: 'Fleet monitoring' },
  { value: 100, suffix: '%', label: 'Digital remittance trail' },
  { value: 8, suffix: '+', label: 'Operational modules' },
  { value: 30, suffix: 's', label: 'Live location refresh' },
];

const StatItem = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { ref, value: current } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
        {current}
        {suffix}
      </p>
      <p className="mt-1 text-xs uppercase tracking-widest text-sidebar-foreground/60">{label}</p>
    </div>
  );
};

const PlatformSection = () => (
  <>
    <section id="fleet" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Platform preview</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One dashboard for riders, operations and finance
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Role-based access means riders see their trips, operations see the fleet, and admins see the money.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {previewCards.map((c, i) => (
            <Reveal
              key={c.title}
              delay={i * 80}
              className="flex gap-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-sidebar py-16 text-sidebar-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <StatItem key={s.label} {...s} />
        ))}
      </div>
    </section>

    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why ASTERNG</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for operators who need proof, not promises
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { icon: Bike, title: 'Asset-backed', desc: 'We own and manage real vehicles, not just software licences.' },
            { icon: TrendingUp, title: 'Margin visibility', desc: 'Revenue, maintenance and expenses tracked per motorcycle.' },
            { icon: Users, title: 'Rider-first', desc: 'Fair fares, clear balances and a path to ownership for riders.' },
          ].map((c, i) => (
            <Reveal
              key={c.title}
              delay={i * 90}
              className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]"
            >
              <span className="mx-auto inline-flex rounded-2xl bg-primary/10 p-4 text-primary">
                <c.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default PlatformSection;
