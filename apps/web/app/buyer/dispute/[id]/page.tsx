'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";
import { useAuth } from "../../../../components/auth-provider";
import { getDispute, uploadEvidence } from "../../../../lib/api";

type DisputeDetail = {
  id: string;
  reasonText: string;
  status: string;
  createdAt: string;
  deal: { title: string; seller: { displayName: string } };
  evidence: { id: string; kind: string; url: string; note?: string }[];
};

export default function DisputeDetailPage({ params }: { params: { id: string } }) {
  const auth = useAuth();
  const router = useRouter();
  const [detail, setDetail] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    setLoading(true);
    getDispute(auth.token, params.id)
      .then((res) => setDetail(res.dispute as DisputeDetail))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [auth.token, params.id]);

  if (!auth.token) {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบเพื่อดูข้อพิพาท</h1>
      </div>
    );
  }

  const handleAddEvidence = async () => {
    const url = window.prompt("ใส่ลิงก์หลักฐาน (เช่น รูปหรือไฟล์ที่อัปโหลด)");
    if (!url) return;
    const kindChoice = window.prompt("ประเภทหลักฐาน (image, chatlog, other)", "image") ?? "image";
    const note = window.prompt("หมายเหตุเพิ่มเติม (ถ้ามี)");

    try {
      await uploadEvidence(auth.token!, params.id, {
        evidence: [{ url, kind: kindChoice as "image" | "chatlog" | "other", note: note ?? undefined }]
      });
      alert("อัปโหลดหลักฐานเรียบร้อย");
      const res = await getDispute(auth.token!, params.id);
      setDetail(res.dispute as DisputeDetail);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6 px-6 pb-16">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        ← ย้อนกลับ
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดข้อพิพาท</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          {loading && <p>กำลังโหลด...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {detail && (
            <>
              <p>
                ดีล: <span className="font-semibold">{detail.deal.title}</span> • ผู้ขาย:{" "}
                {detail.deal.seller.displayName}
              </p>
              <p>สถานะข้อพิพาท: {detail.status}</p>
              <p className="rounded-lg bg-slate-100 p-3">{detail.reasonText}</p>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">หลักฐาน</h3>
                {detail.evidence.length === 0 && (
                  <p className="text-xs text-slate-500">ยังไม่มีหลักฐาน กรุณาอัปโหลดเพื่อช่วยทีมงาน</p>
                )}
                {detail.evidence.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs uppercase text-slate-500">ประเภท: {item.kind}</p>
                    <a
                      href={item.url}
                      target="_blank"
                      className="break-words text-sm text-brand underline"
                    >
                      {item.url}
                    </a>
                    {item.note && <p className="text-xs text-slate-500">หมายเหตุ: {item.note}</p>}
                  </div>
                ))}
              </div>
              <Button onClick={handleAddEvidence}>อัปโหลดหลักฐานเพิ่ม</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
