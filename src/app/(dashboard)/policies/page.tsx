'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

type PolicyType = 'privacy_policy' | 'terms_conditions' | 'refund_policy';

interface PolicyData {
  id?: string;
  type: PolicyType;
  title: string;
  content: string;
}

export default function PoliciesPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [policies, setPolicies] = useState<Record<PolicyType, PolicyData>>({
    privacy_policy: { type: 'privacy_policy', title: 'Privacy Policy', content: '' },
    terms_conditions: { type: 'terms_conditions', title: 'Terms & Conditions', content: '' },
    refund_policy: { type: 'refund_policy', title: 'Refund Policy', content: '' },
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('policies')
      .select('*');

    if (error) {
      console.error('Error fetching policies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to find policies.',
      });
    } else {
      if (data && data.length > 0) {
        const newPolicies = { ...policies };
        data.forEach((p: any) => {
          if (p.type in newPolicies) {
            newPolicies[p.type as PolicyType] = p;
          }
        });
        setPolicies(newPolicies);
      }
    }
    setLoading(false);
  };

  const handleContentChange = (type: PolicyType, content: string) => {
    setPolicies(prev => ({
      ...prev,
      [type]: { ...prev[type], content }
    }));
  };

  const handleSave = async (type: PolicyType) => {
    const policy = policies[type];

    try {
      const payload = {
        type: policy.type,
        title: policy.title,
        content: policy.content,
        ...(policy.id ? { id: policy.id } : {})
      };

      const { data, error } = await supabase
        .from('policies')
        .upsert(payload, { onConflict: 'type' })
        .select()
        .single();

      if (error) throw error;

      setPolicies(prev => ({
        ...prev,
        [type]: data
      }));

      toast({
        title: 'Policy Saved',
        description: `${policy.title} has been successfully updated.`,
      });
    } catch (error: any) {
      console.error('Error saving policy:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save policy.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Policies Management"
        description="Update public legal documents for the website."
      />

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading policies...
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="privacy_policy">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="privacy_policy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms_conditions">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="refund_policy">Refund Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy_policy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>How you handle user data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={policies.privacy_policy.content}
                  onChange={(e) => handleContentChange('privacy_policy', e.target.value)}
                  rows={20}
                  placeholder="Enter privacy policy markdown or text here..."
                />
                <Button onClick={() => handleSave('privacy_policy')}>Save Privacy Policy</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms_conditions">
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>Rules and regulations for using the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={policies.terms_conditions.content}
                  onChange={(e) => handleContentChange('terms_conditions', e.target.value)}
                  rows={20}
                  placeholder="Enter terms and conditions here..."
                />
                <Button onClick={() => handleSave('terms_conditions')}>Save Terms</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refund_policy">
            <Card>
              <CardHeader>
                <CardTitle>Refund Policy</CardTitle>
                <CardDescription>Conditions for returning funds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={policies.refund_policy.content}
                  onChange={(e) => handleContentChange('refund_policy', e.target.value)}
                  rows={20}
                  placeholder="Enter refund policy here..."
                />
                <Button onClick={() => handleSave('refund_policy')}>Save Refund Policy</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
