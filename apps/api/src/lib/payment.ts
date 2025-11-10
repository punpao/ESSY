import { MockPromptPayProvider } from "@thai-escrow/payment";

const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "mock_secret";

export const paymentProvider = new MockPromptPayProvider(webhookSecret);
