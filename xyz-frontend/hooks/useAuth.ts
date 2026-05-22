/**
 * @file hooks/useAuth.ts
 * @description Auth state, auth mutations, and auth form controllers.
 */

import { useCallback, useMemo, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { getWishlistIds } from '../lib/api/wishlist';
import { supabase } from '../lib/supabase';
import {
  completeOAuthSignIn,
  getGoogleOAuthUrl,
  resetPassword,
  signIn,
  signOut as apiSignOut,
  signUp,
} from '../lib/api/users';
import type { User } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<{ error: string | null }>;
}

export interface SignInVariables {
  email: string;
  password: string;
}

export interface SignUpVariables {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  city?: string;
  state?: string;
}

interface SignInErrors {
  email?: string;
  password?: string;
}

interface SignUpErrors {
  fullName?: string;
  phone?: string;
  city?: string;
  state?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface UseSignInReturn
  extends Omit<UseMutationResult<User, Error, SignInVariables>, 'mutate'> {
  email: string;
  password: string;
  errors: SignInErrors;
  formError: string | null;
  isGooglePending: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  submit: () => void;
  signInWithGoogle: () => void;
  mutate: UseMutationResult<User, Error, SignInVariables>['mutate'];
}

export interface UseSignUpReturn
  extends Omit<UseMutationResult<User, Error, SignUpVariables>, 'mutate'> {
  fullName: string;
  phone: string;
  city: string;
  state: string;
  email: string;
  password: string;
  confirmPassword: string;
  errors: SignUpErrors;
  formError: string | null;
  passwordStrength: PasswordStrength;
  setFullName: (value: string) => void;
  setPhone: (value: string) => void;
  setCity: (value: string) => void;
  setState: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  submit: () => void;
  mutate: UseMutationResult<User, Error, SignUpVariables>['mutate'];
}

export interface UseForgotPasswordReturn {
  email: string;
  emailError?: string;
  formError: string | null;
  isPending: boolean;
  isSuccess: boolean;
  setEmail: (value: string) => void;
  submit: () => void;
  resetForm: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) return 'Email is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';

  return undefined;
}

function validateSignInForm(email: string, password: string): SignInErrors {
  const errors: SignInErrors = {};
  const emailError = validateEmail(email);

  if (emailError) errors.email = emailError;
  if (!password) errors.password = 'Password is required.';

  return errors;
}

const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

function validateSignUpForm(
  fullName: string,
  phone: string,
  city: string,
  state: string,
  email: string,
  password: string,
  confirmPassword: string
): SignUpErrors {
  const errors: SignUpErrors = {};
  const emailError = validateEmail(email);

  if (!fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!INDIAN_PHONE_REGEX.test(phone.trim())) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }

  if (!city.trim()) {
    errors.city = 'City is required.';
  }

  if (!state.trim()) {
    errors.state = 'State is required.';
  }

  if (emailError) errors.email = emailError;

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';

  return 'weak';
}

function hydrateWishlist(setWishlist: (packageIds: string[]) => void): void {
  void getWishlistIds().then(({ data }) => {
    if (data) setWishlist(data);
  });
}

function createRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'xyzapp',
    path: 'auth/callback',
  });
}

/**
 * Runs the full Google OAuth flow using Supabase's OAuth URL + WebBrowser.
 *
 * Why WebBrowser.openAuthSessionAsync instead of AuthRequest.promptAsync:
 * - Supabase generates a complete, self-contained OAuth URL (including all
 *   Google params). Wrapping it in AuthRequest would append duplicate params
 *   (client_id, redirect_uri, response_type) that corrupt the URL and cause
 *   Google to immediately reject the session — which surfaces as "cancelled".
 * - openAuthSessionAsync opens the URL as-is in a Chrome Custom Tab (Android)
 *   or SFAuthenticationSession (iOS) and waits for the deep-link redirect back
 *   into the app. This is the pattern Supabase's own docs recommend for RN.
 */
async function runGoogleOAuth(): Promise<User> {
  const redirectUri = createRedirectUri();

  // 1. Ask Supabase for the Google OAuth URL.
  //    We pass an empty string for state — Supabase handles CSRF internally.
  const { data: authUrl, error: urlError } = await getGoogleOAuthUrl(
    redirectUri,
    ''
  );

  if (urlError) throw new Error(urlError);
  if (!authUrl) throw new Error('Google sign in failed to start.');

  // 2. Open the Supabase-generated URL in the system browser.
  //    The browser will redirect back to xyzapp://auth/callback?code=...
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
    preferEphemeralSession: true,
  });

  // User closed the browser without completing sign-in — not an error,
  // just a silent no-op so we don't show a scary error message.
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('__CANCELLED__');
  }

  if (result.type !== 'success') {
    throw new Error('Google sign in did not complete.');
  }

  // 3. Parse the callback URL to extract the code or tokens.
  const callbackUrl = result.url;
  const parsed = new URL(callbackUrl);

  // Supabase PKCE flow returns ?code=...
  // Implicit flow returns #access_token=...&refresh_token=...
  const code = parsed.searchParams.get('code');
  const accessToken =
    parsed.searchParams.get('access_token') ??
    new URLSearchParams(parsed.hash.slice(1)).get('access_token');
  const refreshToken =
    parsed.searchParams.get('refresh_token') ??
    new URLSearchParams(parsed.hash.slice(1)).get('refresh_token');
  const oauthError = parsed.searchParams.get('error');

  if (oauthError) {
    const description =
      parsed.searchParams.get('error_description') ?? oauthError;
    throw new Error(description);
  }

  if (!code && !accessToken) {
    throw new Error('Google sign in failed: no credentials in callback URL.');
  }

  // 4. Exchange the code / tokens with Supabase to get a session.
  const params: Record<string, string> = {};
  if (code) params.code = code;
  if (accessToken) params.access_token = accessToken;
  if (refreshToken) params.refresh_token = refreshToken;

  const { data: user, error } = await completeOAuthSignIn(params);

  if (error) throw new Error(error);
  if (!user) throw new Error('Google sign in failed: no user returned.');

  return user;
}

export function useAuth(): UseAuthReturn {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { mutateAsync } = useSignOut();

  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      await mutateAsync();
      return { error: null };
    } catch (error) {
      return { error: getErrorMessage(error) };
    }
  }, [mutateAsync]);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    signOut,
  };
}

export function useSignIn(): UseSignInReturn {
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  const [email, setEmailValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [errors, setErrors] = useState<SignInErrors>({});

  const mutation = useMutation<User, Error, SignInVariables>({
    mutationFn: async ({ email: nextEmail, password: nextPassword }) => {
      const { data, error } = await signIn(nextEmail, nextPassword);

      if (error) throw new Error(error);
      if (!data) throw new Error('Sign in failed: no user returned.');

      return data;
    },
    onSuccess: (user) => {
      // Must use setSession (not setUser) so authStore.session is populated.
      // getAuthHeader() reads session.access_token — if session is null,
      // every authenticated API call (wishlist, profile update) silently fails.
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(user, session);
        } else {
          setUser(user);
        }
      });
      hydrateWishlist(setWishlist);
    },
  });

  const googleMutation = useMutation<User, Error, void>({
    mutationFn: runGoogleOAuth,
    onSuccess: (user) => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(user, session);
        } else {
          setUser(user);
        }
      });
      hydrateWishlist(setWishlist);
    },
  });

  const setEmail = useCallback(
    (value: string) => {
      setEmailValue(value);
      setErrors((current) => ({ ...current, email: undefined }));
      mutation.reset();
      googleMutation.reset();
    },
    [googleMutation, mutation]
  );

  const setPassword = useCallback(
    (value: string) => {
      setPasswordValue(value);
      setErrors((current) => ({ ...current, password: undefined }));
      mutation.reset();
    },
    [mutation]
  );

  const submit = useCallback(() => {
    const nextErrors = validateSignInForm(email, password);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    mutation.mutate({
      email: email.trim().toLowerCase(),
      password,
    });
  }, [email, mutation, password]);

  const signInWithGoogle = useCallback(() => {
    googleMutation.mutate();
  }, [googleMutation]);

  const formError = mutation.error?.message ?? 
    (googleMutation.error?.message === '__CANCELLED__' 
      ? null 
      : googleMutation.error?.message ?? null);

  return {
    ...mutation,
    email,
    password,
    errors,
    formError,
    isGooglePending: googleMutation.isPending,
    setEmail,
    setPassword,
    submit,
    signInWithGoogle,
  };
}

export function useSignUp(): UseSignUpReturn {
  const setUser = useAuthStore((state) => state.setUser);
  const [fullName, setFullNameValue] = useState('');
  const [phone, setPhoneValue] = useState('');
  const [city, setCityValue] = useState('');
  const [state, setStateValue] = useState('');
  const [email, setEmailValue] = useState('');
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPasswordValue] = useState('');
  const [errors, setErrors] = useState<SignUpErrors>({});

  const mutation = useMutation<User, Error, SignUpVariables>({
    mutationFn: async ({
      email: nextEmail,
      password: nextPassword,
      fullName: nextFullName,
      phone: nextPhone,
      city: nextCity,
      state: nextState,
    }) => {
      const { data, error } = await signUp(
        nextEmail,
        nextPassword,
        nextFullName,
        nextPhone,
        nextCity,
        nextState,
      );

      if (error) throw new Error(error);
      if (!data) throw new Error('Sign up failed: no user returned.');

      return data;
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });

  const clearFieldError = useCallback(
    (field: keyof SignUpErrors) => {
      setErrors((current) => ({ ...current, [field]: undefined }));
      mutation.reset();
    },
    [mutation]
  );

  const setFullName = useCallback(
    (value: string) => { setFullNameValue(value); clearFieldError('fullName'); },
    [clearFieldError]
  );

  const setPhone = useCallback(
    (value: string) => { setPhoneValue(value); clearFieldError('phone'); },
    [clearFieldError]
  );

  const setCity = useCallback(
    (value: string) => { setCityValue(value); clearFieldError('city'); },
    [clearFieldError]
  );

  const setState = useCallback(
    (value: string) => { setStateValue(value); clearFieldError('state'); },
    [clearFieldError]
  );

  const setEmail = useCallback(
    (value: string) => { setEmailValue(value); clearFieldError('email'); },
    [clearFieldError]
  );

  const setPassword = useCallback(
    (value: string) => {
      setPasswordValue(value);
      clearFieldError('password');
      clearFieldError('confirmPassword');
    },
    [clearFieldError]
  );

  const setConfirmPassword = useCallback(
    (value: string) => { setConfirmPasswordValue(value); clearFieldError('confirmPassword'); },
    [clearFieldError]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const submit = useCallback(() => {
    const nextErrors = validateSignUpForm(
      fullName,
      phone,
      city,
      state,
      email,
      password,
      confirmPassword
    );

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    mutation.mutate({
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
    });
  }, [city, confirmPassword, email, fullName, mutation, password, phone, state]);

  return {
    ...mutation,
    fullName,
    phone,
    city,
    state,
    email,
    password,
    confirmPassword,
    errors,
    formError: mutation.error?.message ?? null,
    passwordStrength,
    setFullName,
    setPhone,
    setCity,
    setState,
    setEmail,
    setPassword,
    setConfirmPassword,
    submit,
  };
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmailValue] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation<null, Error, string>({
    mutationFn: async (nextEmail) => {
      const { error } = await resetPassword(nextEmail);

      if (error) throw new Error(error);

      return null;
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const setEmail = useCallback(
    (value: string) => {
      setEmailValue(value);
      setEmailError(undefined);
      mutation.reset();
    },
    [mutation]
  );

  const submit = useCallback(() => {
    const nextError = validateEmail(email);

    if (nextError) {
      setEmailError(nextError);
      return;
    }

    setEmailError(undefined);
    mutation.mutate(email.trim().toLowerCase());
  }, [email, mutation]);

  const resetForm = useCallback(() => {
    setEmailError(undefined);
    setIsSuccess(false);
    mutation.reset();
  }, [mutation]);

  return {
    email,
    emailError,
    formError: mutation.error?.message ?? null,
    isPending: mutation.isPending,
    isSuccess,
    setEmail,
    submit,
    resetForm,
  };
}

export function useResetPassword(): UseForgotPasswordReturn {
  return useForgotPassword();
}

export function useSignOut(): UseMutationResult<null, Error, void> {
  const clearUser = useAuthStore((state) => state.clearUser);
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  const queryClient = useQueryClient();

  return useMutation<null, Error, void>({
    mutationFn: async () => {
      const { error } = await apiSignOut();

      if (error) throw new Error(error);

      return null;
    },
    onSuccess: () => {
      clearUser();
      setWishlist([]);
      queryClient.clear();
    },
  });
}
