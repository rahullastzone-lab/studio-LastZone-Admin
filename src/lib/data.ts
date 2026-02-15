export type User = {
  id: string;
  username: string;
  email: string;
  phone?: string; // keeping for backward compatibility if needed, but we will prefer mobileNumber
  mobileNumber?: string;
  referralCode?: string;
  avatarUrl?: string;
  walletBalance: number;
  isAdmin: boolean;
  status?: 'Active' | 'Banned';
  instagram_link?: string;
  youtube_link?: string;
  referralCount?: number;
};

export type Tournament = {
  id: string;
  name: string;
  game_type: 'BGMI' | 'FreeFire' | 'COD Mobile';
  map: 'Erangel' | 'Livik' | 'Miramar' | 'Sanhok' | 'TDM' |
  'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | 'Nexterra' | 'Bermuda Remastered' |
  'Isolated' | 'Blackout' | 'Alcatraz' | 'Nuketown' | 'Crash' | 'Crossfire' | 'Standoff' | 'Raid' | 'Summit' | 'Firing Range';
  mode: 'Solo' | 'Duo' | 'Squad';
  entry_fee: number;
  prize_pool: number;
  per_kill: number;
  start_time: string;
  status: 'Open' | 'Closed' | 'Completed';
  joined_count?: number;
  category?: 'Normal' | 'Mega';
  is_coming_soon?: boolean;
};

export type Transaction = {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Refund' | 'Winnings' | 'Entry Fee';
  status: 'Success' | 'Pending' | 'Failed';
  description?: string;
  gateway_order_id?: string;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  upi_id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type NotificationSubscription = {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string;
  interest: string;
  serviceName: string; // The specific service (e.g., 'BGMI UC', 'Mobile Recharge')
  createdAt: string;
};

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    username: 'ShadowStriker',
    email: 'shadow@example.com',
    phone: '123-456-7890',
    avatarUrl: 'user-avatar-1',
    walletBalance: 150.75,
    isAdmin: false,
    status: 'Active',
  },
  {
    id: 'usr_2',
    username: 'Viper',
    email: 'viper@example.com',
    phone: '234-567-8901',
    avatarUrl: 'user-avatar-2',
    walletBalance: 320.5,
    isAdmin: false,
    status: 'Active',
  },
  {
    id: 'usr_3',
    username: 'Phoenix',
    email: 'phoenix@example.com',
    phone: '345-678-9012',
    avatarUrl: 'user-avatar-3',
    walletBalance: 50.0,
    isAdmin: false,
    status: 'Banned',
  },
  {
    id: 'usr_4',
    username: 'Ghost',
    email: 'ghost@example.com',
    phone: '456-789-0123',
    avatarUrl: 'user-avatar-4',
    walletBalance: 890.0,
    isAdmin: false,
    status: 'Active',
  },
];

export const mockTournaments: Tournament[] = [
  {
    id: 'trn_1',
    name: 'BGMI Solo Showdown',
    game_type: 'BGMI',
    map: 'Erangel',
    mode: 'Solo',
    entry_fee: 10,
    prize_pool: 1000,
    per_kill: 1,
    start_time: '2024-08-01T10:00:00.000Z',
    status: 'Open',
  },
  {
    id: 'trn_2',
    name: 'FreeFire Squad Battle',
    game_type: 'FreeFire',
    map: 'Bermuda',
    mode: 'Squad',
    entry_fee: 50,
    prize_pool: 5000,
    per_kill: 5,
    start_time: '2024-08-02T14:00:00.000Z',
    status: 'Open',
  },
  {
    id: 'trn_3',
    name: 'BGMI Duo Conquest',
    game_type: 'BGMI',
    map: 'Livik',
    mode: 'Duo',
    entry_fee: 20,
    prize_pool: 2000,
    per_kill: 2,
    start_time: '2024-08-05T18:00:00.000Z',
    status: 'Closed',
  },
  {
    id: 'trn_4',
    name: 'BGMI Final Zone',
    game_type: 'BGMI',
    map: 'Miramar',
    mode: 'Squad',
    entry_fee: 100,
    prize_pool: 10000,
    per_kill: 10,
    start_time: '2024-07-28T20:00:00.000Z',
    status: 'Completed',
  },
];

const generateMockData = <T>(generator: (index: number) => T, count: number): T[] => {
  return Array.from({ length: count }, (_, i) => generator(i));
};

const userChoices = mockUsers.map(u => ({ username: u.username, id: u.id, email: u.email, phone: u.phone }));
const interests = [
  'BGMI',
  'FreeFire',
  'COD Mobile',
  'BGMI UC',
  'FREE FIRE DIAMONDS', // Testing uppercase
  'COD MOBILE CP',
  'MOBILE RECHARGE',
  'GIFT CARDS',
  'SHOP',
  'In-Game Service',
  'Mega Tournament',
  'BGMI ID Sell',
  'BGMI ID Buy',
  'FreeFire ID Sell',
  'FreeFire ID Buy',
  'COD Mobile ID Sell',
  'COD Mobile ID Buy',
];

export const mockSubscriptions: NotificationSubscription[] = generateMockData((i) => {
  const user = userChoices[i % userChoices.length];
  const baseDate = new Date('2024-07-20T00:00:00.000Z').getTime();
  const randomTimeOffset = Math.random() * 10 * 24 * 60 * 60 * 1000;

  const rawInterest = interests[i % interests.length];
  let category = 'Mega Tournament';

  if (['BGMI UC', 'Free Fire Diamonds', 'COD Mobile CP', 'Mobile Recharge', 'Gift Cards', 'Shop'].includes(rawInterest)) {
    category = 'In-Game Service';
  } else if (rawInterest.includes('ID Sell') || rawInterest.includes('ID Buy')) {
    category = rawInterest; // Marketplace keeps specific category
  } else {
    category = rawInterest;
  }

  return {
    id: `sub_${i + 1}`,
    name: user.username,
    email: user.email,
    whatsappNumber: user.phone || 'N/A',
    interest: category,
    serviceName: rawInterest,
    createdAt: new Date(baseDate + randomTimeOffset).toISOString(),
  };
}, 50);


export const mockWithdrawals: Withdrawal[] = generateMockData((i) => {
  const user = userChoices[i % userChoices.length];
  return {
    id: `wd_${i + 1}`,
    user_id: user.id,
    username: user.username,
    amount: Math.floor(Math.random() * 500) + 10,
    upi_id: `${user.username.toLowerCase()}@upi`,
    status: 'Pending',
  };
}, 150);


export const mockTransactions: Transaction[] = generateMockData((i) => {
  const user = userChoices[i % userChoices.length];
  const types: Transaction['type'][] = ['Deposit', 'Withdrawal', 'Refund', 'Winnings', 'Entry Fee'];
  const statuses: Transaction['status'][] = ['Success', 'Pending', 'Failed'];
  const type = types[i % types.length];
  let amount = Math.floor(Math.random() * 200) + 5;
  if (type === 'Entry Fee' || type === 'Withdrawal') {
    amount = -amount;
  }

  // Use a static base date to avoid hydration issues
  const baseDate = new Date('2024-07-01T00:00:00.000Z').getTime();
  const randomTimeOffset = Math.random() * 30 * 24 * 60 * 60 * 1000;

  return {
    id: `txn_${i + 1}`,
    user_id: user.id,
    username: user.username,
    amount,
    type,
    status: statuses[i % statuses.length],
    created_at: new Date(baseDate + randomTimeOffset).toISOString(),
  };
}, 200);
