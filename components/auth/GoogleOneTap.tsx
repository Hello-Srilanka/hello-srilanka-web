'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type CredentialResponse = { credential?: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        nonce: string;
        use_fedcm_for_prompt: boolean;
      }): void;
      prompt(): void;
      cancel(): void;
    };
  };
};

declare global {
  interface Window { google?: GoogleIdentity }
}

async function makeNonce() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return { nonce, hashedNonce };
}

export default function GoogleOneTap({ clientId, onError }: { clientId: string; onError: (message: string) => void }) {
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.google?.accounts.id.cancel();
    };
  }, []);

  async function initialize() {
    if (!window.google || !mounted.current) return;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      if (data?.claims || !mounted.current) return;
      const { nonce, hashedNonce } = await makeNonce();
      if (!mounted.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async response => {
          try {
            if (!response.credential) throw new Error('Google sign-in did not return a credential. Please try again.');
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            });
            if (error) throw error;
            router.replace('/account');
            router.refresh();
          } catch (cause) {
            if (mounted.current) onError(cause instanceof Error ? cause.message : 'Google sign-in failed. Please try again.');
          }
        },
      });
      window.google.accounts.id.prompt();
    } catch {
      if (mounted.current) onError('Google One Tap could not start. Please use the Google button or email sign-in.');
    }
  }

  return <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => { void initialize(); }} />;
}
