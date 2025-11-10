import { notFound } from 'next/navigation';
import { StatusBadge, Card, CardBody, CardHeader } from '@thai-escrow/ui';
import { PromptPayWidget } from './PromptPayWidget';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

async function getPaylink(token: string) {
  const res = await fetch(`${API_BASE_URL}/paylinks/${token}`, {
    next: {
      revalidate: 15
    }
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error('โหลดข้อมูลเพย์ลิงก์ไม่สำเร็จ');
  }
  return res.json() as Promise<{
    deal: {
      id: string;
      title: string;
      status: 'PENDING' | 'HOLD' | 'SHIPPED' | 'RELEASED' | 'DISPUTE' | 'REFUND';
      amountSatang: number;
      currency: string;
      sellerDisplayName: string;
      sellerVerified: boolean;
      promptpayName: string | null;
    };
  }>;
}

export default async function PaylinkPage({
  params
}: {
  params: { paylink_token: string };
}) {
  const data = await getPaylink(params.paylink_token);

  if (!data) {
    notFound();
  }

  const deal = data.deal;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
        <Card>
          <CardHeader
            title={deal.title}
            description={`สร้างโดย ${deal.sellerDisplayName}${
              deal.sellerVerified ? ' · ผู้ขายยืนยันตัวตน' : ''
            }`}
          />
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-700">
              <p className="text-2xl font-bold text-slate-900">
                {(deal.amountSatang / 100).toLocaleString('th-TH', {
                  style: 'currency',
                  currency: deal.currency
                })}
              </p>
              <StatusBadge status={deal.status} />
            </div>
            {deal.promptpayName ? (
              <p className="text-sm text-slate-500">
                ชื่อบัญชี PromptPay ที่ยืนยัน: {deal.promptpayName}
              </p>
            ) : null}
          </CardBody>
        </Card>

        <PromptPayWidget
          dealId={deal.id}
          paylinkToken={params.paylink_token}
          amountSatang={deal.amountSatang}
        />

        <Card>
          <CardHeader title="ขั้นตอนการพักเงิน" />
          <CardBody>
            <ol className="list-decimal space-y-2 ps-5 text-sm text-slate-600">
              <li>ขอ QR PromptPay จากผู้ขายและสแกนโอน</li>
              <li>ระบบพักเงิน (HOLD) ไว้ ไม่โอนให้ผู้ขายจนกว่าจะยืนยัน</li>
              <li>ผู้ขายใส่เลขพัสดุ และจัดส่งสินค้า</li>
              <li>คุณกดยืนยัน หรือมีหลักฐานจัดส่งสำเร็จ 48 ชม. ระบบจะปล่อยเงินอัตโนมัติ</li>
              <li>หากมีปัญหา เปิดข้อพิพาทบนระบบเพื่อขอคืนเงิน</li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
