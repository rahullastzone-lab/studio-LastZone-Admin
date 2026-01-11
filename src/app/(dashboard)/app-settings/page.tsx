'use client';

import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { BonusSettingsForm } from '@/components/settings/bonus-settings-form';

export default function AppSettingsPage() {
  const { toast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [appName, setAppName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Payment State
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');

  // Social Media State
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');


  // Branding State
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;

      if (data) {
        data.forEach(setting => {
          if (setting.setting_key === 'app_name') setAppName(setting.setting_value);
          if (setting.setting_key === 'support_email') setSupportEmail(setting.setting_value);
          if (setting.setting_key === 'maintenance_mode') setMaintenanceMode(setting.setting_value === 'true');

          // Payment Settings
          if (setting.setting_key === 'razorpay_key_id') setRazorpayKeyId(setting.setting_value);
          if (setting.setting_key === 'razorpay_key_secret') setRazorpayKeySecret(setting.setting_value);

          // Social Media
          if (setting.setting_key === 'social_instagram') setInstagramUrl(setting.setting_value);
          if (setting.setting_key === 'social_facebook') setFacebookUrl(setting.setting_value);
          if (setting.setting_key === 'social_twitter') setTwitterUrl(setting.setting_value);
          if (setting.setting_key === 'social_youtube') setYoutubeUrl(setting.setting_value);

          if (setting.setting_key === 'social_discord') setDiscordUrl(setting.setting_value);

          // Branding
          if (setting.setting_key === 'logo_header') setHeaderLogoUrl(setting.setting_value);
          if (setting.setting_key === 'logo_footer') setFooterLogoUrl(setting.setting_value);
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching settings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updates = [
        { setting_key: 'app_name', setting_value: appName, description: 'Global Application Name' },
        { setting_key: 'support_email', setting_value: supportEmail, description: 'Contact Email for Support' },
        { setting_key: 'maintenance_mode', setting_value: String(maintenanceMode), description: 'Enable/Disable App Access' },

        // Payment Settings
        { setting_key: 'razorpay_key_id', setting_value: razorpayKeyId, description: 'Razorpay API Key ID (Public)' },
        { setting_key: 'razorpay_key_secret', setting_value: razorpayKeySecret, description: 'Razorpay API Key Secret (Private)' },

        // Social Media
        { setting_key: 'social_instagram', setting_value: instagramUrl, description: 'Instagram URL' },
        { setting_key: 'social_facebook', setting_value: facebookUrl, description: 'Facebook URL' },
        { setting_key: 'social_twitter', setting_value: twitterUrl, description: 'Twitter/X URL' },
        { setting_key: 'social_youtube', setting_value: youtubeUrl, description: 'YouTube URL' },

        { setting_key: 'social_discord', setting_value: discordUrl, description: 'Discord URL' },

        // Branding
        { setting_key: 'logo_header', setting_value: headerLogoUrl, description: 'Header Logo URL' },
        { setting_key: 'logo_footer', setting_value: footerLogoUrl, description: 'Footer Logo URL' },
      ];

      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your application settings have been updated.',
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="App Settings"
        description="Manage global application settings."
      />
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update essential app settings here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="appName">App Name</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. LastZone Esports"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="e.g. support@lastzone.gg"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings (Razorpay)</CardTitle>
          <CardDescription>Configure your Razorpay API keys for Payin/Payout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
            <Input
              id="razorpayKeyId"
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              placeholder="rzp_test_..."
              type="password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
            <Input
              id="razorpayKeySecret"
              value={razorpayKeySecret}
              onChange={(e) => setRazorpayKeySecret(e.target.value)}
              placeholder="Enter your secret"
              type="password"
            />
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Update your website's logos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="headerLogo">Header Logo URL</Label>
            <Input
              id="headerLogo"
              value={headerLogoUrl}
              onChange={(e) => setHeaderLogoUrl(e.target.value)}
              placeholder="https://.../logo.png"
            />
            <p className="text-[0.8rem] text-muted-foreground">Recommended height: 40px - 60px</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="footerLogo">Footer Logo URL</Label>
            <Input
              id="footerLogo"
              value={footerLogoUrl}
              onChange={(e) => setFooterLogoUrl(e.target.value)}
              placeholder="https://.../footer-logo.png"
            />
            <p className="text-[0.8rem] text-muted-foreground">Recommended height: 40px - 60px</p>
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Manage your social media presence links here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input
              id="instagram"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input
              id="facebook"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="twitter">Twitter / X URL</Label>
            <Input
              id="twitter"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="youtube">YouTube URL</Label>
            <Input
              id="youtube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discord">Discord URL</Label>
            <Input
              id="discord"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              placeholder="https://discord.gg/..."
            />
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      <BonusSettingsForm />
    </div>
  );
}
