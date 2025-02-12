'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    {
      label: 'Contains a special character',
      test: (p: string) => /[!@#$%^&*]/.test(p),
    },
    {
      label: 'Contains uppercase letter',
      test: (p: string) => /[A-Z]/.test(p),
    },
    {
      label: 'Contains lowercase letter',
      test: (p: string) => /[a-z]/.test(p),
    },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('You must accept the terms of service');
      return;
    }

    // Check if all password requirements are met
    const allRequirementsMet = passwordRequirements.every((req) =>
      req.test(password)
    );
    if (!allRequirementsMet) {
      setError('Please ensure all password requirements are met');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Add AWS Cognito sign up logic here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
      router.push('/auth/verify-email');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">
          Create an account
        </h1>
        <p className="text-sm text-theme-secondary">
          Enter your details below to create your account
        </p>
      </div>

      <Card className="p-6 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                required
                disabled={isLoading}
              />

              <AnimatePresence>
                {(showPasswordRequirements || password.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {passwordRequirements.map((req, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center text-sm"
                      >
                        {req.test(password) ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        <span
                          className={
                            req.test(password)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {req.label}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="rounded border-theme-accent-alpha/20"
              />
              <Label htmlFor="terms" className="text-sm">
                I accept the{' '}
                <Link
                  href="/terms"
                  className="text-theme-primary hover:underline"
                >
                  terms of service
                </Link>
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-background-med hover:bg-theme-primary-alpha/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-theme-accent-alpha/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-theme-secondary">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </form>
      </Card>

      <p className="px-8 text-center text-sm text-theme-secondary">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="underline underline-offset-4 hover:text-theme-primary"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
