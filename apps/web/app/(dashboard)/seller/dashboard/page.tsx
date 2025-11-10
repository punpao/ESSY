'use client';

import Link from 'next/link';
import { AuthGuard } from '../../../../components/AuthGuard';
import { useSellerDeals } from '../../../../lib/deals';
import { useSellerProfile } from '../../../../lib/seller';
import { DealTable } from '../../../../components/DealTable';
import { Button, Card, CardDescription, CardHeader, CardTitle, StateBadge } from '@thai-escrow/ui';

export default function SellerDashboardPage() {
  const { data: deals, isLoading: dealsLoading } = useSellerDeals();
  const { data: profileData } = useSellerProfile();

  return (
    <AuthGuard role="seller">
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ดผู้ขาย</h1>
            <p className="text-sm text-slate-600">
              จัดการดีลทั้งหมดของคุณ สร้าง Paylink ใหม่ และตรวจสอบสถานะการโอนเงิน
            </p>
          </div>
          <Button asChild>
            <Link href="/seller/deal/new">สร้าง Paylink ใหม่</Link>
          </Button>
        </header>

        {profileData && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>สถานะผู้ขาย</CardTitle>
              <CardDescription>
                PromptPay: {profileData.sellerProfile?.promptpayName ?? 'ยังไม่ตั้งค่า'}
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">ระดับยืนยัน:</span>
                <StateBadge status={profileData.sellerProfile?.verified ? 'RELEASED' : 'PENDING'} />
              </div>
              <Link href="/seller/kyc" className="text-sm text-emerald-600 hover:text-emerald-700">
                {profileData.sellerProfile?.verified ? 'ดูรายละเอียด' : 'อัปเกรดยืนยันผู้ขาย' }
              </Link>
            </div>
          </Card>
        )}

        {dealsLoading ? (
          <p className="text-sm text-slate-500">กำลังโหลด...</p>
        ) : (
          <DealTable
            deals={deals ?? []}
            empty="ยังไม่มีดีล ลองสร้าง Paylink แล้วแชร์ให้ลูกค้าในแชท"
          />
        )}
      </div>
    </AuthGuard>
  );
}
