"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Dispute {
  id: string;
  reasonText: string;
  status: string;
  createdAt: string;
  deal: {
    id: string;
    title: string;
    amountSatang: number;
    seller: { displayName: string };
    buyer: { displayName: string };
  };
  evidence: Array<{ url: string; kind: string }>;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/admin/disputes`
      );
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string, resolution: "RESOLVED_REFUND" | "RESOLVED_RELEASE") => {
    const note = prompt("หมายเหตุการแก้ไข:");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/disputes/${disputeId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolution, resolutionNote: note }),
        }
      );
      if (res.ok) {
        await fetchDisputes();
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      OPEN: { label: "เปิดอยู่", variant: "destructive" },
      NEED_MORE_INFO: { label: "ต้องการข้อมูลเพิ่ม", variant: "secondary" },
      RESOLVED_REFUND: { label: "คืนเงินแล้ว", variant: "default" },
      RESOLVED_RELEASE: { label: "โอนเงินแล้ว", variant: "default" },
    };
    const s = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">ESSY - จัดการข้อพิพาท</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
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
                      <CardDescription>
                        ผู้ซื้อ: {dispute.deal.buyer.displayName} • ผู้ขาย:{" "}
                        {dispute.deal.seller.displayName}
                      </CardDescription>
                    </div>
                    {getStatusBadge(dispute.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">เหตุผล:</p>
                      <p className="text-sm text-gray-700">{dispute.reasonText}</p>
                    </div>

                    {dispute.evidence.length > 0 && (
                      <div>
                        <p className="font-semibold mb-2">หลักฐาน:</p>
                        <div className="space-y-2">
                          {dispute.evidence.map((ev, idx) => (
                            <a
                              key={idx}
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              {ev.kind}: {ev.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {dispute.status === "OPEN" && (
                      <div className="flex gap-2 pt-4">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
