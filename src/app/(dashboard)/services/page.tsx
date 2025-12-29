'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Service = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

const initialServices: Service[] = [
  {
    id: 'service1',
    name: 'Push Notifications',
    description: 'Send notifications to users.',
    enabled: true,
  },
  {
    id: 'service2',
    name: 'In-App Chat',
    description: 'Allow users to chat with each other.',
    enabled: false,
  },
  {
    id: 'service3',
    name: 'AI Anomaly Detection',
    description: 'Detect cheating using AI.',
    enabled: true,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const { toast } = useToast();

  const handleToggleChange = (serviceId: string, checked: boolean) => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId ? { ...service, enabled: checked } : service
      )
    );
  };

  const handleSaveChanges = () => {
    // In a real app, you'd save this to your backend.
    console.log('Saving services state:', services);
    toast({
      title: 'Services Updated',
      description: 'Your feature flag settings have been saved.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Services & Integrations"
        description="Manage third-party services and feature flags."
      />
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Enable or disable features globally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <Label
                  htmlFor={`switch-${service.id}`}
                  className="text-base font-medium"
                >
                  {service.name}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
              <Switch
                id={`switch-${service.id}`}
                checked={service.enabled}
                onCheckedChange={(checked) =>
                  handleToggleChange(service.id, checked)
                }
              />
            </div>
          ))}
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
