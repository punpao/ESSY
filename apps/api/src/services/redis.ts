import { Redis } from 'ioredis';

export const redis = (url: string) => new Redis(url);
