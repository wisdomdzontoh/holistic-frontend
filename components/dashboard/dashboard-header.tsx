'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LogOut
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
    <header className="text-white shadow-lg border-b" style={{ backgroundColor: '#154360', borderColor: '#2E86AB' }}>
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
              <p className="text-sm font-medium text-gray-300">Health Facility Assessment Tool</p>
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

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <Avatar className="h-8 w-8 border-2" style={{ borderColor: '#2E86AB' }}>
                  <AvatarFallback className="text-white font-semibold" style={{ backgroundColor: '#2E86AB' }}>
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