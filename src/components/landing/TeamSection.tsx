import { Linkedin, Twitter, Mail } from 'lucide-react';
import Reveal from './Reveal';
import ceoPhoto from '@/assets/team-ceo.jpg.asset.json';
import opsPhoto from '@/assets/team-ops.jpg.asset.json';
import bdPhoto from '@/assets/team-bd.jpg.asset.json';
import salesPhoto from '@/assets/team-sales.jpg.asset.json';
import marketingPhoto from '@/assets/team-marketing.jpg.asset.json';
import communityPhoto from '@/assets/team-community.jpg.asset.json';

const team = [
  { name: 'Abdullahi Kabir Muazu', role: 'Founder & Chief Executive Officer', photo: ceoPhoto.url, position: 'object-top' },
  { name: 'Aliyu Muhammad Sani', role: 'Operational Manager', photo: opsPhoto.url, position: 'object-top' },
  { name: 'Abdulkadir Halilu', role: 'Business Development & Human Resources Officer', photo: bdPhoto.url, position: 'object-center' },
  { name: 'Nasir Abdullahi Bardi', role: 'Sales & Customer Success Officer', photo: salesPhoto.url, position: 'object-top' },
  { name: 'Auwal Musa', role: 'Marketing & Communications Officer', photo: marketingPhoto.url, position: 'object-top' },
  { name: 'Abdurrahman Kabir Muazu', role: 'Community Engagement Officer', photo: communityPhoto.url, position: 'object-top' },
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

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m, i) => (
          <Reveal
            key={m.name}
            delay={i * 80}
            className="group rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-full ring-2 ring-primary/30 ring-offset-4 ring-offset-card transition-all duration-300 group-hover:ring-primary">
              <img
                src={m.photo}
                alt={`${m.name}, ${m.role} at ASTERNG`}
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h3 className="mt-5 font-display text-base font-bold text-foreground">{m.name}</h3>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{m.role}</p>
            <div className="mt-4 flex justify-center gap-2 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
              <span className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Linkedin className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Twitter className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
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
