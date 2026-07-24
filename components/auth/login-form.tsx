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
    <div className="min-h-screen flex bg-gradient-to-br from-white to-surface-muted">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 shrink-0">
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
              <h1 className="text-2xl font-semibold tracking-tight text-brand-navy" style={{ fontFamily: 'var(--font-display)' }}>
                Holistic Assessment
              </h1>
              <p className="text-sm text-ink-muted">Health Facility Assessment Tool</p>
            </div>
          </div>

          {/* Login Card */}
          <div>
            <p className="text-sm text-ink-muted mb-4">Sign in with your DHIMS2 account to continue</p>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-ink">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter username"
                            disabled={isLoading}
                            className="h-11 border-gray-200 focus-visible:border-brand-teal focus-visible:ring-brand-teal/30"
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
                        <FormLabel className="text-sm font-medium text-ink">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter password"
                              disabled={isLoading}
                              className="h-11 border-gray-200 pr-10 focus-visible:border-brand-teal focus-visible:ring-brand-teal/30"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink-muted"
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
                    className="w-full h-11 text-white font-medium bg-brand-navy hover:bg-brand-navy-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-xs text-ink-muted">
              Terms of Service and Privacy Policy
            </p>
            <p className="text-xs text-ink-muted">
              Copyright ©2025 Holistic Assessment Tool
            </p>
            <p className="text-xs text-ink-muted">
              <a href="https://wisdomdzontoh.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy underline">
                Designed by Wisdom Dzontoh
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Decorative brand panel */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-navy-dark hidden lg:flex items-center justify-center">
        {/* Abstract layered rings motif - no fabricated data, purely decorative */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full border border-white/10" />
          <div className="absolute -top-10 -right-10 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute bottom-[-6rem] left-[-6rem] w-96 h-96 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="absolute top-1/3 left-[-4rem] w-64 h-64 rounded-full bg-brand-green/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-md px-12 text-center">
          <div className="mx-auto mb-8 w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Every indicator,<br />scored consistently.
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Track health facility performance against national targets, with
            scoring built on the same methodology across every district.
          </p>
        </div>
      </div>
    </div>
  );
}