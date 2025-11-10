import { getPaylink } from "../../../lib/api";
import { PaylinkClient } from "../../../components/paylink-client";

type PayPageProps = {
  params: {
    token: string;
  };
};

export default async function PayPage({ params }: PayPageProps) {
  const deal = await getPaylink(params.token);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-100 px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">
          ชำระผ่าน PromptPay เพื่อพักเงินอย่างปลอดภัย
        </h1>
        <p className="text-sm text-slate-600">
          ดีลนี้ออกโดย {deal.sellerName} • สถานะปัจจุบัน: {deal.status}
        </p>
        <PaylinkClient token={params.token} deal={deal} />
      </div>
    </div>
  );
}
