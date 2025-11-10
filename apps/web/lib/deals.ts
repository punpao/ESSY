import useSWR from 'swr';
import { api } from './api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useSellerDeals = () => {
  return useSWR('/deals/seller', fetcher);
};

export const useBuyerDeals = () => {
  return useSWR('/deals/buyer', fetcher);
};

export const useAdminDeals = (status?: string) => {
  const url = status ? `/admin/deals?status=${status}` : '/admin/deals';
  return useSWR(url, fetcher);
};

export const useAdminDisputes = (status?: string) => {
  const url = status ? `/admin/disputes?status=${status}` : '/admin/disputes';
  return useSWR(url, fetcher);
};

export const useDeal = (id?: string) => {
  return useSWR(id ? `/deals/${id}` : null, fetcher);
};
