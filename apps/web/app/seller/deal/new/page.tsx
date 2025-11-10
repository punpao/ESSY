"use client";

import { FormEvent, useState } from "react";
import { AuthToolbar } from "../../../../components/AuthToolbar";
import { apiRequest } from "../../../../components/api-client";
import { Button, Card, CardContent, CardHeader } from "@thai-social-escrow/ui";

export default function SellerCreateDealPage() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paylinkUrl, setPaylinkUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const response = await apiRequest<{ paylinkUrl: string }>("/deals", {
        method: "POST",
        body: { title, amountThb: amount }
      });
      setPaylinkUrl(response.paylinkUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถสร้างเพย์ลิงก์ได้");
    }
  };

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-emerald-700">สร้าง Paylink ใหม่</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">ชื่อดีล / รายละเอียดสินค้า</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="รองเท้า Nike Dunk Low มือสอง"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">ราคา (บาท)</label>
              <input
                required
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit">สร้างเพย์ลิงก์</Button>
          </form>
          {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
          {paylinkUrl && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              แชร์ลิงก์นี้ให้ผู้ซื้อในแชท:{" "}
              <a href={paylinkUrl} className="font-semibold underline">
                {paylinkUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
