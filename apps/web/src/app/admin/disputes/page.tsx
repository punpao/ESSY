"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setDisputes([
      {
        id: "1",
        deal: {
          title: "iPhone 15 Pro Max",
          amount_satang: 4500000,
          seller: { display_name: "ผู้ขายทดสอบ" },
          buyer: { display_name: "ผู้ซื้อทดสอบ" },
        },
        reason_text: "ของยังไม่ถึง",
        status: "OPEN",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        evidence: [
          { url: "https://example.com/evidence1.jpg", kind: "image" },
        ],
      },
    ]);
    setLoading(false);
  }, []);

  const getSLAStatus = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hours < 24) return { label: "Due <24h", color: "default" };
    if (hours < 48) return { label: "Due <48h", color: "secondary" };
    return { label: "Overdue", color: "destructive" };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">จัดการข้อพิพาท</h1>

        {loading ? (
          <p>กำลังโหลด...</p>
        ) : disputes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              ไม่มีข้อพิพาท
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const sla = getSLAStatus(dispute.created_at);
              return (
                <Card key={dispute.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{dispute.deal.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          ผู้ขาย: {dispute.deal.seller.display_name} • ผู้ซื้อ:{" "}
                          {dispute.deal.buyer.display_name}
                        </p>
                      </div>
                      <Badge variant={sla.color as any}>{sla.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold">เหตุผล:</p>
                        <p className="text-gray-700">{dispute.reason_text}</p>
                      </div>

                      {dispute.evidence && dispute.evidence.length > 0 && (
                        <div>
                          <p className="font-semibold mb-2">หลักฐาน:</p>
                          <div className="space-y-2">
                            {dispute.evidence.map((ev: any, idx: number) => (
                              <a
                                key={idx}
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline block"
                              >
                                {ev.url}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm">
                          คืนเงิน
                        </Button>
                        <Button variant="outline" size="sm">
                          โอนเงินให้ผู้ขาย
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
