'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, EmptyState } from '@thai-escrow/ui';
import { useAuth } from '../../../../lib/auth-context';
import { apiFetch } from '../../../../lib/apiClient';

interface SellerProfileResponse {
  seller: {
    id: string;
    verified: boolean;
    promptpayId: string;
    promptpayName: string;
    kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
    kycSelfieUrl?: string | null;
    promptpayProofUrl?: string | null;
  };
}

export default function SellerKycPage() {
  const { token, user } = useAuth();
  if (user && user.role !== 'seller') {
    return (
      <RoleWarning message="หน้านี้สำหรับผู้ขายเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ขาย" />
    );
  }
  const queryClient = useQueryClient();
  const [promptpayId, setPromptpayId] = useState('');
  const [promptpayName, setPromptpayName] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [promptpayProofUrl, setPromptpayProofUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['seller-me'],
    queryFn: () =>
      apiFetch<SellerProfileResponse>('/seller/me', {
        token
      }),
    enabled: Boolean(token)
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<SellerProfileResponse>('/seller/verify/basic', {
        method: 'POST',
        token,
        body: {
          promptpayId,
          promptpayName,
          selfieUrl,
          promptpayProofUrl: promptpayProofUrl || undefined
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-me'] });
    }
  });

  const seller = data?.seller;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">ยืนยันตัวตนผู้ขาย (KYC)</h1>
        <p className="text-sm text-slate-500">
          ยืนยัน PromptPay และเซลฟี่เพื่อแสดงป้าย Verified Seller และเพิ่มความน่าเชื่อถือ
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">กำลังโหลด...</p>
      ) : seller ? (
        <Card>
          <CardHeader title="สถานะปัจจุบัน" />
          <CardBody className="space-y-4">
            <p className="text-sm text-slate-600">
              สถานะ KYC:{' '}
              <span className="font-semibold text-slate-900">{kycStatusLabel(seller.kycStatus)}</span>
            </p>
            <p className="text-sm text-slate-600">
              PromptPay ID: <strong>{maskPromptpay(seller.promptpayId)}</strong>
            </p>
            <p className="text-sm text-slate-600">
              ชื่อบัญชี: <strong>{seller.promptpayName}</strong>
            </p>
            {seller.kycStatus === 'VERIFIED' ? (
              <EmptyState
                title="คุณได้รับการยืนยันแล้ว!"
                description="เพย์ลิงก์ของคุณจะแสดงป้าย Verified Seller เพื่อเพิ่มความมั่นใจแก่ผู้ซื้อ"
              />
            ) : null}
          </CardBody>
        </Card>
      ) : (
        <EmptyState
          title="ยังไม่ส่งข้อมูลยืนยันตัวตน"
          description="กรอกแบบฟอร์มด้านล่างเพื่อยืนยันตัวตนผู้ขาย"
        />
      )}

      <Card>
        <CardHeader title="ส่งข้อมูลยืนยันตัวตน" description="ใช้ลิงก์รูปภาพจำลองสำหรับเดโม่" />
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <label className="block text-sm font-medium text-slate-700">
              PromptPay ID
              <input
                required
                value={promptpayId}
                onChange={(event) => setPromptpayId(event.target.value)}
                placeholder="0812345678"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              ชื่อบัญชี PromptPay
              <input
                required
                value={promptpayName}
                onChange={(event) => setPromptpayName(event.target.value)}
                placeholder="นางสาว แม่ค้าดี"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              ลิงก์เซลฟี่ (จำลอง)
              <input
                required
                value={selfieUrl}
                onChange={(event) => setSelfieUrl(event.target.value)}
                placeholder="https://example.com/selfie.jpg"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              ลิงก์สลิป PromptPay (ไม่บังคับ)
              <input
                value={promptpayProofUrl}
                onChange={(event) => setPromptpayProofUrl(event.target.value)}
                placeholder="https://example.com/promptpay.jpg"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <Button type="submit" disabled={mutation.isPending}>
              ส่งข้อมูลยืนยัน
            </Button>
            {mutation.isSuccess ? (
              <p className="text-sm text-blue-600">ส่งข้อมูลเรียบร้อย ทีมงานจะตรวจสอบภายใน 1 วันทำการ</p>
            ) : null}
            {mutation.isError ? (
              <p className="text-sm text-rose-600">
                {(mutation.error as Error)?.message ?? 'เกิดข้อผิดพลาด'}
              </p>
            ) : null}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

const kycStatusLabel = (status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED') => {
  switch (status) {
    case 'UNVERIFIED':
      return 'ยังไม่ยืนยัน';
    case 'PENDING':
      return 'กำลังตรวจสอบ';
    case 'VERIFIED':
      return 'ยืนยันแล้ว';
    default:
      return status;
  }
};

const maskPromptpay = (value: string) =>
  value.length > 4 ? `${value.slice(0, -4).replace(/\d/g, '*')}${value.slice(-4)}` : value;

const RoleWarning = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
    {message}
  </div>
);
