'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore, UserRole } from '../store/auth';

interface Props {
  role?: UserRole | UserRole[];
  children: React.ReactNode;
}

export const AuthGuard: React.FC<Props> = ({ role, children }) => {
  const router = useRouter();
  const { user, hydrate } = useAuthStore((state) => ({
    user: state.user,
    hydrate: state.hydrate,
  }));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (role) {
      const roles = Array.isArray(role) ? role : [role];
      if (!roles.includes(user.role)) {
        router.replace('/');
      }
    }
  }, [user, role, router]);

  if (!user) {
    return null;
  }
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) {
      return null;
    }
  }

  return <>{children}</>;
};
