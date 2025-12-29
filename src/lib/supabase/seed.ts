import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { mockUsers, mockTournaments, mockTransactions, mockWithdrawals, mockSubscriptions } from '../data';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using Anon key for simplicity assuming strict RLS is off or allows insert

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log('🌱 Starting seed...');

    // 1. Seed Profiles
    console.log(`Inserting ${mockUsers.length} profiles...`);
    const { error: usersError } = await supabase.from('profiles').upsert(
        mockUsers.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            phone: u.phone,
            avatar_url: u.avatarUrl,
            wallet_balance: u.walletBalance,
            is_admin: u.isAdmin,
            status: u.status,
        }))
    );
    if (usersError) console.error('Error seeding profiles:', usersError.message);
    else console.log('✅ Profiles seeded.');

    // 2. Seed Tournaments
    console.log(`Inserting ${mockTournaments.length} tournaments...`);
    const { error: tourneyError } = await supabase.from('tournaments').upsert(
        mockTournaments.map(t => ({
            id: t.id,
            name: t.name,
            game_type: t.game_type,
            map: t.map,
            mode: t.mode,
            entry_fee: t.entry_fee,
            prize_pool: t.prize_pool,
            per_kill: t.per_kill,
            start_time: t.start_time,
            status: t.status,
        }))
    );
    if (tourneyError) console.error('Error seeding tournaments:', tourneyError.message);
    else console.log('✅ Tournaments seeded.');

    // 3. Seed Transactions
    console.log(`Inserting ${mockTransactions.length} transactions...`);
    const { error: txnError } = await supabase.from('transactions').upsert(
        mockTransactions.map(t => ({
            id: t.id,
            user_id: t.user_id,
            username: t.username,
            amount: t.amount,
            type: t.type,
            status: t.status,
            created_at: t.created_at,
        }))
    );
    if (txnError) console.error('Error seeding transactions:', txnError.message);
    else console.log('✅ Transactions seeded.');

    // 4. Seed Withdrawals
    console.log(`Inserting ${mockWithdrawals.length} withdrawals...`);
    const { error: wdError } = await supabase.from('withdrawals').upsert(
        mockWithdrawals.map(w => ({
            id: w.id,
            user_id: w.user_id,
            username: w.username,
            amount: w.amount,
            upi_id: w.upi_id,
            status: w.status,
        }))
    );
    if (wdError) console.error('Error seeding withdrawals:', wdError.message);
    else console.log('✅ Withdrawals seeded.');

    // 5. Seed Subscriptions
    console.log(`Inserting ${mockSubscriptions.length} subscriptions...`);
    const { error: subError } = await supabase.from('notification_subscriptions').upsert(
        mockSubscriptions.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            whatsapp_number: s.whatsappNumber,
            interest: s.interest,
            created_at: s.createdAt,
        }))
    );
    if (subError) console.error('Error seeding subscriptions:', subError.message);
    else console.log('✅ Subscriptions seeded.');

    console.log('✨ Seed completed!');
}

seedData();
