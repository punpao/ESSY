"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function KYCPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    promptpay_id: "",
    promptpay_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.seller.verifyBasic(formData);
      setSubmitted(true);
      alert("ส่งข้อมูล KYC สำเร็จ รอการอนุมัติ");
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
            <CardTitle>ยืนยันตัวตนผู้ขาย (KYC)</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <Badge className="mb-4">รอการอนุมัติ</Badge>
                <p className="text-gray-600">
                  ข้อมูลของคุณถูกส่งแล้ว รอผู้ดูแลระบบตรวจสอบ
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="promptpay_id">เลข PromptPay</Label>
              <Input
                id="promptpay_id"
                value={formData.promptpay_id}
                onChange={(e) => setFormData({ ...formData, promptpay_id: e.target.value })}
                required
                placeholder="เช่น 0812345678"
                minLength={10}
                maxLength={13}
              />
            </div>

            <div>
              <Label htmlFor="promptpay_name">ชื่อใน PromptPay</Label>
              <Input
                id="promptpay_name"
                value={formData.promptpay_name}
                onChange={(e) => setFormData({ ...formData, promptpay_name: e.target.value })}
                required
                placeholder="ชื่อที่แสดงใน PromptPay"
              />
            </div>

            <div>
              <Label htmlFor="selfie">รูป Selfie พร้อมบัตรประชาชน (Mock)</Label>
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                disabled
                className="opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                [Mock] ในเวอร์ชันจริงจะมีการอัปโหลดไฟล์
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "กำลังส่ง..." : "ส่งข้อมูล KYC"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  </div>
</div>
  );
}
