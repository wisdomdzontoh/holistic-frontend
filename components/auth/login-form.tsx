'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InlineNotice } from '@/components/common/inline-notice';
import { useAuth } from '@/lib/auth-context';

const loginSchema = z.object({
  username: z.string().min(1, 'Enter your DHIMS2 username'),
  password: z.string().min(1, 'Enter your password'),
  instanceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login, isAuthenticated, loading: sessionLoading } = useAuth();
  const router = useRouter();

  // Already signed in (e.g. returning with a live session) — go straight in.
  useEffect(() => {
    if (!sessionLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, sessionLoading, router]);

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
    setServerError(null);

    try {
      // Only pass instanceUrl if it's not empty
      const instanceUrl = data.instanceUrl?.trim() || undefined;
      const result = await login(data.username, data.password, instanceUrl);

      if (result.success) {
        toast.success('Signed in', { description: result.message });
        router.push('/dashboard');
      } else {
        setServerError(result.message || "That username and password didn't work. Check them and try again.");
      }
    } catch {
      setServerError("We couldn't reach DHIMS2. Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side — plain dotted canvas */}
      <section className="login-hero hidden min-h-screen flex-col items-center justify-center p-12 lg:flex">
        <div className="w-full max-w-md space-y-6 text-center">
          <Image
            src="/images/coat-of-arms.png"
            alt="Ghana coat of arms"
            width={120}
            height={120}
            className="mx-auto h-28 w-28 object-contain"
            priority
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Holistic Assessment</h1>
            <p className="text-base text-muted-foreground">
              Score health facility performance against national targets, using data straight from DHIMS2.
            </p>
          </div>
        </div>
      </section>

      {/* Sign-in side */}
      <section className="flex min-h-screen flex-col bg-card">
        <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-[440px] space-y-6">
            {/* Compact brand for small screens */}
            <div className="flex items-center gap-3 lg:hidden">
              <Image src="/images/coat-of-arms.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" priority />
              <div>
                <p className="text-lg font-bold text-foreground">Holistic Assessment</p>
                <p className="text-sm text-muted-foreground">Health facility assessment tool</p>
              </div>
            </div>

            <div className="login-card rounded-xl border border-border bg-card p-6">
              <h2 className="mb-1 text-xl font-semibold">Sign in</h2>
              <p className="mb-5 text-sm text-muted-foreground">Use your DHIMS2 username and password.</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} method="post" className="space-y-4" noValidate>
                  {serverError && <InlineNotice tone="error">{serverError}</InlineNotice>}

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            placeholder="e.g. kmensah"
                            disabled={isLoading}
                            autoFocus
                            className="h-10"
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              disabled={isLoading}
                              className="h-10 pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden="true" />
                        Signing in…
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border px-6 py-4 text-xs text-muted-foreground">
          <span>
            ©{new Date().getFullYear()} Holistic Assessment Tool ·{' '}
            <a
              href="https://wisdomdzontoh.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Designed by Wisdom Dzontoh
            </a>
          </span>
          <span>Terms of Service and Privacy Policy</span>
        </footer>
      </section>
    </main>
  );
}
