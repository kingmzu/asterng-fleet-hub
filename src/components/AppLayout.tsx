import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLogout, useCurrentUser, useUserProfile } from '@/hooks/api';
import { useAvatarUrl } from '@/hooks/api/useProfile';
import { useConversations, useRealtimeMessages } from '@/hooks/api/useMessaging';
import { useRoles } from '@/hooks/api/useRoles';
import { useTheme } from '@/components/ThemeProvider';
import {
  LayoutDashboard,
  Users,
  Bike,
  Wallet,
  Receipt,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronRight,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  Gauge,
} from 'lucide-react';
import logoMark from '@/assets/asterng-logo-mark.png';
import { Badge } from '@/components/ui/badge';

const allNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, staffOnly: true },
  { to: '/riders', label: 'Riders', icon: Users, staffOnly: true },
  { to: '/motorcycles', label: 'Motorcycles', icon: Bike, staffOnly: true },
  { to: '/smart-meter', label: 'Smart Meter', icon: Gauge, staffOnly: false },
  { to: '/remittances', label: 'Remittances', icon: Wallet, staffOnly: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt, staffOnly: true },
  { to: '/compliance', label: 'Compliance', icon: Shield, staffOnly: true },
  { to: '/messages', label: 'Messages', icon: MessageSquare, staffOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, staffOnly: true },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const { user } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const { data: avatarSignedUrl } = useAvatarUrl(profile?.avatar_url);
  const { isStaff } = useRoles();
  const { data: conversations = [] } = useConversations();
  const { resolved, setTheme } = useTheme();
  useRealtimeMessages();

  const navItems = allNavItems.filter((i) => isStaff || !i.staffOnly);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0);
  const displayName = profile?.full_name || user?.email || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const currentPage = navItems.find((item) => item.to === location.pathname)?.label || 'Smart Meter';

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-10 w-10 items-center justify-center">
            <img src={logoMark} alt="ASTERNG logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-sidebar-primary">ASTERNG</h1>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Aster A+ Fleet</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-accent-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/messages' && totalUnread > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{totalUnread}</Badge>
              )}
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            {isStaff ? (
              <button
                onClick={() => { setSidebarOpen(false); navigate('/profile'); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground hover:ring-2 hover:ring-sidebar-ring transition-all overflow-hidden"
              >
                {avatarSignedUrl ? (
                  <img src={avatarSignedUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </button>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{displayName}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
            </div>
            <button
              onClick={() => logout(undefined, { onSuccess: () => navigate('/login') })}
              className="rounded-md p-1 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center lg:hidden">
            <img src={logoMark} alt="ASTERNG" className="h-full w-full object-contain" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">{currentPage}</h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
