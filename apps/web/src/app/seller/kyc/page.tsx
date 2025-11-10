"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@thai-escrow/ui";
import { CheckCircle } from "lucide-react";

export default function SellerKycPage() {
  const [formData, setFormData] = useState({
    promptpay_id: "",
    promptpay_name: "",
    selfie_url: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock submission
      setTimeout(() => {
        alert("✅ ส่งข้อมูล KYC สำเร็จ!\n\nรอทีมงานตรวจสอบภายใน 24-48 ชั่วโมง");
        window.location.href = "/seller/dashboard";
      }, 1000);
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
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
            <CardTitle>Verified Seller - ยืนยันตัวตน</CardTitle>
            <CardDescription>
              กรอกข้อมูล KYC เพื่อเป็น Verified Seller และรับความเชื่อถือจากผู้ซื้อ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="font-semibold mb-2">✨ สิทธิพิเศษ Verified Seller:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                <li>แสดงเครื่องหมาย Verified บนโปรไฟล์</li>
                <li>เพิ่ม Reputation Score และความน่าเชื่อถือ</li>
                <li>รับเงินเร็วขึ้น (ลดเวลา Auto-release)</li>
                <li>ลดโอกาส Dispute จากผู้ซื้อ</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  หมายเลข PromptPay <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={10}
                  maxLength={20}
                  value={formData.promptpay_id}
                  onChange={(e) => setFormData({ ...formData, promptpay_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น 0812345678 หรือ 1234567890123"
                />
                <p className="text-xs text-gray-600 mt-1">
                  รองรับเบอร์มือถือ หรือเลขบัตรประชาชน
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ชื่อบัญชี PromptPay <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.promptpay_name}
                  onChange={(e) => setFormData({ ...formData, promptpay_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น นาย สมชาย ใจดี"
                />
                <p className="text-xs text-gray-600 mt-1">
                  ต้องตรงกับชื่อบัญชีธนาคารที่ผูกกับ PromptPay
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  อัปโหลดรูปถ่ายคู่บัตรประชาชน <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Mock upload
                        setFormData({
                          ...formData,
                          selfie_url: `https://example.com/uploads/${file.name}`,
                        });
                      }
                    }}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label htmlFor="selfie-upload" className="cursor-pointer">
                    <div className="text-gray-600">
                      {formData.selfie_url ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-600">อัปโหลดสำเร็จ</span>
                        </div>
                      ) : (
                        <>
                          <p className="mb-2">คลิกเพื่ออัปโหลดรูปภาพ</p>
                          <p className="text-sm">รองรับ JPG, PNG (สูงสุด 10MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  📸 ถ่ายรูปคู่บัตรประชาชน ให้เห็นหน้าและบัตรชัดเจน
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-1">🔒 ข้อมูลของคุณปลอดภัย</p>
                <p className="text-gray-700">
                  เราเก็บข้อมูลของคุณอย่างปลอดภัยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                  และใช้เพื่อการยืนยันตัวตนเท่านั้น
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? "กำลังส่งข้อมูล..." : "ส่งข้อมูล KYC"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
