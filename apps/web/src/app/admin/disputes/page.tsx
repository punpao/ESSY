"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/utils";

interface Dispute {
  id: string;
  reason_text: string;
  status: string;
  created_at: string;
  deal: {
    id: string;
    title: string;
    amount_satang: number;
  };
  opener: { display_name: string };
  evidence: Array<{ url: string; kind: string }>;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    try {
      const res = await apiFetch("/admin/disputes");
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(disputeId: string, resolution: "RESOLVED_REFUND" | "RESOLVED_RELEASE") {
    if (!confirm(`ยืนยันการแก้ไข: ${resolution === "RESOLVED_REFUND" ? "คืนเงิน" : "โอนเงิน"}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution }),
      });
      if (res.ok) {
        loadDisputes();
        alert("แก้ไขข้อพิพาทแล้ว");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">จัดการข้อพิพาท</h1>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">ไม่มีข้อพิพาท</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{dispute.deal.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      โดย: {dispute.opener.display_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(dispute.deal.amount_satang / 100).toFixed(2)} THB
                    </p>
                  </div>
                  <Badge variant={dispute.status === "OPEN" ? "destructive" : "default"}>
                    {dispute.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium mb-1">เหตุผล:</p>
                  <p className="text-sm text-gray-600">{dispute.reason_text}</p>
                </div>
                {dispute.evidence.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">หลักฐาน:</p>
                    <div className="space-y-1">
                      {dispute.evidence.map((ev, idx) => (
                        <a
                          key={idx}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 block"
                        >
                          {ev.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {dispute.status === "OPEN" && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleResolve(dispute.id, "RESOLVED_REFUND")}
                    >
                      คืนเงิน
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResolve(dispute.id, "RESOLVED_RELEASE")}
                    >
                      โอนเงินให้ผู้ขาย
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
