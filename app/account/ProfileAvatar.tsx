'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProfileAvatar({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
  return <span className="profile-avatar" aria-hidden="true">
    {src && !failed ? <Image src={src} width={88} height={88} alt="" unoptimized onError={() => setFailed(true)} /> : initials}
  </span>;
}
