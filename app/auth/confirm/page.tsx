'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [code, setCode] = useState('');
  const email = searchParams.get('username') || '';

  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      router.push('/auth/signup');
    }
  }, [email, router]);

  const handleConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code
      });

      setSuccess('Email confirmed successfully!');
      // Redirect to sign in page after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error: any) {
      console.error('Confirmation error:', error);
      if (error.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please try again.');
      } else if (error.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(error.message || 'Failed to confirm email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await resendSignUpCode({
        username: email
      });
      setSuccess('A new verification code has been sent to your email.');
    } catch (error: any) {
      console.error('Resend code error:', error);
      setError('Failed to resend verification code. Please try again.');
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
        Confirm your email
        </h1>
        <p className="text-sm text-theme-secondary">
        Enter the verification code sent to {email}
        </p>
      </div>
      <Card className="w-full max-w-lg p-8">
     

        <form onSubmit={handleConfirmation} className="mt-8 space-y-6">
          <div className="grid gap-2">
            {/* <Label htmlFor="code">Verification Code</Label> */}
            <Input
              id="code"
              placeholder="Enter verification code"
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={isLoading}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-500"
            >
              {success}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm Email'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={handleResendCode}
            disabled={isLoading}
          >
            Didn&apos;t receive a code? Click to resend
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/auth/signup" className="hover:text-brand underline">
            Back to Sign Up
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}
