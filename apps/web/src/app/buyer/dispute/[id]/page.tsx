"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/utils";

interface Dispute {
  id: string;
  reason_text: string;
  status: string;
  evidence: Array<{ url: string; kind: string; note?: string }>;
}

export default function DisputePage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    reason_text: "",
    evidence_url: "",
  });

  useEffect(() => {
    loadDispute();
  }, [dealId]);

  async function loadDispute() {
    try {
      const res = await apiFetch(`/disputes?dealId=${dealId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.disputes && data.disputes.length > 0) {
          setDispute(data.disputes[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Open dispute
      const res = await apiFetch(`/disputes/${dealId}/open`, {
        method: "POST",
        body: JSON.stringify({ reason_text: formData.reason_text }),
      });

      if (res.ok) {
        const newDispute = await res.json();
        setDispute(newDispute);

        // Add evidence if provided
        if (formData.evidence_url) {
          await apiFetch(`/disputes/${newDispute.id}/evidence`, {
            method: "POST",
            body: JSON.stringify({
              url: formData.evidence_url,
              kind: "image",
            }),
          });
        }

        alert("เปิดข้อพิพาทแล้ว");
        router.push(`/buyer/deals/${dealId}`);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  if (dispute) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>ข้อพิพาท</CardTitle>
            <CardDescription>สถานะ: {dispute.status}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">เหตุผล:</p>
              <p className="text-gray-600">{dispute.reason_text}</p>
            </div>
            {dispute.evidence.length > 0 && (
              <div>
                <p className="font-medium mb-2">หลักฐาน:</p>
                <div className="space-y-2">
                  {dispute.evidence.map((ev, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded">
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        {ev.url}
                      </a>
                      {ev.note && <p className="text-sm text-gray-500">{ev.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => router.back()}>กลับ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>เปิดข้อพิพาท</CardTitle>
          <CardDescription>
            กรุณาระบุเหตุผลและหลักฐาน (ถ้ามี)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">เหตุผล</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">เลือกเหตุผล</option>
                <option value="not_received">ของยังไม่ถึง</option>
                <option value="not_as_described">ของไม่ตรงปก</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">รายละเอียด</label>
              <textarea
                value={formData.reason_text}
                onChange={(e) => setFormData({ ...formData, reason_text: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                required
                placeholder="อธิบายรายละเอียดปัญหา..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                URL หลักฐาน (ไม่บังคับ)
              </label>
              <input
                type="url"
                value={formData.evidence_url}
                onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/evidence.jpg"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "กำลังส่ง..." : "ส่งข้อพิพาท"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
