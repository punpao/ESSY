"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@thai-escrow/ui";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    // Mock data
    setDisputes([
      {
        id: "dispute-001",
        deal_id: "deal-dispute-001",
        deal: {
          title: "Samsung Galaxy S23 Ultra",
          amount_satang: 3200000,
          seller: { display_name: "ผู้ขายA" },
          buyer: { display_name: "สมชาย ผู้ซื้อ" },
        },
        reason: "item_mismatch",
        reason_text: "สินค้าไม่ตรงกับรูป มีรอยขีดข่วน",
        status: "OPEN",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        evidence: [{ kind: "image", url: "..." }],
        sla: "due_24h",
        hours_open: 2,
      },
      {
        id: "dispute-002",
        deal_id: "deal-dispute-002",
        deal: {
          title: "iPhone 12",
          amount_satang: 1500000,
          seller: { display_name: "ผู้ขายB" },
          buyer: { display_name: "สมหญิง ผู้ซื้อ" },
        },
        reason: "not_delivered",
        reason_text: "ยังไม่ได้รับของ แต่ Tracking บอกว่าส่งแล้ว",
        status: "OPEN",
        created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
        evidence: [],
        sla: "due_48h",
        hours_open: 30,
      },
      {
        id: "dispute-003",
        deal_id: "deal-dispute-003",
        deal: {
          title: "MacBook Pro",
          amount_satang: 4500000,
          seller: { display_name: "ผู้ขายC" },
          buyer: { display_name: "ผู้ซื้อC" },
        },
        reason: "other",
        reason_text: "ของปลอม ไม่ใช่ของแท้",
        status: "OPEN",
        created_at: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
        evidence: [{ kind: "image" }, { kind: "image" }],
        sla: "overdue",
        hours_open: 80,
      },
    ]);
  }, []);

  const getSLABadge = (sla: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      due_24h: { label: "< 24h", variant: "success" },
      due_48h: { label: "< 48h", variant: "warning" },
      due_72h: { label: "< 72h", variant: "warning" },
      overdue: { label: "Overdue!", variant: "destructive" },
    };

    const { label, variant } = config[sla] || config.overdue;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      not_delivered: "ของยังไม่ถึง",
      item_mismatch: "ของไม่ตรงปก",
      other: "อื่น ๆ",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            🛡️ Thai Escrow - Admin
          </Link>
          <nav className="flex gap-4">
            <Link href="/admin/disputes">
              <Button variant="ghost">Disputes</Button>
            </Link>
            <Link href="/admin/deals">
              <Button variant="ghost">All Deals</Button>
            </Link>
            <Button variant="ghost">ออกจากระบบ</Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dispute Queue</h1>
          <div className="flex gap-2">
            <Badge variant="success">Open: {disputes.filter((d) => d.status === "OPEN").length}</Badge>
            <Badge variant="warning">
              Overdue: {disputes.filter((d) => d.sla === "overdue").length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{dispute.deal.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      ฿{(dispute.deal.amount_satang / 100).toLocaleString()}
                    </p>
                  </div>
                  {getSLABadge(dispute.sla)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ผู้ขาย:</span>{" "}
                      <span className="font-semibold">{dispute.deal.seller.display_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ผู้ซื้อ:</span>{" "}
                      <span className="font-semibold">{dispute.deal.buyer.display_name}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">ประเภท</p>
                    <p className="font-semibold">{getReasonLabel(dispute.reason)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">รายละเอียด</p>
                    <p className="text-sm">{dispute.reason_text}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-sm text-gray-600">
                      เปิดมาแล้ว {dispute.hours_open} ชั่วโมง •{" "}
                      {dispute.evidence.length} หลักฐาน
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/dispute/${dispute.id}`}>
                        <Button size="sm" variant="outline">
                          ดูรายละเอียด
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive">
                        คืนเงิน (Refund)
                      </Button>
                      <Button size="sm">ปล่อยเงิน (Release)</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {disputes.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <p>✅ ไม่มี Dispute ที่รอดำเนินการ</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
