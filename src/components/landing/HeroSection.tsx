import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Gauge, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroFleet from '@/assets/hero-fleet.jpg';

const HeroSection = () => (
  <section id="home" className="relative overflow-hidden bg-sidebar pt-28 pb-20 text-sidebar-foreground lg:pt-36 lg:pb-28">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] animate-pulse rounded-full bg-primary/25 blur-[120px]" />
      <div className="absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_35%,hsl(20_15%_8%/0.7))]" />
    </div>

    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="animate-fade-in">
        <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/60 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-sidebar-primary backdrop-blur">
          <Activity className="h-3.5 w-3.5" /> Smart mobility infrastructure
        </span>

        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-sidebar-accent-foreground sm:text-5xl lg:text-6xl">
          Smart Mobility &amp; Fleet Management{' '}
          <span className="bg-gradient-to-r from-primary to-[hsl(35_95%_62%)] bg-clip-text text-transparent">
            for the Future
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-sidebar-foreground/75 sm:text-lg">
          ASTERNG is building a technology-driven transportation ecosystem powered by smart metering, live GPS
          tracking, rider management, fleet operations, and scalable mobility infrastructure.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-7 text-base font-semibold">
            <Link to="/signup">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-sidebar-border bg-sidebar-accent/40 px-7 text-base font-semibold text-sidebar-accent-foreground backdrop-blur hover:bg-sidebar-accent"
          >
            <Link to="/login">Login to Dashboard</Link>
          </Button>
        </div>

        <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-sidebar-border pt-6">
          {[
            { k: 'Live', v: 'GPS tracking' },
            { k: 'Smart', v: 'Fare metering' },
            { k: 'Verified', v: 'Rider KYC' },
          ].map((s) => (
            <div key={s.k}>
              <dt className="font-display text-lg font-bold text-sidebar-primary">{s.k}</dt>
              <dd className="text-xs text-sidebar-foreground/60">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative animate-scale-in">
        <div className="overflow-hidden rounded-3xl border border-sidebar-border shadow-2xl">
          <img
            src={heroFleet}
            alt="ASTERNG smart fleet of motorcycles and tricycles connected by live GPS routes"
            width={1280}
            height={960}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute -left-3 top-8 hidden rounded-2xl border border-sidebar-border bg-sidebar/80 p-4 shadow-xl backdrop-blur-xl sm:block">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/15 p-2 text-primary">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Live fare</p>
              <p className="font-display text-lg font-bold text-sidebar-accent-foreground">₦2,450</p>
            </div>
          </div>
        </div>

        <div className="absolute -right-3 bottom-10 hidden rounded-2xl border border-sidebar-border bg-sidebar/80 p-4 shadow-xl backdrop-blur-xl sm:block">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/15 p-2 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Riders online</p>
              <p className="font-display text-lg font-bold text-sidebar-accent-foreground">08 active</p>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-sidebar-border bg-sidebar/85 px-4 py-2 text-xs text-sidebar-foreground/80 shadow-xl backdrop-blur-xl md:flex">
          <ShieldCheck className="h-4 w-4 text-primary" /> KYC verified fleet operations
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
