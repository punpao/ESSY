interface DealResponse {
  id: string;
  title: string;
  amountSatang: number;
  status: string;
  seller: {
    displayName: string;
    promptpayName?: string;
  };
  payment?: {
    qrString: string;
    providerRef: string;
    status: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function fetchDeal(token: string): Promise<DealResponse> {
  const res = await fetch(`${API_BASE}/paylinks/${token}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('ไม่พบเพย์ลิงก์');
  }
  const data = await res.json();
  return data.deal as DealResponse;
}

export default async function PaylinkPage({ params }: { params: { token: string } }) {
  const deal = await fetchDeal(params.token);
  const amountBaht = (deal.amountSatang / 100).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });

  return (
    <div className="space-y-8 rounded-2xl bg-white p-8 shadow-lg">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-700">{deal.title}</h1>
        <p className="text-sm text-slate-600">ขายโดย {deal.seller.displayName}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-800">สแกน PromptPay เพื่อจ่าย</h2>
          <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
            <span className="text-center text-sm text-slate-500">
              {deal.payment?.qrString ?? 'กำลังสร้างคิวอาร์...'}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            ยอดชำระทั้งหมด <span className="font-semibold text-emerald-700">{amountBaht}</span>
          </p>
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ หรือระบบเห็นว่า ‘จัดส่งสำเร็จ’ แล้ว
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-800">สถานะการชำระเงิน</h2>
          <ul className="space-y-3 text-sm">
            <li>สถานะเพย์ลิงก์: {deal.status}</li>
            <li>ผู้รับเงิน: {deal.seller.promptpayName ?? deal.seller.displayName}</li>
            <li>อ้างอิงการชำระเงิน: {deal.payment?.providerRef ?? '-'}</li>
          </ul>
          <button className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            อัปสลิป (จำลอง)
          </button>
          <div className="space-y-2 text-xs text-slate-500">
            <p>หลังระบบได้รับการยืนยันจากเกตเวย์ สถานะจะเปลี่ยนเป็น “ชำระแล้ว (HOLD)” อัตโนมัติ</p>
            <p>
              หากมีปัญหา ติดต่อ {deal.seller.displayName} ผ่านแชท แล้วค่อยเปิดข้อพิพาทเพื่อให้ทีมเราช่วยตัดสินใจ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
