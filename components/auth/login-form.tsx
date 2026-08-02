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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-navy to-brand-navy-dark">
      {/* Header bar */}
      <header className="flex items-center justify-between gap-4 flex-wrap px-6 py-8 md:px-12">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden ring-1 ring-white/20">
            <Image
              src="/images/coat-of-arms.png"
              alt="Ghana Coat of Arms"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Holistic Assessment
            </h1>
            <p className="text-sm text-white/70">Health Facility Assessment Tool</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </header>

      {/* Centered login card */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white shadow-2xl p-8">
            <h3 className="text-xl font-semibold text-ink mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Log in
            </h3>
            <p className="text-sm text-ink-muted mb-6">Sign in with your DHIMS2 credentials to continue</p>
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
                          placeholder="Enter your DHIMS2 username"
                          disabled={isLoading}
                          autoFocus
                          className="h-11 bg-brand-navy/[0.04] border-transparent focus-visible:bg-white focus-visible:border-brand-teal focus-visible:ring-brand-teal/30"
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
                            placeholder="Enter your DHIMS2 password"
                            disabled={isLoading}
                            className="h-11 bg-brand-navy/[0.04] border-transparent pr-10 focus-visible:bg-white focus-visible:border-brand-teal focus-visible:ring-brand-teal/30"
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
                  {isLoading ? 'Signing in...' : 'Log in'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap px-6 py-4 md:px-12 border-t border-white/10">
        <span className="text-xs text-white/70">
          <a href="https://wisdomdzontoh.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2">
            Designed by Wisdom Dzontoh
          </a>
          <span className="mx-2 text-white/30">|</span>
          Copyright ©2025 Holistic Assessment Tool
        </span>
        <span className="text-xs text-white/70">Terms of Service and Privacy Policy</span>
      </footer>
    </div>
  );
}