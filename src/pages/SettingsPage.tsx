import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme, Theme } from '@/components/ThemeProvider';
import { Sun, Moon, Monitor, Lock, Palette, Gauge, ShieldCheck } from 'lucide-react';
import { useUserRoles } from '@/hooks/api/useAuth';
import { useActivePricing, useUpsertPricing } from '@/hooks/api/useSmartMeter';
import ApprovalsPanel from '@/components/ApprovalsPanel';

const SettingsPage = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { data: roles = [] } = useUserRoles();
  const isAdmin = roles.includes('admin' as any);
  const { data: activePricing } = useActivePricing();
  const upsertPricing = useUpsertPricing();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [pricingForm, setPricingForm] = useState({
    base_fare: '500',
    price_per_km: '150',
    price_per_minute: '30',
    minimum_fare: '700',
    rate_multiplier: '1',
    tier: 'tier_1',
  });

  useEffect(() => {
    if (activePricing) {
      setPricingForm({
        base_fare: String(activePricing.base_fare),
        price_per_km: String(activePricing.price_per_km),
        price_per_minute: String(activePricing.price_per_minute),
        minimum_fare: String(activePricing.minimum_fare),
        rate_multiplier: String(activePricing.rate_multiplier),
        tier: activePricing.tier,
      });
    }
  }, [activePricing]);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertPricing.mutateAsync({
        id: activePricing?.id,
        tier: pricingForm.tier,
        base_fare: Number(pricingForm.base_fare),
        price_per_km: Number(pricingForm.price_per_km),
        price_per_minute: Number(pricingForm.price_per_minute),
        minimum_fare: Number(pricingForm.minimum_fare),
        rate_multiplier: Number(pricingForm.rate_multiplier),
        is_active: true,
      } as any);
      toast({ title: 'Pricing updated', description: 'New rates apply immediately.' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
  };


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: 'Weak password', description: 'New password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'New password and confirmation must match.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');
      // Verify current password by re-authenticating
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) {
        toast({ title: 'Incorrect password', description: 'Current password is invalid.', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message ?? 'Could not update password', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      <Accordion type="multiple" defaultValue={['appearance']} className="space-y-3">
        {/* Appearance */}
        <AccordionItem value="appearance" className="rounded-xl border border-border bg-card px-4 border-b">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Palette className="h-4 w-4" /></div>
              <div className="text-left">
                <p className="font-display text-sm font-semibold">Appearance</p>
                <p className="text-xs text-muted-foreground">Choose how Fleet Hub looks to you.</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Change password */}
        <AccordionItem value="password" className="rounded-xl border border-border bg-card px-4 border-b">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Lock className="h-4 w-4" /></div>
              <div className="text-left">
                <p className="font-display text-sm font-semibold">Change Password</p>
                <p className="text-xs text-muted-foreground">Update the password used to sign in.</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                </div>
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* Smart Meter Pricing — admin only */}
        {isAdmin && (
          <AccordionItem value="pricing" className="rounded-xl border border-border bg-card px-4 border-b">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Gauge className="h-4 w-4" /></div>
                <div className="text-left">
                  <p className="font-display text-sm font-semibold">Smart Meter Pricing</p>
                  <p className="text-xs text-muted-foreground">Global active fare rates for all new trips.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <form onSubmit={handleSavePricing} className="grid gap-4 pt-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pricing Tier</Label>
                  <Select value={pricingForm.tier} onValueChange={(v) => setPricingForm((f) => ({ ...f, tier: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier_1">Tier 1 (Standard)</SelectItem>
                      <SelectItem value="tier_2">Tier 2 (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Base Fare (₦)</Label><Input type="number" value={pricingForm.base_fare} onChange={(e) => setPricingForm((f) => ({ ...f, base_fare: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Price per KM (₦)</Label><Input type="number" value={pricingForm.price_per_km} onChange={(e) => setPricingForm((f) => ({ ...f, price_per_km: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Price per Minute (₦)</Label><Input type="number" value={pricingForm.price_per_minute} onChange={(e) => setPricingForm((f) => ({ ...f, price_per_minute: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Minimum Fare (₦)</Label><Input type="number" value={pricingForm.minimum_fare} onChange={(e) => setPricingForm((f) => ({ ...f, minimum_fare: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Rate Multiplier</Label><Input type="number" step="0.1" value={pricingForm.rate_multiplier} onChange={(e) => setPricingForm((f) => ({ ...f, rate_multiplier: e.target.value }))} /></div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={upsertPricing.isPending}>{upsertPricing.isPending ? 'Saving...' : 'Save Pricing'}</Button>
                </div>
              </form>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Approvals — admin only */}
        {isAdmin && (
          <AccordionItem value="approvals" className="rounded-xl border border-border bg-card px-4 border-b">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck className="h-4 w-4" /></div>
                <div className="text-left">
                  <p className="font-display text-sm font-semibold">Account Approvals</p>
                  <p className="text-xs text-muted-foreground">Review pending and approved members.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2"><ApprovalsPanel /></div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default SettingsPage;
