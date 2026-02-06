'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Separator } from '@/components/ui/separator';

export function BonusSettingsForm() {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Signup Bonuses
    const [signupBonusDefault, setSignupBonusDefault] = useState('25');
    const [signupBonusReferralUser, setSignupBonusReferralUser] = useState('50');
    const [signupBonusReferrer, setSignupBonusReferrer] = useState('50');

    // Match Bonus Rules
    const [bonusPercentClassic, setBonusPercentClassic] = useState('20');
    const [bonusPercentTdm, setBonusPercentTdm] = useState('5');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')
                .in('key', [
                    'signup_bonus_default',
                    'signup_bonus_referral_user',
                    'signup_bonus_referral_referrer',
                    'bonus_percent_classic',
                    'bonus_percent_tdm'
                ]);

            if (error) throw error;

            if (data) {
                data.forEach(setting => {
                    switch (setting.key) {
                        case 'signup_bonus_default': setSignupBonusDefault(setting.value); break;
                        case 'signup_bonus_referral_user': setSignupBonusReferralUser(setting.value); break;
                        case 'signup_bonus_referral_referrer': setSignupBonusReferrer(setting.value); break;
                        case 'bonus_percent_classic': setBonusPercentClassic(setting.value); break;
                        case 'bonus_percent_tdm': setBonusPercentTdm(setting.value); break;
                    }
                });
            }
        } catch (error: any) {
            console.error('Error fetching bonus settings:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            toast({
                title: "Error fetching bonus settings",
                description: error.message || "Unknown error occurred",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setSubmitting(true);
        try {
            const updates = [
                { key: 'signup_bonus_default', value: signupBonusDefault, description: 'Bonus for new user without referral' },
                { key: 'signup_bonus_referral_user', value: signupBonusReferralUser, description: 'Bonus for new user WITH referral' },
                { key: 'signup_bonus_referral_referrer', value: signupBonusReferrer, description: 'Bonus for the referrer' },
                { key: 'bonus_percent_classic', value: bonusPercentClassic, description: 'Max bonus % usable in Classic matches' },
                { key: 'bonus_percent_tdm', value: bonusPercentTdm, description: 'Max bonus % usable in TDM matches' },
            ];

            const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });

            if (error) throw error;

            toast({
                title: 'Bonus Settings Saved',
                description: 'Referral and bonus rules have been updated.',
            });
        } catch (error: any) {
            toast({
                title: "Error saving settings",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <Card><CardContent className="p-8">Loading bonus settings...</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bonus & Referral Settings</CardTitle>
                <CardDescription>Manage signup bonuses and match fee discount rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Section 1: Referral Logic */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Referral & Signup Bonuses (₹)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="signupBonusDefault">Default Signup Bonus</Label>
                            <Input
                                id="signupBonusDefault"
                                type="number"
                                value={signupBonusDefault}
                                onChange={(e) => setSignupBonusDefault(e.target.value)}
                                placeholder="25"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">For users w/o referral code.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signupBonusReferralUser">Ref. User Bonus</Label>
                            <Input
                                id="signupBonusReferralUser"
                                type="number"
                                value={signupBonusReferralUser}
                                onChange={(e) => setSignupBonusReferralUser(e.target.value)}
                                placeholder="50"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">For users using a referral code.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signupBonusReferrer">Referrer Bonus</Label>
                            <Input
                                id="signupBonusReferrer"
                                type="number"
                                value={signupBonusReferrer}
                                onChange={(e) => setSignupBonusReferrer(e.target.value)}
                                placeholder="50"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">Reward for the referrer.</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Section 2: Game Rules */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Match Bonus Usage Limits (%)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="bonusPercentClassic">Classic Match Usage (%)</Label>
                            <Input
                                id="bonusPercentClassic"
                                type="number"
                                value={bonusPercentClassic}
                                onChange={(e) => setBonusPercentClassic(e.target.value)}
                                placeholder="20"
                                max={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bonusPercentTdm">TDM Match Usage (%)</Label>
                            <Input
                                id="bonusPercentTdm"
                                type="number"
                                value={bonusPercentTdm}
                                onChange={(e) => setBonusPercentTdm(e.target.value)}
                                placeholder="5"
                                max={100}
                            />
                        </div>
                    </div>
                </div>

                <Button onClick={handleSaveChanges} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardContent>
        </Card>
    );
}
