import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import logoMark from '@/assets/asterng-logo-mark.png';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const links = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'team', label: 'Team' },
  { id: 'contact', label: 'Contact' },
];

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { resolved, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/70 shadow-[var(--shadow-card)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent [&_.nav-text]:text-sidebar-foreground/80 [&_.nav-text:hover]:text-sidebar-primary [&_.nav-brand]:text-sidebar-accent-foreground'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => go('home')} className="flex items-center gap-2.5" aria-label="ASTERNG home">
          <img src={logoMark} alt="ASTERNG logo" className="h-9 w-9 object-contain" width={36} height={36} />
          <span className="nav-brand font-display text-lg font-bold tracking-tight text-foreground">ASTERNG</span>
        </button>

        <div className="mx-auto hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="nav-text rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
            className="nav-text rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button asChild variant="ghost" size="sm" className="nav-text hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="hidden rounded-full px-5 sm:inline-flex">
            <Link to="/signup">Sign Up</Link>
          </Button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="nav-text rounded-md p-2 text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-fade-in border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
