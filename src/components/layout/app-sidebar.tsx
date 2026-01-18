'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Wallet,
  ImageIcon,
  Swords,
  Settings,
  HelpCircle,
  Gamepad2,
  Store,
  FileText,
  UserPlus,
  Briefcase,
  MonitorPlay,
} from 'lucide-react';

const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tournaments', label: 'Tournaments', icon: Trophy },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/financials', label: 'Financials', icon: Wallet },
    { href: '/banners', label: 'Banners', icon: ImageIcon },
    { href: '/app-settings', label: 'App Settings', icon: Settings },
    { href: '/faqs', label: 'FAQs', icon: HelpCircle },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/market-items', label: 'Market Items', icon: Store },
    { href: '/policies', label: 'Policies', icon: FileText },
    { href: '/registrations', label: 'Registered Players', icon: Users },
    { href: '/notify-subscribers', label: 'Notify Subscribers', icon: UserPlus },
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/streams', label: 'Live Streams', icon: MonitorPlay },
  ];

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Swords className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-xl font-bold text-primary">
            LastZone HQ
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
};

export default AppSidebar;
