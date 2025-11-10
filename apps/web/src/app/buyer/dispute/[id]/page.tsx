"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function DisputePage() {
  const params = useParams();
  const dealId = params.id as string;
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  useEffect(() => {
    // Mock - in real app, fetch dispute or create new
    setLoading(false);
  }, [dealId]);

  const handleOpenDispute = async () => {
    if (!reason.trim()) {
      alert("กรุณากรอกเหตุผล");
      return;
    }

    try {
      const result = await api.disputes.open(dealId, reason);
      setDispute(result);
      alert("เปิดข้อพิพาทสำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handleAddEvidence = async () => {
    if (!evidenceUrl.trim()) {
      alert("กรุณากรอก URL หลักฐาน");
      return;
    }

    try {
      await api.disputes.addEvidence(dispute.id, {
        url: evidenceUrl,
        kind: "image",
        note: evidenceNote || undefined,
      });
      alert("เพิ่มหลักฐานสำเร็จ");
      setEvidenceUrl("");
      setEvidenceNote("");
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>เปิดข้อพิพาท</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!dispute ? (
              <>
                <div>
                  <Label htmlFor="reason">เหตุผล</Label>
                  <select
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                  >
                    <option value="">เลือกเหตุผล</option>
                    <option value="ของยังไม่ถึง">ของยังไม่ถึง</option>
                    <option value="ของไม่ตรงปก">ของไม่ตรงปก</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                  {reason === "อื่นๆ" && (
                    <Input
                      className="mt-2"
                      placeholder="ระบุเหตุผล"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  )}
                </div>

                <Button onClick={handleOpenDispute} className="w-full" size="lg">
                  เปิดข้อพิพาท
                </Button>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold text-yellow-800">สถานะ: {dispute.status}</p>
                  <p className="text-sm text-yellow-700 mt-1">เหตุผล: {dispute.reason_text}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">เพิ่มหลักฐาน</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="evidence-url">URL หลักฐาน (รูปภาพ/แชท)</Label>
                      <Input
                        id="evidence-url"
                        type="url"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="evidence-note">หมายเหตุ (ไม่บังคับ)</Label>
                      <Input
                        id="evidence-note"
                        value={evidenceNote}
                        onChange={(e) => setEvidenceNote(e.target.value)}
                        placeholder="อธิบายหลักฐาน"
                      />
                    </div>
                    <Button onClick={handleAddEvidence} variant="outline">
                      เพิ่มหลักฐาน
                    </Button>
                  </div>
                </div>

                {dispute.evidence && dispute.evidence.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">หลักฐานที่อัปโหลด</h3>
                    <div className="space-y-2">
                      {dispute.evidence.map((ev: any) => (
                        <div key={ev.id} className="p-3 border rounded-lg">
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {ev.url}
                          </a>
                          {ev.note && <p className="text-sm text-gray-600 mt-1">{ev.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
