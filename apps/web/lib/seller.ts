import useSWR from 'swr';
import { api } from './api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useSellerProfile = () => useSWR('/seller/me', fetcher);
