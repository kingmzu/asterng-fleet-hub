import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import logoMark from '@/assets/asterng-logo-mark.png';
import {
  Gauge,
  Bike,
  Users,
  MapPin,
  Truck,
  Wallet,
  Settings2,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  MapPinned,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
} from 'lucide-react';

const services = [
  { icon: Gauge, title: 'Smart Meter System', desc: 'Accurate fare calculation powered by intelligent metering.' },
  { icon: Bike, title: 'Fleet Management', desc: 'Centralized oversight of every vehicle in your operation.' },
  { icon: Users, title: 'Rider Operations', desc: 'Onboard, verify, and manage riders with structured workflows.' },
  { icon: MapPin, title: 'GPS Live Tracking', desc: 'Real-time visibility across your entire mobility network.' },
  { icon: Truck, title: 'Logistics & Delivery', desc: 'Reliable last-mile delivery powered by smart routing.' },
  { icon: Wallet, title: 'Revenue Monitoring', desc: 'Track remittance, earnings and performance in real time.' },
  { icon: Settings2, title: 'Transport Management', desc: 'End-to-end transport orchestration at scale.' },
  { icon: ShieldCheck, title: 'Compliance & Verification', desc: 'KYC, document checks and safety enforcement built-in.' },
];

const whyFeatures = [
  { icon: MapPin, title: 'Real-Time GPS Tracking', desc: 'Live location data on every active asset.' },
  { icon: Gauge, title: 'Smart Fare Calculation', desc: 'Transparent, automated pricing.' },
  { icon: Bike, title: 'Structured Fleet Operations', desc: 'Standardized processes across the fleet.' },
  { icon: ShieldCheck, title: 'Secure Rider Verification', desc: 'Robust KYC and identity safeguards.' },
  { icon: Wallet, title: 'Real-Time Revenue Monitoring', desc: 'Financial clarity at every layer.' },
  { icon: Settings2, title: 'Scalable Mobility Infrastructure', desc: 'Built to grow with your network.' },
];

const team = [
  { name: 'Founder & CEO', role: 'Leadership', initials: 'CE' },
  { name: 'Head of Operations', role: 'Operations', initials: 'OP' },
  { name: 'Finance & Compliance', role: 'Finance', initials: 'FC' },
];

function useCounter(target: number, start: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}

const Stat = ({ value, label, start }: { value: number; label: string; start: boolean }) => {
  const v = useCounter(value, start);
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-bold text-primary sm:text-5xl">{v.toLocaleString()}+</div>
      <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
};

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setStatsVisible(true),
      { threshold: 0.3 },
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#services', label: 'Services' },
    { href: '#fleet', label: 'Fleet' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-border/60 bg-background/70 backdrop-blur-xl shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <a href="#home" className="flex items-center gap-2">
            <img src={logoMark} alt="ASTERNG" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight">ASTERNG</span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/login?signup=1">Sign Up</Link>
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/login?signup=1">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute top-20 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Smart Mobility Infrastructure
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Smart Mobility & Fleet Management for the{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Future
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              ASTERNG is building a technology-driven transportation and fleet ecosystem powered by smart metering,
              live GPS tracking, rider management, and scalable mobility infrastructure.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/login?signup=1">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/login">Login to Dashboard</Link>
              </Button>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-3xl border border-border bg-card/80 p-4 shadow-2xl backdrop-blur-sm">
              <div className="rounded-2xl bg-gradient-to-br from-accent to-accent/70 p-5 text-accent-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest opacity-70">Live Revenue</div>
                    <div className="mt-1 font-display text-3xl font-bold">₦ 2,485,000</div>
                  </div>
                  <Gauge className="h-8 w-8 opacity-80" />
                </div>
                <div className="mt-5 flex h-16 items-end gap-1.5">
                  {[40, 65, 50, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/80"
                      style={{ height: `${h}%`, animation: `fade-in 0.6s ease-out ${i * 0.05}s both` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { l: 'Active Riders', v: '1,284', i: Users },
                  { l: 'Fleet Online', v: '947', i: Bike },
                ].map(({ l, v, i: Ic }) => (
                  <div key={l} className="rounded-xl border border-border bg-background/60 p-3">
                    <Ic className="h-4 w-4 text-primary" />
                    <div className="mt-2 font-display text-lg font-bold">{v}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm sm:block animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Live Trip</div>
                  <div className="text-sm font-semibold">Lagos → Ikeja</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/50 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Who We Are</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            A modern mobility & fleet company
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            ASTERNG is focused on transforming transportation through structured operations, intelligent tracking
            systems, and scalable transport solutions. We provide smart transport systems for riders, fleet owners,
            logistics operations and urban mobility services using technology-driven infrastructure.
          </p>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-t border-border/50 bg-muted/30 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Services</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built for every layer of mobility
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="group relative overflow-hidden border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/5 group-hover:to-transparent" />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live System Preview */}
      <section id="fleet" className="border-t border-border/50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Live System</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              See the platform in action
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {[
              { title: 'Smart Meter', desc: 'Real-time fare calculation with full ride telemetry.', icon: Gauge },
              { title: 'Live GPS Tracking', desc: 'Continuous location streams for every vehicle.', icon: MapPin },
              { title: 'Operations Dashboard', desc: 'A single view across riders, fleet and revenue.', icon: Settings2 },
              { title: 'Rider Management', desc: 'Onboarding, KYC, compliance and performance.', icon: Users },
            ].map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/40 p-8 shadow-sm transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
                    </span>
                    <span>Updated just now</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[80, 60, 90].map((w, i) => (
                      <div key={i} className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50" style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="relative overflow-hidden border-t border-border/50 bg-accent py-20 text-accent-foreground lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2 lg:px-8">
          {[
            { title: 'Our Vision', body: 'To build Africa\'s leading technology-powered mobility and fleet ecosystem.' },
            { title: 'Our Mission', body: 'To deliver structured, secure, and scalable transportation systems through innovation, smart operations, and intelligent mobility infrastructure.' },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-xl shadow-2xl transition-transform duration-300 hover:-translate-y-1"
            >
              <h3 className="font-display text-2xl font-bold">{b.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-accent-foreground/85">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why ASTERNG */}
      <section className="border-t border-border/50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Why ASTERNG</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              An ecosystem engineered for scale
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyFeatures.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-semibold">{title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <CheckCircle2 className="mt-4 h-4 w-4 text-success opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        ref={statsRef}
        className="relative overflow-hidden border-y border-border/50 bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 lg:px-8">
          <Stat value={1284} label="Active Riders" start={statsVisible} />
          <Stat value={947} label="Fleet Vehicles" start={statsVisible} />
          <Stat value={84500} label="Trips Managed" start={statsVisible} />
          <Stat value={18} label="Operational Zones" start={statsVisible} />
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Team</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Meet the Team</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <div
                key={m.name}
                className="group rounded-3xl border border-border bg-card p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-2xl font-bold text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {m.initials}
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{m.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
                <div className="mt-4 flex justify-center gap-3 text-muted-foreground">
                  <Linkedin className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" />
                  <Twitter className="h-4 w-4 hover:text-primary transition-colors cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border/50 bg-muted/30 py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Let's build the future of mobility</h2>
            <p className="mt-4 text-muted-foreground">Reach out — we typically respond within one business day.</p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>contact@asterng.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>+234 (0) 800 000 0000</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-primary" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Full name" />
              <input className="rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Email" type="email" />
            </div>
            <input className="mt-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Subject" />
            <textarea rows={5} className="mt-4 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="How can we help?" />
            <Button type="submit" size="lg" className="mt-5 w-full rounded-full">Send Message</Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-accent text-accent-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <img src={logoMark} alt="ASTERNG" className="h-8 w-8 object-contain" />
              <span className="font-display text-lg font-bold">ASTERNG</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-accent-foreground/70">
              Smart mobility & fleet management infrastructure for Africa's future.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-widest">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-accent-foreground/70">
              <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#services" className="hover:text-primary transition-colors">Services</a></li>
              <li><a href="#fleet" className="hover:text-primary transition-colors">Fleet</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-widest">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-accent-foreground/70">
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-widest">Follow</h4>
            <div className="mt-4 flex gap-3">
              {[Twitter, Linkedin, Facebook, Instagram].map((Ic, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-primary">
                  <Ic className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-accent-foreground/60">
          © {new Date().getFullYear()} ASTERNG. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
