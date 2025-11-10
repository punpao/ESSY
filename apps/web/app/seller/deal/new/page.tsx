"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";
import { postJson } from "@/lib/api";
import Link from "next/link";

interface CreateDealResponse {
  deal: {
    id: string;
    paylinkToken: string;
  };
  paylink_url: string;
}

export default function SellerCreateDealPage() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<CreateDealResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        title,
        amount_thb: Number(amount),
        buyer_note: note
      };
      const data = await postJson<CreateDealResponse>("/deals", payload);
      setResult(data);
      setTitle("");
      setAmount("");
      setNote("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สร้าง Paylink ใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
            <div>
              <label className="block text-slate-600">ชื่อดีล / รายการสินค้า</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-600">ราคา (บาท)</label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-600">โน้ตถึงผู้ซื้อ (optional)</label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="แจ้งรายละเอียดเพิ่มเติมหรือเลขไลน์ที่จะส่งลิงก์"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>
                สร้าง Paylink
              </Button>
              <Link href="/seller/dashboard">
                <Button variant="ghost">ย้อนกลับแดชบอร์ด</Button>
              </Link>
            </div>
            {message ? <p className="text-xs text-rose-500">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Paylink ของคุณ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ส่งลิงก์นี้ให้ผู้ซื้อผ่านแชท:{" "}
              <a href={result.paylink_url} className="text-sky-600" target="_blank" rel="noreferrer">
                {result.paylink_url}
              </a>
            </p>
            <p className="text-xs text-slate-500">
              ระบบจะพักเงินให้อัตโนมัติทันทีที่ผู้ซื้อชำระและสแกนผ่าน PromptPay
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
