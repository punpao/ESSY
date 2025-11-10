"use client";

import { useEffect, useState } from "react";
import { AuthToolbar } from "../../../components/AuthToolbar";
import { apiRequest } from "../../../components/api-client";
import { Badge, Button, Card, CardContent, CardHeader } from "@thai-social-escrow/ui";

interface Dispute {
  id: string;
  status: string;
  reasonText: string;
  deal: { id: string; title: string; sellerId: string; buyerId: string | null };
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [message, setMessage] = useState("");

  const loadDisputes = async () => {
    try {
      const data = await apiRequest<{ disputes: Dispute[] }>("/admin/disputes");
      setDisputes(data.disputes);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "โหลดรายการข้อพิพาทไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const resolve = async (disputeId: string, decision: "RESOLVED_REFUND" | "RESOLVED_RELEASE") => {
    try {
      await apiRequest(`/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: { decision, note: decision === "RESOLVED_REFUND" ? "คืนเงินให้ผู้ซื้อ" : "ปล่อยเงินให้ผู้ขาย" }
      });
      setMessage("ดำเนินการข้อพิพาทแล้ว");
      loadDisputes();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <h1 className="text-2xl font-semibold text-emerald-700">ศูนย์ข้อพิพาท</h1>
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      <div className="space-y-3">
        {disputes.map((dispute) => (
          <Card key={dispute.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{dispute.deal.title}</h3>
                <p className="text-xs text-slate-500">เหตุผล: {dispute.reasonText}</p>
              </div>
              <Badge tone={dispute.status}>{translateStatus(dispute.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>เปิดเมื่อ: {new Date(dispute.createdAt).toLocaleString("th-TH")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => resolve(dispute.id, "RESOLVED_RELEASE")} disabled={dispute.status !== "OPEN"}>
                  ปล่อยเงินให้ผู้ขาย
                </Button>
                <Button variant="ghost" onClick={() => resolve(dispute.id, "RESOLVED_REFUND")} disabled={dispute.status !== "OPEN"}>
                  คืนเงินให้ผู้ซื้อ
                </Button>
              </div>
              <a className="text-emerald-600 underline" href={`/buyer/dispute/${dispute.id}`}>
                ดูรายละเอียด
              </a>
            </CardContent>
          </Card>
        ))}
        {disputes.length === 0 && <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">ไม่มีข้อพิพาทค้างอยู่</div>}
      </div>
    </div>
  );
}

function translateStatus(status: string) {
  switch (status) {
    case "OPEN":
      return "รอตรวจสอบ";
    case "NEED_MORE_INFO":
      return "รอข้อมูลเพิ่ม";
    case "RESOLVED_REFUND":
      return "คืนเงินแล้ว";
    case "RESOLVED_RELEASE":
      return "ปล่อยเงินแล้ว";
    default:
      return status;
  }
}
