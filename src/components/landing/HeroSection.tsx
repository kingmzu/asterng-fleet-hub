import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Gauge, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const HeroSection = () => (
  <section id="home" className="relative overflow-hidden bg-sidebar pt-28 pb-20 text-sidebar-foreground lg:pt-36 lg:pb-28">
    {/* Cinematic background image */}
    <div className="pointer-events-none absolute inset-0">
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1088}
        className="h-full w-full object-cover opacity-70"
      />
      {/* Blend overlays: darken left for text, fade into page background */}
      <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/80 to-sidebar/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-transparent to-sidebar/70" />
      {/* Ambient glows */}
      <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[140px]" />
      {/* Subtle tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(0_0%_50%/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_50%/0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_70%,transparent_100%)]" />
    </div>

    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="animate-fade-in">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Smart mobility infrastructure
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
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-7 text-base font-semibold shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-transform hover:scale-105 active:scale-95"
          >
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

      {/* Floating glass stat cards over the background visual */}
      <div className="relative hidden min-h-[24rem] animate-scale-in lg:block">
        <div className="absolute left-6 top-6 rounded-2xl border border-sidebar-border bg-sidebar/70 p-4 shadow-2xl backdrop-blur-xl motion-safe:animate-[bounce_6s_ease-in-out_infinite]">
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

        <div className="absolute bottom-16 right-4 rounded-2xl border border-sidebar-border bg-sidebar/70 p-4 shadow-2xl backdrop-blur-xl motion-safe:animate-[bounce_7s_ease-in-out_infinite]">
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

        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-sidebar-border bg-sidebar/80 px-4 py-2 text-xs text-sidebar-foreground/80 shadow-xl backdrop-blur-xl">
          <ShieldCheck className="h-4 w-4 text-primary" /> KYC verified fleet operations
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
