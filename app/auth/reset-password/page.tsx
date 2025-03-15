'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { confirmResetPassword } from 'aws-amplify/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get email from URL params
  useEffect(() => {
    const username = searchParams.get('username');
    if (username) {
      setEmail(username);
    }
  }, [searchParams]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (!validatePassword()) {
      return;
    }
    
    setIsLoading(true);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: password,
      });
      
      setSuccess(true);
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      // Handle specific error cases
      switch (error.name) {
        case 'CodeMismatchException':
          setError('Invalid verification code');
          break;
        case 'ExpiredCodeException':
          setError('Verification code has expired');
          break;
        case 'LimitExceededException':
          setError('Too many attempts. Please try again later');
          break;
        case 'InvalidPasswordException':
          setError(error.message || 'Password does not meet requirements');
          break;
        default:
          setError(error.message || 'Failed to reset password. Please try again.');
      }
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
          Reset Password
        </h1>
        <p className="text-sm text-theme-secondary">
          Enter the code sent to your email and create a new password
        </p>
      </div>

      <Card className="p-6 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
        {success ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-theme-primary">Password Reset Successful</h3>
            <p className="text-sm text-center text-theme-secondary">
              Your password has been reset successfully. Redirecting you to login...
            </p>
          </div>
        ) : (
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
                disabled={isLoading || !!searchParams.get('username')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="123456"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                required
                disabled={isLoading}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect="off"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                placeholder="••••••••"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect="off"
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-black/50 hover:bg-black/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className="flex justify-center">
              <Link
                href="/auth/login"
                className="flex items-center text-sm text-theme-primary hover:underline"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </motion.div>
  );
} 