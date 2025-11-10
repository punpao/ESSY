"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthToolbar } from "../../../../components/AuthToolbar";
import { apiRequest } from "../../../../components/api-client";
import { Badge, Button, Card, CardContent, CardHeader } from "@thai-social-escrow/ui";

interface Dispute {
  id: string;
  status: string;
  reasonText: string;
  evidence: Array<{ id: string; kind: string; url: string; note?: string | null }>;
  deal: { title: string };
}

export default function BuyerDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const disputeId = params.id;
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [message, setMessage] = useState("");

  const loadDispute = async () => {
    try {
      const data = await apiRequest<{ dispute: Dispute }>(`/disputes/${disputeId}`);
      setDispute(data.dispute);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อพิพาทได้");
    }
  };

  useEffect(() => {
    loadDispute();
  }, [disputeId]);

  const submitEvidence = async (event: FormEvent) => {
    event.preventDefault();
    if (!dispute) return;
    try {
      await apiRequest(`/disputes/${dispute.id}/evidence`, {
        method: "POST",
        body: { evidence: [{ kind: "image", url: evidenceUrl, note: evidenceNote }] }
      });
      setMessage("อัปโหลดหลักฐานแล้ว");
      setEvidenceUrl("");
      setEvidenceNote("");
      loadDispute();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <h1 className="text-2xl font-semibold text-emerald-700">รายละเอียดข้อพิพาท</h1>
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {dispute ? (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">ดีล: {dispute.deal.title}</p>
              <h2 className="text-lg font-semibold text-slate-800">{dispute.reasonText}</h2>
            </div>
            <Badge tone={dispute.status}>{translateStatus(dispute.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div>
              <h3 className="font-semibold text-slate-700">หลักฐานที่แนบ</h3>
              <ul className="list-disc pl-5">
                {dispute.evidence.map((item) => (
                  <li key={item.id} className="py-1">
                    <a href={item.url} className="text-emerald-600 underline" target="_blank" rel="noreferrer">
                      {item.kind} - {item.note ?? item.url}
                    </a>
                  </li>
                ))}
                {dispute.evidence.length === 0 && <li className="text-slate-400">ยังไม่มีหลักฐาน</li>}
              </ul>
            </div>
            <form onSubmit={submitEvidence} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">ลิงก์หลักฐาน</label>
                <input
                  required
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">บันทึกเพิ่มเติม</label>
                <input
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit">อัปโหลดหลักฐาน</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">กำลังโหลด...</div>
      )}
    </div>
  );
}

function translateStatus(status: string) {
  switch (status) {
    case "OPEN":
      return "รอตรวจสอบ";
    case "NEED_MORE_INFO":
      return "ต้องการข้อมูลเพิ่ม";
    case "RESOLVED_REFUND":
      return "คืนเงินให้ผู้ซื้อ";
    case "RESOLVED_RELEASE":
      return "โอนให้ผู้ขาย";
    default:
      return status;
  }
}
