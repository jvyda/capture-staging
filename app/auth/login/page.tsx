'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'aws-amplify/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        // Check if there's a redirect URL stored
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        // Clear the stored redirect URL
        sessionStorage.removeItem('redirectUrl');
        // Redirect to the stored URL or dashboard
        router.push(redirectUrl || '/');
      } else {
        // Handle different auth challenges
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_UP':
            router.push(`/auth/confirm?username=${encodeURIComponent(email)}`);
            break;
          case 'RESET_PASSWORD':
            router.push(`/auth/reset-password?username=${encodeURIComponent(email)}`);
            break;
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            router.push(`/auth/new-password?username=${encodeURIComponent(email)}`);
            break;
          default:
            setError('Unexpected authentication state. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      // Handle specific error cases
      switch (error.name) {
        case 'UserNotConfirmedException':
          setError('Email not verified. Please check your email for verification code.');
          setTimeout(() => {
            router.push(`/auth/confirm?username=${encodeURIComponent(email)}`);
          }, 2000);
          break;
        case 'NotAuthorizedException':
          setError('Incorrect email or password');
          break;
        case 'UserNotFoundException':
          setError('No account found with this email');
          break;
        case 'LimitExceededException':
          setError('Too many attempts. Please try again later');
          break;
        default:
          setError(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
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
          Welcome back
        </h1>
        <p className="text-sm text-theme-secondary">
          Enter your email to sign in to your account
        </p>
      </div>

      <Card className="p-6 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="m@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-theme-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              className="rounded border-theme-accent-alpha/20"
            />
            <Label htmlFor="remember" className="text-sm">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-theme-primary hover:bg-theme-primary-alpha/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
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
        Don't have an account?{' '}
        <Link
          href="/auth/signup"
          className="underline underline-offset-4 hover:text-theme-primary"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
