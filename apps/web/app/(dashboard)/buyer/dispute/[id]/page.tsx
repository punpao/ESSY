'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '../../../../../components/AuthGuard';
import { useDeal } from '../../../../../lib/deals';
import { api } from '../../../../../lib/api';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@thai-escrow/ui';

export default function BuyerDisputeDetailPage() {
  const params = useParams();
  const dealId = params?.id as string;
  const { data: deal, mutate } = useDeal(dealId);
  const [evidence, setEvidence] = useState([{ kind: 'image', url: '', note: '' }]);
  const [message, setMessage] = useState<string | null>(null);

  const addEvidenceRow = () => {
    setEvidence((prev) => [...prev, { kind: 'other', url: '', note: '' }]);
  };

  const updateEvidence = (index: number, key: 'kind' | 'url' | 'note', value: string) => {
    setEvidence((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const submitEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    const filtered = evidence.filter((item) => item.url);
    if (!filtered.length) {
      setMessage('กรุณาใส่ลิงก์หลักฐานอย่างน้อย 1 รายการ');
      return;
    }
    await api.post(`/disputes/${deal?.dispute?.id}/evidence`, {
      evidence: filtered,
    });
    await mutate();
    setMessage('อัปโหลดหลักฐานเรียบร้อย ทีมงานจะพิจารณาเร็วที่สุด');
  };

  return (
    <AuthGuard role="buyer">
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">ข้อพิพาท #{dealId?.slice(-6)}</h1>
          <p className="text-sm text-slate-600">
            เลือกเหตุผลและแนบหลักฐาน ทีมงานจะตอบกลับภายใน 24-72 ชั่วโมง
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>สถานะข้อพิพาท</CardTitle>
              <CardDescription>
                เหตุผลที่แจ้ง: {deal?.dispute?.reasonText ?? 'N/A'}
              </CardDescription>
            </CardHeader>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• ของยังไม่ถึง</li>
              <li>• ของไม่ตรงปก</li>
              <li>• อื่น ๆ</li>
            </ul>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>แนบหลักฐานเพิ่ม</CardTitle>
              <CardDescription>ลิงก์รูปภาพหรือแชท (อัปโหลดจำลองผ่าน URL)</CardDescription>
            </CardHeader>
            <form className="flex flex-col gap-3" onSubmit={submitEvidence}>
              {evidence.map((item, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-3">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    ประเภทหลักฐาน
                    <select
                      value={item.kind}
                      onChange={(event) => updateEvidence(index, 'kind', event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
                    >
                      <option value="image">ภาพถ่าย</option>
                      <option value="chatlog">แชท</option>
                      <option value="other">อื่น ๆ</option>
                    </select>
                  </label>
                  <label className="mt-2 block text-xs font-semibold uppercase text-slate-500">
                    ลิงก์
                    <input
                      value={item.url}
                      onChange={(event) => updateEvidence(index, 'url', event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
                      placeholder="https://"
                    />
                  </label>
                  <label className="mt-2 block text-xs font-semibold uppercase text-slate-500">
                    หมายเหตุ
                    <input
                      value={item.note}
                      onChange={(event) => updateEvidence(index, 'note', event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1"
                    />
                  </label>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addEvidenceRow}>
                เพิ่มหลักฐานอีกชิ้น
              </Button>
              <Button type="submit">ส่งให้ทีมงาน</Button>
              {message && <p className="text-sm text-emerald-600">{message}</p>}
            </form>
          </Card>
        </section>

        {deal?.dispute?.evidence?.length ? (
          <Card className="p-6">
            <CardTitle>หลักฐานที่ส่งไว้</CardTitle>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {deal.dispute.evidence.map((item: any) => (
                <li key={item.id}>
                  <span className="font-medium">[{item.kind}]</span> {item.url}
                  {item.note && <span className="text-slate-400"> – {item.note}</span>}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </AuthGuard>
  );
}
