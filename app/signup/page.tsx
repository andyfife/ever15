'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const router = useRouter();

  // Step 1: Sign up form
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState(''); // optional – depends on your Cognito config

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle initial sign-up
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: name || undefined, // optional
            // add more attributes if needed (phone_number, etc.)
          },
        },
      });

      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  // Handle confirmation code
  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code.trim(),
      });

      // Auto sign-in after successful confirmation (optional but nice UX)
      await signIn({
        username: email,
        password,
      });

      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid confirmation code');
    } finally {
      setLoading(false);
    }
  }

  // Resend confirmation code
  async function resendCode() {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email },
        },
      });
      alert('Confirmation code resent!');
    } catch (err: any) {
      setError(err.message || 'Could not resend code');
    }
  }

  return (
    <div className={cn('flex flex-col gap-6 max-w-md mx-auto mt-10')}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {step === 'signup' ? 'Create an account' : 'Check your email'}
          </CardTitle>
          <CardDescription>
            {step === 'signup'
              ? 'Sign up with your email below'
              : `We sent a verification code to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 1: Sign Up Form */}
          {step === 'signup' && (
            <form onSubmit={handleSignUp}>
              <FieldGroup>
                {error && (
                  <p className="text-sm text-red-600 text-center mb-4">
                    {error}
                  </p>
                )}

                <Field>
                  <FieldLabel htmlFor="name">Name (optional)</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <FieldDescription className="text-xs">
                    Minimum 8 characters
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </Field>

                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign up'}
                  </Button>
                  <FieldDescription className="text-center mt-4">
                    Already have an account?{' '}
                    <a href="/login" className="underline">
                      Log in
                    </a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}

          {/* Step 2: Confirmation Code */}
          {step === 'confirm' && (
            <form onSubmit={handleConfirm}>
              <FieldGroup>
                {error && (
                  <p className="text-sm text-red-600 text-center mb-4">
                    {error}
                  </p>
                )}

                <Field>
                  <FieldLabel htmlFor="code">Verification code</FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoFocus
                  />
                  <FieldDescription>
                    Check your email for the 6-digit code
                  </FieldDescription>
                </Field>

                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Verifying...' : 'Confirm Sign Up'}
                  </Button>
                </Field>

                <Field>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resendCode}
                    disabled={loading}
                  >
                    Resend code
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-sm text-muted-foreground">
        By signing up, you agree to our{' '}
        <a href="/terms" className="underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}
