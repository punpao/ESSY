"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api";
import { Dispute } from "@/lib/types";
import { Button, Card, CardContent, CardHeader, CardTitle, ThaiEmptyState } from "@escrow/ui";
import { formatDateTime } from "@/lib/format";

type FilterStatus = "OPEN" | "RESOLVED_REFUND" | "RESOLVED_RELEASE" | "ALL";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadDisputes = async (status?: FilterStatus) => {
    try {
      const qs = status && status !== "ALL" ? `?status=${status}` : "";
      const data = await getJson<{ disputes: Dispute[] }>(`/admin/disputes${qs}`);
      setDisputes(data.disputes);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  useEffect(() => {
    void loadDisputes();
  }, []);

  const resolveDispute = async (id: string, action: "REFUND" | "RELEASE") => {
    const note = window.prompt("สรุปผลข้อพิพาท", action === "REFUND" ? "คืนเงินให้ผู้ซื้อ" : "ปล่อยเงินให้ผู้ขาย");
    if (!note) return;
    try {
      await postJson(`/disputes/${id}/resolve`, {
        action,
        note
      });
      setMessage("อัปเดตผลข้อพิพาทแล้ว");
      await loadDisputes();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ข้อพิพาท</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {(["ALL", "OPEN", "RESOLVED_REFUND", "RESOLVED_RELEASE"] as FilterStatus[]).map((status) => (
            <Button key={status} variant="secondary" onClick={() => void loadDisputes(status)}>
              {status}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการข้อพิพาท</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <ThaiEmptyState title="ไม่มีข้อพิพาท" description="เยี่ยม! ตอนนี้ไม่มีข้อพิพาทที่ต้องจัดการ" />
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{dispute.deal.title}</p>
                      <p className="text-slate-500">เหตุผล: {dispute.reasonText}</p>
                      <p className="text-xs text-slate-400">
                        เปิดเมื่อ {formatDateTime(dispute.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                        {dispute.status}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resolveDispute(dispute.id, "RELEASE")}
                      >
                        ปล่อยเงิน
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveDispute(dispute.id, "REFUND")}
                      >
                        คืนเงิน
                      </Button>
                    </div>
                  </div>
                  {dispute.evidences.length > 0 ? (
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {dispute.evidences.map((item) => (
                        <div key={item.id}>
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-sky-500">
                            หลักฐาน ({item.kind})
                          </a>{" "}
                          {item.note ? `- ${item.note}` : ""}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {message ? <p className="mt-3 text-xs text-slate-500">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
