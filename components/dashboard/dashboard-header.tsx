'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell, 
  Mail, 
  Grid3X3, 
  LogOut,
  Settings,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  user: any;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="text-white shadow-lg border-b" style={{ background: 'linear-gradient(to right, #265380, #1e4a6b)' }}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Logo and Title */}
        <div className="flex items-center space-x-4">
          {/* Ghana Coat of Arms Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12">
              <Image
                src="/images/coat-of-arms.png"
                alt="Ghana Coat of Arms"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">HOLISTIC ASSESSMENT</h1>
              <p className="text-sm font-medium" style={{ color: '#b3d9ff' }}>Health Facility Assessment Tool</p>
            </div>
          </div>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center space-x-4">
          {/* Online status */}
          <div className="flex items-center space-x-2 text-green-300 bg-green-900/20 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Online</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="text-white relative" style={{ '--tw-bg-opacity': '0.5' } as React.CSSProperties}>
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="sm" className="text-white">
            <Mail className="h-5 w-5" />
          </Button>

          {/* App launcher */}
          <Button variant="ghost" size="sm" className="text-white">
            <Grid3X3 className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white">
                <Avatar className="h-8 w-8 border-2" style={{ borderColor: '#265380' }}>
                  <AvatarFallback className="text-white font-semibold" style={{ backgroundColor: '#265380' }}>
                    {getUserInitials(user?.dhis2_username || 'User')}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-3 text-sm font-medium">
                  {user?.dhis2_username || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 