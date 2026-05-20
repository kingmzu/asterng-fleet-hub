import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import logoMark from '@/assets/asterng-logo-mark.png';
import ceoImg from '@/assets/team/Abdullahi_Kabir_Muazu.jpg';
import opsImg from '@/assets/team/Aliyu_M_Sani.jpg';
import mk1Img from '@/assets/team/Abdulkadir_Halilu.jpg';
import mk2Img from '@/assets/team/Bardi_Nasir.jpg';
import mk3Img from '@/assets/team/Abdurrahman_K_Muazu.jpg';
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
  Facebook,
  Instagram,
  Activity,
  Navigation,
  Clock,
  CheckCheck,
  AlertCircle,
  Wrench,
} from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.78a8.16 8.16 0 0 0 4.77 1.52V6.85a4.85 4.85 0 0 1-1.84-.16z" />
  </svg>
);

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

type TeamMember = {
  name: string;
  role: string;
  photo: string;
  group: 'leadership' | 'operations' | 'marketing';
};

const team: TeamMember[] = [
  { name: 'Abdullahi Kabir Muazu', role: 'Founder & CEO', photo: ceoImg, group: 'leadership' },
  { name: 'Aliyu M Sani', role: 'Operational Manager', photo: opsImg, group: 'operations' },
  { name: 'Abdulkadir Halilu', role: 'Marketing Executive', photo: mk1Img, group: 'marketing' },
  { name: 'Bardi Nasir', role: 'Marketing Executive', photo: mk2Img, group: 'marketing' },
  { name: 'Abdurrahman K Muazu', role: 'Marketing Executive', photo: mk3Img, group: 'marketing' },
];

const socials = [
  {
    label: 'TikTok',
    Icon: TikTokIcon,
    href: 'https://www.tiktok.com/@asterngofficial?_r=1&_t=ZS-94NeIk1vO2m',
  },
  {
    label: 'Instagram',
    Icon: Instagram,
    href: 'https://www.instagram.com/p/DV7hJKQiFDu/?igsh=MXNnbnNlbzR2Z3dsaw==',
  },
  {
    label: 'X (Twitter)',
    Icon: Twitter,
    href: 'https://x.com/asterngofficial?s=21&t=WHrZJvhI1Yk0QawTrqyQ7g',
  },
  {
    label: 'Facebook',
    Icon: Facebook,
    href: 'https://www.facebook.com/asterngofficial?mibextid=wwXIfr',
  },
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

const Stat = ({
  value,
  label,
  start,
  suffix = '+',
}: {
  value: number;
  label: string;
  start: boolean;
  suffix?: string;
}) => {
  const v = useCounter(value, start);
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-bold text-primary sm:text-5xl">
        {v.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
};

const TeamCard = ({ m }: { m: TeamMember }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" />
    <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full ring-4 ring-background shadow-lg transition-transform duration-300 group-hover:scale-105">
      <img
        src={m.photo}
        alt={m.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
    <h3 className="mt-5 font-display text-base font-semibold leading-tight">{m.name}</h3>
    <p className="mt-1 text-sm text-primary">{m.role}</p>
  </div>
);

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
    { href: '#team', label: 'Team' },
    { href: '#contact', label: 'Contact' },
  ];

  const leadership = team.filter((t) => t.group !== 'marketing');
  const marketing = team.filter((t) => t.group === 'marketing');

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

          {/* Live Operations mockup */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-3xl border border-border bg-card/80 p-4 shadow-2xl backdrop-blur-sm">
              <div className="rounded-2xl bg-gradient-to-br from-accent to-accent/70 p-5 text-accent-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      Live Operations
                    </div>
                    <div className="mt-1 font-display text-3xl font-bold">8 Active Trips</div>
                    <div className="mt-0.5 text-xs opacity-70">Updated just now</div>
                  </div>
                  <Activity className="h-8 w-8 opacity-80" />
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
                  { l: 'Active Riders', v: '10', i: Users },
                  { l: 'Fleet Online', v: '13', i: Bike },
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
                  <div className="text-sm font-semibold">Gombe → Shongo Estate</div>
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
            <p className="mt-4 text-muted-foreground">
              A live snapshot of how ASTERNG operates — metering, tracking, fleet, and compliance, all in real time.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* Smart Meter Preview */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <Gauge className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">Smart Meter</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Real-time fare calculation with full ride telemetry.</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
                </span>
              </div>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Active Trip</div>
                    <div className="mt-0.5 font-display text-lg font-semibold">Aliyu M Sani</div>
                    <div className="text-xs text-muted-foreground">Bike • GMB-217-XA</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-bold text-primary">₦ 1,840</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Fare</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg border border-border/60 bg-card p-2">
                    <Navigation className="mx-auto h-4 w-4 text-primary" />
                    <div className="mt-1 text-sm font-semibold">6.4 km</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card p-2">
                    <Clock className="mx-auto h-4 w-4 text-primary" />
                    <div className="mt-1 text-sm font-semibold">12:48</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timer</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card p-2">
                    <Activity className="mx-auto h-4 w-4 text-primary" />
                    <div className="mt-1 text-sm font-semibold">38 km/h</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Speed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Tracking Preview */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">Live GPS Tracking</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Continuous location streams for every active vehicle.</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
                </span>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm">
                <div
                  className="relative h-40 w-full bg-gradient-to-br from-primary/10 via-accent/10 to-muted"
                  style={{
                    backgroundImage:
                      'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                >
                  {/* Route line */}
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                    <path d="M10 80 Q 60 20, 110 60 T 195 25" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  </svg>
                  {/* Rider markers */}
                  {[
                    { top: '70%', left: '12%' },
                    { top: '40%', left: '38%' },
                    { top: '55%', left: '62%' },
                    { top: '22%', left: '85%' },
                  ].map((p, i) => (
                    <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={p}>
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 divide-x divide-border/60 p-3 text-center">
                  <div>
                    <div className="font-display text-lg font-bold">10</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Online</div>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-primary">8</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">On Trip</div>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold">2</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Idle</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fleet Management Preview */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <Bike className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">Fleet Management</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Vehicle status, assignments and maintenance.</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
                </span>
              </div>
              <div className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
                {[
                  { plate: 'GMB-217-XA', rider: 'Aliyu M Sani', status: 'Active', tone: 'success' },
                  { plate: 'GMB-433-LK', rider: 'Bardi Nasir', status: 'Active', tone: 'success' },
                  { plate: 'GMB-908-PT', rider: 'Unassigned', status: 'Maintenance', tone: 'warning' },
                  { plate: 'GMB-115-QR', rider: 'Abdulkadir Halilu', status: 'Active', tone: 'success' },
                ].map((v) => (
                  <div key={v.plate} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {v.status === 'Maintenance' ? <Wrench className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{v.plate}</div>
                        <div className="text-[11px] text-muted-foreground">{v.rider}</div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        v.tone === 'success' ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="rounded-md bg-muted/50 py-1.5">
                    <div className="text-sm font-bold">13</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                  </div>
                  <div className="rounded-md bg-success/10 py-1.5">
                    <div className="text-sm font-bold text-success">11</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</div>
                  </div>
                  <div className="rounded-md bg-warning/10 py-1.5">
                    <div className="text-sm font-bold text-warning">2</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Service</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC / Compliance Preview */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/40 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">KYC & Compliance</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Verified riders, pending approvals and document checks.</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
                </span>
              </div>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-center">
                    <CheckCheck className="mx-auto h-5 w-5 text-success" />
                    <div className="mt-1 font-display text-xl font-bold text-success">8</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Verified</div>
                  </div>
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-center">
                    <AlertCircle className="mx-auto h-5 w-5 text-warning" />
                    <div className="mt-1 font-display text-xl font-bold text-warning">2</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
                    <div className="mt-1 font-display text-xl font-bold text-primary">92%</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Compliance</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { name: 'Abdulkadir Halilu', status: 'Verified', tone: 'success' },
                    { name: 'Bardi Nasir', status: 'Verified', tone: 'success' },
                    { name: 'Abdurrahman K Muazu', status: 'Pending', tone: 'warning' },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2 text-xs">
                      <span className="font-medium">{r.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.tone === 'success' ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          <Stat value={10} label="Active Riders" start={statsVisible} />
          <Stat value={13} label="Fleet Vehicles" start={statsVisible} />
          <Stat value={500} label="Trips Managed" start={statsVisible} />
          <Stat value={1} label="Operational Zone" start={statsVisible} suffix="" />
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Leadership</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Meet Our Team</h2>
            <p className="mt-4 text-muted-foreground">
              The people driving ASTERNG's mission to modernize mobility across Nigeria.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:max-w-3xl lg:mx-auto">
            {leadership.map((m) => (
              <TeamCard key={m.name} m={m} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Marketing Team</span>
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">Growth & Outreach</h3>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {marketing.map((m) => (
              <TeamCard key={m.name} m={m} />
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
              <a href="tel:+2349023997552" className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Phone</div>
                  <div className="font-medium">09023997552</div>
                </div>
              </a>
              <a href="mailto:asterngofficial@gmail.com" className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Email</div>
                  <div className="font-medium">asterngofficial@gmail.com</div>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Office</div>
                  <div className="font-medium">Shongo Housing Estate, Gombe State</div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Follow us</div>
              <div className="mt-3 flex gap-3">
                {socials.map(({ label, Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
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
              <li><a href="#team" className="hover:text-primary transition-colors">Team</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-widest">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-accent-foreground/70">
              <li>09023997552</li>
              <li>asterngofficial@gmail.com</li>
              <li>Shongo Estate, Gombe State</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-widest">Follow</h4>
            <div className="mt-4 flex gap-3">
              {socials.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary"
                >
                  <Icon className="h-4 w-4" />
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
