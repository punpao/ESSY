"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@thai-escrow/ui";

export default function NewDealPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    buyer_note: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call
      const paylinkToken = `paylink-${Date.now()}`;
      const paylinkUrl = `${window.location.origin}/pay/${paylinkToken}`;

      alert(`✅ สร้าง Paylink สำเร็จ!\n\nแชร์ลิงก์นี้ให้ผู้ซื้อ:\n${paylinkUrl}`);
      router.push("/seller/dashboard");
    } catch (error) {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/seller/dashboard" className="text-blue-600 hover:underline">
            ← กลับไปหน้าแรก
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>สร้าง Paylink ใหม่</CardTitle>
            <CardDescription>
              สร้างลิงก์ชำระเงินแชร์ให้ผู้ซื้อใน Facebook, Instagram, หรือ LINE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  ชื่อสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น iPhone 13 Pro มือสอง สภาพดี"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="25000"
                />
                {formData.amount && (
                  <p className="text-sm text-gray-600 mt-1">
                    ฿{parseFloat(formData.amount).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">หมายเหตุถึงผู้ซื้อ</label>
                <textarea
                  value={formData.buyer_note}
                  onChange={(e) => setFormData({ ...formData, buyer_note: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                  placeholder="เช่น สินค้ามีจำนวนจำกัด รับประกัน 7 วัน"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">💡 วิธีใช้งาน:</p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>สร้าง Paylink และแชร์ลิงก์ให้ผู้ซื้อ</li>
                  <li>ผู้ซื้อจ่ายเงินผ่าน PromptPay → เงินจะถูกพัก</li>
                  <li>คุณส่งสินค้าและใส่เลขพัสดุ</li>
                  <li>ระบบปล่อยเงินเมื่อผู้ซื้อยืนยัน หรือ 48 ชม. หลังจัดส่ง</li>
                </ol>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "กำลังสร้าง..." : "สร้าง Paylink"}
                </Button>
                <Link href="/seller/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    ยกเลิก
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
