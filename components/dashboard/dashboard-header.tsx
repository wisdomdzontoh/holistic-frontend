'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut,
  Grid3X3,
  Search,
  Settings,
  User,
  ChevronDown,
  Wifi,
  WifiOff,
  Menu,
  X,
  BarChart3,
  FileText,
  Target,
  Home
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
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, description: 'Main dashboard overview' },
    { name: 'Holistic Assessment', path: '/dashboard/assessment', icon: FileText, description: 'Assessment management' },
    { name: 'Analysis', path: '/dashboard/analysis', icon: BarChart3, description: 'Data analysis and reports' },
    { name: 'Indicator Definition', path: '/dashboard/indicators', icon: Target, description: 'Define and manage indicators' }
  ];

  const filteredNavigationItems = navigationItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length > 0);
  };

  const handleSearchItemClick = (path: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    // Navigate to the selected page
    window.location.href = path;
  };

  return (
    <>
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 border-b border-blue-800 shadow-lg sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Brand */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:text-blue-200 hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Logo */}
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl border-2 border-blue-300">
                  <Image
                    src="/images/coat-of-arms.png"
                    alt="Ghana Coat of Arms"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-white font-sans">Holistic Assessment</h1>
                  <p className="text-xs text-blue-200 font-sans">Health Facility Dashboard</p>
                </div>
              </div>
            </div>

            {/* Center - Search Bar */}
            <div className="flex-1 max-w-lg mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search navigation pages..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 bg-white/10 border-white/20 focus:bg-white focus:border-blue-400 focus:ring-blue-400 rounded-xl font-sans text-white placeholder-gray-300"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-50">
                    {filteredNavigationItems.length > 0 ? (
                      filteredNavigationItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => handleSearchItemClick(item.path)}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <IconComponent className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 font-sans">{item.name}</p>
                              <p className="text-sm text-gray-500 font-sans">{item.description}</p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-gray-500 font-sans">
                        No navigation items found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isOnline 
                    ? 'text-green-300 bg-green-500/20 border border-green-400/30' 
                    : 'text-red-300 bg-red-500/20 border border-red-400/30'
                }`}>
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span className="hidden lg:inline">{isOnline ? 'Connected' : 'Offline'}</span>
                </div>
              </div>

              {/* Time Display */}
              <div className="hidden lg:flex items-center text-sm text-blue-200 font-mono bg-white/10 px-3 py-1.5 rounded-lg">
                {getCurrentTime()}
              </div>

              {/* Apps Grid */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-blue-200 hover:bg-white/10 h-9 w-9 p-0"
                onClick={() => setIsNavigationModalOpen(true)}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 text-white hover:text-blue-200 hover:bg-white/10 h-9 px-3 rounded-lg"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-white text-blue-900 text-xs font-semibold">
                        {getUserInitials(user?.dhis2_username || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium font-sans">{user?.dhis2_username || 'User'}</p>
                      <p className="text-xs text-blue-200 font-sans">Administrator</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-blue-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {getUserInitials(user?.dhis2_username || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 font-sans">{user?.dhis2_username || 'User'}</p>
                        <p className="text-sm text-gray-500 font-sans">Administrator</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-3 cursor-pointer hover:bg-gray-50">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-sans">Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-3 cursor-pointer hover:bg-gray-50">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-sans">Preferences</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="p-3 cursor-pointer hover:bg-red-50 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-sans">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search navigation pages..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 bg-white/10 border-white/20 focus:bg-white focus:border-blue-400 focus:ring-blue-400 rounded-xl font-sans text-white placeholder-gray-300"
              />
              
              {/* Mobile Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-50">
                  {filteredNavigationItems.length > 0 ? (
                    filteredNavigationItems.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleSearchItemClick(item.path)}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <IconComponent className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900 font-sans">{item.name}</p>
                            <p className="text-sm text-gray-500 font-sans">{item.description}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-gray-500 font-sans">
                      No navigation items found
                    </div>
                  )}
                </div>
              )}
            </div>
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