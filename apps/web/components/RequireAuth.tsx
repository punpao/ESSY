'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { useEffect } from 'react';

export const RequireAuth = ({
  children,
  roles
}: {
  children: React.ReactNode;
  roles?: Array<'buyer' | 'seller' | 'admin'>;
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (roles && !roles.includes(user.role)) {
        router.replace('/');
      }
    }
  }, [user, loading, roles, router]);

  if (!user && !loading) {
    return null;
  }

  return <>{children}</>;
};
