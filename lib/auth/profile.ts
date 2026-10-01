import type { User } from '@supabase/supabase-js';

type ProfileSource = Pick<User, 'email' | 'user_metadata' | 'identities' | 'created_at'>;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function googleAvatar(value: unknown) {
  const source = text(value);
  if (!source) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || (url.hostname !== 'googleusercontent.com' && !url.hostname.endsWith('.googleusercontent.com'))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getAccountProfile(user: ProfileSource | null, fallbackEmail: string) {
  const google = user?.identities?.find(identity => identity.provider === 'google')?.identity_data;
  const metadata = user?.user_metadata;
  const name = text(metadata?.full_name) || text(metadata?.name) || text(google?.full_name) || text(google?.name)
    || [text(metadata?.given_name) || text(google?.given_name), text(metadata?.family_name) || text(google?.family_name)].filter(Boolean).join(' ')
    || 'Traveller';
  const email = text(user?.email) || fallbackEmail;
  const avatar = googleAvatar(metadata?.avatar_url) || googleAvatar(metadata?.picture)
    || googleAvatar(google?.avatar_url) || googleAvatar(google?.picture);
  const joined = user?.created_at && !Number.isNaN(Date.parse(user.created_at))
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null;
  return { name, email, avatar, joined };
}
