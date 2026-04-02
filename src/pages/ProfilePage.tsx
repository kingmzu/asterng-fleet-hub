import { useState, useRef } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserProfile } from '@/hooks/api';
import { useUpdateProfile, useUploadAvatar, useAvatarUrl } from '@/hooks/api/useProfile';
import { useToast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const { data: profile, isLoading } = useUserProfile();
  const avatarPath = profile?.avatar_url;
  const { data: avatarSignedUrl } = useAvatarUrl(avatarPath);
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: uploading } = useUploadAvatar();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    full_name: string;
    phone_number: string;
    home_address: string;
  } | null>(null);

  // Initialize form from profile
  const currentForm = form ?? {
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    home_address: profile?.home_address || '',
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadAvatar(file);
      await updateProfile({ avatar_url: path });
      toast({ title: 'Avatar updated' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(currentForm);
      setForm(null);
      toast({ title: 'Profile updated successfully' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {avatarSignedUrl ? (
            <img
              src={avatarSignedUrl}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-bold text-primary border-2 border-border">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-foreground">{profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <Input
            value={currentForm.full_name}
            onChange={(e) => setForm({ ...currentForm, full_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Phone Number</label>
          <Input
            value={currentForm.phone_number}
            onChange={(e) => setForm({ ...currentForm, phone_number: e.target.value })}
            placeholder="+234..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Home Address</label>
          <Input
            value={currentForm.home_address}
            onChange={(e) => setForm({ ...currentForm, home_address: e.target.value })}
            placeholder="Enter your address"
          />
        </div>

        <Button onClick={handleSave} disabled={saving || !form} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
