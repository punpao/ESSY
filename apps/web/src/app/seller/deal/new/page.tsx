"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount_satang: "",
    buyer_note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.deals.create({
        title: formData.title,
        amount_satang: parseInt(formData.amount_satang) * 100, // Convert THB to satang
        buyer_note: formData.buyer_note || undefined,
      });

      alert(`สร้าง Paylink สำเร็จ!\n${result.paylink_url}`);
      router.push("/seller/dashboard");
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>สร้าง Paylink ใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">ชื่อสินค้า</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="เช่น iPhone 15 Pro Max 256GB"
                />
              </div>

              <div>
                <Label htmlFor="amount">ราคา (บาท)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount_satang}
                  onChange={(e) => setFormData({ ...formData, amount_satang: e.target.value })}
                  required
                  min="1"
                  placeholder="เช่น 45000"
                />
              </div>

              <div>
                <Label htmlFor="note">หมายเหตุสำหรับผู้ซื้อ (ไม่บังคับ)</Label>
                <Input
                  id="note"
                  value={formData.buyer_note}
                  onChange={(e) => setFormData({ ...formData, buyer_note: e.target.value })}
                  placeholder="เช่น สินค้าสภาพดี ใช้งานได้ปกติ"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "กำลังสร้าง..." : "สร้าง Paylink"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
