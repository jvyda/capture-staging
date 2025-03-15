'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { resetPassword } from 'aws-amplify/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { nextStep } = await resetPassword({ username: email });
      
      if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setSuccess(true);
        // Redirect to reset password page after a short delay
        setTimeout(() => {
          router.push(`/auth/reset-password?username=${encodeURIComponent(email)}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      // Handle specific error cases
      switch (error.name) {
        case 'UserNotFoundException':
          setError('No account found with this email');
          break;
        case 'LimitExceededException':
          setError('Too many attempts. Please try again later');
          break;
        default:
          setError(error.message || 'Failed to send reset code. Please try again.');
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
          Forgot Password
        </h1>
        <p className="text-sm text-theme-secondary">
          Enter your email and we'll send you a code to reset your password
        </p>
      </div>

      <Card className="p-6 bg-background backdrop-blur-sm border-theme-accent-alpha/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm">
              Reset code sent! Redirecting you to reset your password...
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
              disabled={isLoading || success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black/50 hover:bg-black/90"
            disabled={isLoading || success}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset code...
              </>
            ) : (
              'Send Reset Code'
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
      </Card>
    </motion.div>
  );
} 