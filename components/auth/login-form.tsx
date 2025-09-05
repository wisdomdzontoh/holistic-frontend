'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/lib/auth-context';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  instanceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      instanceUrl: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // Only pass instanceUrl if it's not empty
      const instanceUrl = data.instanceUrl?.trim() || undefined;
      const result = await login(data.username, data.password, instanceUrl);
      
      if (result.success) {
        toast.success('Login successful!', {
          description: result.message,
        });
        router.push('/dashboard'); // Redirect to dashboard after successful login
      } else {
        toast.error('Login failed', {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
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
              <h1 className="text-3xl font-bold text-black uppercase font-sans">HOLISTIC ASSESSMENT</h1>
              <p className="text-base text-black uppercase font-sans">Health Facility Assessment Tool</p>
            </div>
          </div>

          {/* Login Form with Dashed Border */}
          <div className="text-center">
            <div className="text-base font-medium text-black font-sans">Login With Your DHIMS2 account to continue</div>
          </div>
          <div className="border-2 border-dashed border-black p-6 bg-white">
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-black font-sans">Username *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter username"
                          disabled={isLoading}
                          className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-white font-sans text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-black font-sans">Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter password"
                            disabled={isLoading}
                            className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-white pr-10 font-sans text-base"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <Button
                  type="submit"
                  className="w-full h-12 text-white font-medium bg-black hover:bg-gray-800 font-sans text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Login'}
                </Button>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 font-sans">
              Terms of Service and Privacy Policy
            </p>
            <p className="text-sm text-gray-500 font-sans">
              Copyright ©2025 Holistic Assessment Tool
            </p>
            <p className="text-sm text-gray-500 font-sans">
              <a href="https://wisdomdzontoh.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 underline">
              Designed by Wisdom Dzontoh
              </a>
            </p>
          </div>
         

          {/* Bottom Left Logo */}
          <div className="absolute bottom-4 left-4">
            <div className="w-8 h-8 bg-gray-800 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - App Dashboard Preview */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-indigo-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 bg-cyan-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-300 rounded-full blur-xl"></div>
        </div>

        {/* Main Dashboard Preview */}
        <div className="relative z-10 flex items-center justify-center h-full px-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-sans">Assessment Dashboard</h3>
                <p className="text-sm text-gray-600 font-sans">Real-time Performance Overview</p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-sans font-medium">Total Indicators</p>
                      <p className="text-2xl font-bold text-gray-900 font-sans">156</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-green-600 font-sans font-medium">+12% from last quarter</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-sans font-medium">Avg Score</p>
                      <p className="text-2xl font-bold text-gray-900 font-sans">4.2</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-blue-600 font-sans font-medium">+0.3 improvement</span>
                  </div>
                </div>
              </div>

              {/* Performance Categories */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 font-sans">Performance Distribution</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 font-sans">Highly Performing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-3/5 h-full bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-semibold text-green-600 font-sans">45%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 font-sans">Moderately Performing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 font-sans">32%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 font-sans">Underperforming</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-1/4 h-full bg-orange-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-semibold text-orange-600 font-sans">23%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 font-sans mb-3">Recent Assessments</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-sans">Q4 2024 Assessment</span>
                    <span className="text-green-600 font-sans font-medium">Completed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-sans">Q3 2024 Review</span>
                    <span className="text-blue-600 font-sans font-medium">In Progress</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-sans">Annual Report</span>
                    <span className="text-orange-600 font-sans font-medium">Pending</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        
        
      </div>
      
    </div>
  );
} 