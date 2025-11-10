'use client';

import Link from 'next/link';
import { AuthGuard } from '../../../../components/AuthGuard';
import { useBuyerDeals } from '../../../../lib/deals';
import { DealTable } from '../../../../components/DealTable';
import { Button, Card } from '@thai-escrow/ui';

export default function BuyerDealsPage() {
  const { data: deals, isLoading } = useBuyerDeals();

  return (
    <AuthGuard role="buyer">
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ดีลของฉัน</h1>
            <p className="text-sm text-slate-600">
              ตรวจสอบสถานะ บันทึกเลขพัสดุ และยืนยันรับของเพื่อปล่อยเงินให้ผู้ขาย
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">กลับหน้าแรก</Link>
          </Button>
        </header>

        {isLoading ? (
          <p className="text-sm text-slate-500">กำลังโหลด...</p>
        ) : (
          <DealTable
            deals={deals ?? []}
            empty="ยังไม่มีดีล — ลองเปิดลิงก์ชำระเงินจากผู้ขายเพื่อเริ่มใช้ Escrow"
          />
        )}

        <Card className="p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">ข้อความสำคัญ</p>
          <p className="mt-2">
            เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า “จัดส่งสำเร็จ” แล้ว (48 ชั่วโมงหลังผู้ขายอัปเดตว่า delivered)
          </p>
        </Card>
      </div>
    </AuthGuard>
  );
}
