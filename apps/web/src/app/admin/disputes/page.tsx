"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDisputes()
      .then((data) => {
        setDisputes(data.disputes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (disputeId: string, resolution: "RESOLVED_REFUND" | "RESOLVED_RELEASE") => {
    const note = prompt("กรุณาระบุหมายเหตุการแก้ไข:");
    if (!note) return;

    try {
      await api.resolveDispute(disputeId, resolution, note);
      alert("แก้ไขข้อพิพาทสำเร็จ");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">จัดการข้อพิพาท</h1>

      <div className="grid gap-4">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              ยังไม่มีข้อพิพาท
            </CardContent>
          </Card>
        ) : (
          disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>ข้อพิพาท #{dispute.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      เปิดโดย: {dispute.opener?.displayName} | {formatDate(dispute.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={dispute.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">Deal: {dispute.deal?.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{dispute.reasonText}</p>
                </div>

                {dispute.evidence && dispute.evidence.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">หลักฐาน:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {dispute.evidence.map((ev: any) => (
                        <li key={ev.id} className="text-sm">
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                            {ev.kind} - {ev.note || "ไม่มีหมายเหตุ"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {dispute.status === "OPEN" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleResolve(dispute.id, "RESOLVED_REFUND")}
                      variant="destructive"
                      size="sm"
                    >
                      คืนเงิน
                    </Button>
                    <Button
                      onClick={() => handleResolve(dispute.id, "RESOLVED_RELEASE")}
                      size="sm"
                    >
                      โอนเงินให้ผู้ขาย
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
