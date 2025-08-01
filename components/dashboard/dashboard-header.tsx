'use client';

import React from 'react';
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
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Logo and Title */}
        <div className="flex items-center space-x-4">
          {/* Ghana Coat of Arms inspired logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">GH</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">HOLISTIC ASSESSMENT</h1>
              <p className="text-blue-200 text-sm">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center space-x-4">
          {/* Online status */}
          <div className="flex items-center space-x-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Online</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="text-white hover:bg-blue-800">
            <Bell className="h-5 w-5" />
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              3
            </span>
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="sm" className="text-white hover:bg-blue-800">
            <Mail className="h-5 w-5" />
          </Button>

          {/* App launcher */}
          <Button variant="ghost" size="sm" className="text-white hover:bg-blue-800">
            <Grid3X3 className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-blue-800">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-700 text-white">
                    {getUserInitials(user?.dhis2_username || 'User')}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium">
                  {user?.dhis2_username || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
              <DropdownMenuItem onClick={handleLogout}>
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