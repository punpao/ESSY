'use client';

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../../components/auth-provider";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";
import { createDeal } from "../../../../lib/api";

export default function NewDealPage() {
  const auth = useAuth();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ url: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!auth.token || auth.user?.role !== "seller") {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบในฐานะผู้ขาย</h1>
        <p className="mt-3 text-sm text-slate-600">
          เพื่อสร้าง Paylink กรุณากด “เข้าสู่ระบบผู้ขาย” ด้านบนก่อนนะคะ
        </p>
      </div>
    );
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !amount) {
      setError("กรุณากรอกชื่อดีลและราคา");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const amountTHB = Number(amount);
      if (Number.isNaN(amountTHB) || amountTHB <= 0) {
        setError("กรุณากรอกราคาที่ถูกต้อง");
        return;
      }
      const response = await createDeal(auth.token, {
        title,
        amountTHB
      });
      setResult({ url: response.paylinkUrl, message: response.message });
      setTitle("");
      setAmount("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.url) return;
    await navigator.clipboard.writeText(result.url);
    alert("คัดลอกลิงก์เรียบร้อย ส่งในแชทได้เลย!");
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl px-6 pb-16">
      <Card>
        <CardHeader>
          <CardTitle>สร้าง Paylink ใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ชื่อสินค้า / ดีล
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น รองเท้ามือสอง Nike Dunk Panda"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ราคา (บาท)
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "กำลังสร้าง..." : "สร้าง Paylink"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6 border-brand/40 bg-brand/5">
          <CardHeader>
            <CardTitle>ส่งลิงก์ให้ลูกค้าในแชทได้เลย</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">{result.message}</p>
            <div className="rounded-lg border border-brand/30 bg-white p-3 text-sm">
              <p className="break-words text-brand">{result.url}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleCopy}>คัดลอกลิงก์</Button>
              <Button asChild variant="outline">
                <Link href={result.url} target="_blank">
                  เปิดหน้า Paylink
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
