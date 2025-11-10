"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api";
import { Dispute } from "@/lib/types";
import { Button, Card, CardContent, CardHeader, CardTitle, ThaiEmptyState } from "@escrow/ui";
import { useParams } from "next/navigation";
import { formatDateTime } from "@/lib/format";

export default function BuyerDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const disputeId = params.id;
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadDispute = async () => {
    try {
      const data = await getJson<{ dispute: Dispute }>(`/buyer/disputes/${disputeId}`);
      setDispute(data.dispute);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  useEffect(() => {
    void loadDispute();
  }, [disputeId]);

  const handleUploadEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await postJson(`/disputes/${disputeId}/evidence`, {
        items: [
          {
            kind: "image",
            url: evidenceUrl,
            note
          }
        ]
      });
      setEvidenceUrl("");
      setNote("");
      setMessage("อัปโหลดหลักฐานแล้ว");
      await loadDispute();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  if (!dispute) {
    return (
      <ThaiEmptyState title="ยังไม่มีข้อมูล" description="ไม่พบข้อพิพาทนี้ หรือคุณไม่มีสิทธิ์เข้าถึง" />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดข้อพิพาท</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>ดีล: {dispute.deal.title}</p>
          <p>เหตุผล: {dispute.reasonText}</p>
          <p>สถานะ: {dispute.status}</p>
          <p>เปิดเมื่อ: {formatDateTime(dispute.createdAt)}</p>
          {dispute.resolutionNote ? <p>หมายเหตุการตัดสิน: {dispute.resolutionNote}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>หลักฐานที่ส่งแล้ว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {dispute.evidences.length === 0 ? (
            <p className="text-slate-500">ยังไม่มีหลักฐาน</p>
          ) : (
            <ul className="list-disc space-y-2 pl-4">
              {dispute.evidences.map((item) => (
                <li key={item.id}>
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-sky-600">
                    {item.kind}: {item.url}
                  </a>{" "}
                  <span className="text-xs text-slate-500">
                    ส่งเมื่อ {formatDateTime(item.createdAt)} {item.note ? `(${item.note})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>อัปโหลดหลักฐานเพิ่ม</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 text-sm" onSubmit={handleUploadEvidence}>
            <div>
              <label className="block text-slate-600">ลิงก์หลักฐาน (รูป/คลิป/เอกสาร)</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-600">คำอธิบาย</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="เช่น ภาพกล่องที่ได้รับ"
              />
            </div>
            <Button type="submit">ส่งหลักฐาน</Button>
            {message ? <p className="text-xs text-slate-500">{message}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
