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
  const [zapupiToken, setZapupiToken] = useState('');
  const [zapupiSecret, setZapupiSecret] = useState('');

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
          if (setting.key === 'app_name') setAppName(setting.value);
          if (setting.key === 'support_email') setSupportEmail(setting.value);
          if (setting.key === 'maintenance_mode') setMaintenanceMode(setting.value === 'true');

          // Payment Settings
          if (setting.key === 'ZAPUPI_TOKEN_KEY') setZapupiToken(setting.value);
          if (setting.key === 'ZAPUPI_SECRET_KEY') setZapupiSecret(setting.value);

          // Social Media
          if (setting.key === 'social_instagram') setInstagramUrl(setting.value);
          if (setting.key === 'social_facebook') setFacebookUrl(setting.value);
          if (setting.key === 'social_twitter') setTwitterUrl(setting.value);
          if (setting.key === 'social_youtube') setYoutubeUrl(setting.value);

          if (setting.key === 'social_discord') setDiscordUrl(setting.value);

          // Branding
          if (setting.key === 'logo_header') setHeaderLogoUrl(setting.value);
          if (setting.key === 'logo_footer') setFooterLogoUrl(setting.value);
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
        { key: 'app_name', value: appName, description: 'Global Application Name' },
        { key: 'support_email', value: supportEmail, description: 'Contact Email for Support' },
        { key: 'maintenance_mode', value: String(maintenanceMode), description: 'Enable/Disable App Access' },

        // Payment Settings
        { key: 'ZAPUPI_TOKEN_KEY', value: zapupiToken, description: 'ZapUPI Token Key' },
        { key: 'ZAPUPI_SECRET_KEY', value: zapupiSecret, description: 'ZapUPI Secret Key' },

        // Social Media
        { key: 'social_instagram', value: instagramUrl, description: 'Instagram URL' },
        { key: 'social_facebook', value: facebookUrl, description: 'Facebook URL' },
        { key: 'social_twitter', value: twitterUrl, description: 'Twitter/X URL' },
        { key: 'social_youtube', value: youtubeUrl, description: 'YouTube URL' },

        { key: 'social_discord', value: discordUrl, description: 'Discord URL' },

        // Branding
        { key: 'logo_header', value: headerLogoUrl, description: 'Header Logo URL' },
        { key: 'logo_footer', value: footerLogoUrl, description: 'Footer Logo URL' },
      ];

      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });

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
          <CardTitle>Payment Settings (ZapUPI)</CardTitle>
          <CardDescription>Configure your ZapUPI API keys for Payin/Payout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="zapupiToken">ZapUPI Token Key</Label>
            <Input
              id="zapupiToken"
              value={zapupiToken}
              onChange={(e) => setZapupiToken(e.target.value)}
              placeholder="Enter ZapUPI Token"
              type="password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="zapupiSecret">ZapUPI Secret Key</Label>
            <Input
              id="zapupiSecret"
              value={zapupiSecret}
              onChange={(e) => setZapupiSecret(e.target.value)}
              placeholder="Enter ZapUPI Secret"
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
