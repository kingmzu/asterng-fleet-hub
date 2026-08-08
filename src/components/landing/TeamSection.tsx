import { Linkedin, Twitter, Mail } from 'lucide-react';
import Reveal from './Reveal';

const team = [
  { name: 'Abdullahi Kabir Muazu', role: 'Founder & Chief Executive Officer', initials: 'AK' },
  { name: 'Aliyu Muhammad Sani', role: 'OPERATIONAL MANAGER', initials: 'AM' },
  { name: 'Finance Lead', role: 'Head of Finance & Remittance', initials: 'FL' },
  { name: 'Technology Lead', role: 'Head of Platform Engineering', initials: 'TL' },
];

const TeamSection = () => (
  <section id="team" className="border-y border-border bg-muted/40 py-24 lg:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Leadership</p>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          The team behind the fleet
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Operators, engineers and finance professionals building mobility infrastructure for Nigerian cities.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((m, i) => (
          <Reveal
            key={m.name}
            delay={i * 80}
            className="group rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[image:var(--gradient-gold)] font-display text-xl font-bold text-primary-foreground">
              {m.initials}
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-foreground">{m.name}</h3>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{m.role}</p>
            <div className="mt-4 flex justify-center gap-2 opacity-60 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-muted p-2 text-muted-foreground">
                <Linkedin className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-full bg-muted p-2 text-muted-foreground">
                <Twitter className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-full bg-muted p-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;
