import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Reveal from './Reveal';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email address').max(255),
  phone: z.string().trim().max(30, 'Phone number is too long').optional().or(z.literal('')),
  subject: z.string().trim().max(150, 'Subject is too long').optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message is too long'),
});

const details = [
  { icon: Mail, label: 'Email', value: 'info@asterng.com', href: 'mailto:info@asterng.com' },
  { icon: Phone, label: 'Phone', value: '+234 800 000 0000', href: 'tel:+2348000000000' },
  { icon: MapPin, label: 'Office', value: 'Abuja, Nigeria', href: undefined },
];

const socials = [
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Twitter, label: 'X' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Facebook, label: 'Facebook' },
];

const ContactSection = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: 'Check your details',
        description: parsed.error.errors[0]?.message ?? 'Please review the form',
        variant: 'destructive',
      });
      return;
    }
    setSending(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setSending(false);
    if (error) {
      toast({ title: 'Message not sent', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Message sent', description: 'Thank you — our team will get back to you shortly.' });
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Let's talk about your fleet
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Partner with us, invest in the fleet, or join as a rider. Send a message and our team will respond
              within one business day.
            </p>

            <div className="mt-10 space-y-4">
              {details.map((d) => (
                <div key={d.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-sm font-medium text-foreground hover:text-primary">
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#contact"
                  aria-label={s.label}
                  className="rounded-full border border-border bg-card p-3 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal
            delay={120}
            className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)] sm:p-8"
          >
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Full name</Label>
                  <Input id="c-name" value={form.name} onChange={set('name')} required maxLength={100} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" value={form.email} onChange={set('email')} required maxLength={255} className="h-11" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-phone">Phone (optional)</Label>
                  <Input id="c-phone" value={form.phone} onChange={set('phone')} maxLength={30} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-subject">Subject (optional)</Label>
                  <Input id="c-subject" value={form.subject} onChange={set('subject')} maxLength={150} className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-message">Message</Label>
                <Textarea id="c-message" value={form.message} onChange={set('message')} required maxLength={2000} rows={6} />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full rounded-full text-base font-semibold" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    Send message <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
