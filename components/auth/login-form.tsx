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
    <div className="min-h-screen flex bg-gray-200">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-200 px-8 py-12">
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
              <h1 className="text-2xl font-bold text-gray-900">HOLISTIC ASSESSMENT</h1>
              <p className="text-sm text-gray-600">Health Facility Assessment Tool</p>
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Enter your DHIS2 credentials to access your assessment dashboard</p>
          </div>

          {/* Login Form */}
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Username *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your DHIS2 username"
                            disabled={isLoading}
                            className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
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
                        <FormLabel className="text-sm font-medium text-gray-700">Password *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            disabled={isLoading}
                            className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instanceUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">DHIS2 Instance URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://your-dhis2-instance.org/dhims"
                            disabled={isLoading}
                            className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          Leave empty to use the default DHIS2 instance
                        </p>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-white font-medium"
                    style={{ backgroundColor: '#154360' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Login'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Designed by{' '}
              <a
                href="https://wisdomdzontoh.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Wisdom Dzontoh
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Dashboard Preview */}
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: '#154360' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-blue-300 rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 bg-blue-400 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-300 rounded-full"></div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative z-10 flex items-center justify-center h-full px-8">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Assessment Dashboard</h3>
                <p className="text-sm text-gray-600">Performance Overview</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button className="flex-1 py-2 px-3 text-xs font-medium bg-white rounded-md shadow-sm text-gray-900">
                  Q4-2024
                </button>
                <button className="flex-1 py-2 px-3 text-xs font-medium text-gray-600 hover:text-gray-900">
                  Q3-2024
                </button>
                <button className="flex-1 py-2 px-3 text-xs font-medium text-gray-600 hover:text-gray-900">
                  Q2-2024
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Total Indicators</p>
                      <p className="text-lg font-bold text-gray-900">156</p>
                    </div>
                    <div className="text-green-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">+12% from Q3</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Avg Score</p>
                      <p className="text-lg font-bold text-gray-900">4.2</p>
                    </div>
                    <div className="text-blue-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">+0.3 from Q3</p>
                </div>
              </div>

              {/* Performance Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Highly Performing</span>
                  <span className="text-sm font-medium text-green-600">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Moderately Performing</span>
                  <span className="text-sm font-medium text-blue-600">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Underperforming</span>
                  <span className="text-sm font-medium text-orange-600">23%</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full py-2 px-4 text-white text-sm font-medium rounded-md" style={{ backgroundColor: '#2E86AB' }}>
                  View Full Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Text */}
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-white text-2xl font-bold leading-tight">
            Making holistic assessment<br />
            easy, seamlessly and efficiently
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-2 left-8 right-8">
          <p className="text-white text-xs text-center opacity-80">
            Designed by{' '}
            <a
              href="https://wisdomdzontoh.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-200 underline"
            >
              Wisdom Dzontoh
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 