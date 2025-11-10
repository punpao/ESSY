"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/utils";

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount_satang: "",
    buyer_note: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/deals", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          amount_satang: parseInt(formData.amount_satang) * 100, // Convert to satang
          buyer_note: formData.buyer_note,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/seller/deals/${data.deal.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>สร้าง Paylink ใหม่</CardTitle>
          <CardDescription>
            สร้างลิงก์สำหรับแชร์ในแชท เพื่อให้ผู้ซื้อชำระเงิน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อสินค้า</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="เช่น iPhone 13 Pro Max 256GB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ราคา (บาท)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.amount_satang}
                onChange={(e) => setFormData({ ...formData, amount_satang: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="35000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">หมายเหตุ (ไม่บังคับ)</label>
              <textarea
                value={formData.buyer_note}
                onChange={(e) => setFormData({ ...formData, buyer_note: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="ข้อมูลเพิ่มเติมสำหรับผู้ซื้อ"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "กำลังสร้าง..." : "สร้าง Paylink"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
