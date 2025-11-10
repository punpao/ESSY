import { customAlphabet } from 'nanoid';
import { ulid } from 'ulid';

const paylinkAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const paylinkToken = customAlphabet(paylinkAlphabet, 10);

export const generatePaylinkToken = () => paylinkToken();
export const generateDealId = () => ulid();
