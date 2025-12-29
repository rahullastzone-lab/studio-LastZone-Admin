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

      <BonusSettingsForm />
    </div>
  );
}
