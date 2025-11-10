import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from './api-client'
import { useAuth } from '../components/auth-context'

export const useSellerDeals = () => {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['seller-deals'],
    queryFn: () =>
      apiFetch('/seller/deals', {
        token,
        cache: 'no-store'
      }),
    enabled: !!token
  })
}

export const useSellerProfile = () => {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['seller-profile'],
    queryFn: () =>
      apiFetch('/seller/me', {
        token,
        cache: 'no-store'
      }),
    enabled: !!token
  })
}

export const useCreateDeal = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      title: string
      amountTHB: number
      buyerNote?: string
    }) =>
      apiFetch('/deals', {
        method: 'POST',
        body: JSON.stringify(payload),
        token
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] })
    }
  })
}

export const useBuyerDeals = () => {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['buyer-deals'],
    queryFn: () =>
      apiFetch('/buyer/deals', {
        token,
        cache: 'no-store'
      }),
    enabled: !!token
  })
}

export const useConfirmReceipt = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dealId: string) =>
      apiFetch(`/deals/${dealId}/confirm`, {
        method: 'POST',
        token
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-deals'] })
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] })
    }
  })
}

export const useAdminDeals = (status?: string) => {
  const { token } = useAuth()
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  return useQuery({
    queryKey: ['admin-deals', status],
    queryFn: () =>
      apiFetch(`/admin/deals${query.toString() ? `?${query.toString()}` : ''}`, {
        token,
        cache: 'no-store'
      }),
    enabled: !!token
  })
}

export const useAdminDisputes = (status?: string) => {
  const { token } = useAuth()
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  return useQuery({
    queryKey: ['admin-disputes', status],
    queryFn: () =>
      apiFetch(`/admin/disputes${query.toString() ? `?${query.toString()}` : ''}`, {
        token,
        cache: 'no-store'
      }),
    enabled: !!token
  })
}
