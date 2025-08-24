'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LogOut,
  Grid3X3,
  Mail,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavigationModal } from './navigation-modal';

interface DashboardHeaderProps {
  user: any;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { logout } = useAuth();
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);

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
    <>
      <header className="text-white shadow-lg border-b" style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="relative w-10 h-10">
              <Image
                src="/images/coat-of-arms.png"
                alt="Ghana Coat of Arms"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-lg font-semibold tracking-wide">HOLISTIC ASSESSMENT - Dashboard</h1>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-3">
            {/* Online status */}
                         <div className="flex items-center space-x-2 text-green-300 bg-[#1E8449]/20 px-3 py-1 rounded-full">
               <div className="w-2 h-2 bg-[#1E8449] rounded-full"></div>
               <span className="text-sm font-medium">Online</span>
             </div>

            {/* Mail icon */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <Mail className="h-4 w-4" />
            </Button>

            {/* Navigation Grid Icon (Apps) */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
              onClick={() => setIsNavigationModalOpen(true)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>

            {/* User initials */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 h-8 px-2">
                  <span className="text-sm font-semibold">
                    {getUserInitials(user?.dhis2_username || 'User')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-semibold">
                  {user?.dhis2_username || 'User'}
                </DropdownMenuLabel>
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

      {/* Navigation Modal */}
      <NavigationModal 
        isOpen={isNavigationModalOpen} 
        onClose={() => setIsNavigationModalOpen(false)} 
      />
    </>
  );
} 