"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const kycSchema = z.object({
  promptpayId: z.string().min(10).max(13, "PromptPay ID ต้องมี 10-13 หลัก"),
  promptpayName: z.string().min(1, "กรุณากรอกชื่อ"),
  selfieUrl: z.string().url().optional(),
});

type KYCForm = z.infer<typeof kycSchema>;

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KYCForm>({
    resolver: zodResolver(kycSchema),
  });

  const onSubmit = async (data: KYCForm) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/seller/verify/basic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            selfieUrl: data.selfieUrl || "https://example.com/selfie.jpg", // Mock URL
          }),
        }
      );

      if (res.ok) {
        alert("ส่งข้อมูลแล้ว รอการอนุมัติจากผู้ดูแลระบบ");
        router.push("/seller/dashboard");
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error submitting KYC:", error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>ยืนยันตัวตนผู้ขาย</CardTitle>
            <CardDescription>
              กรุณากรอกข้อมูล PromptPay และอัปโหลดรูปเซลฟี่เพื่อยืนยันตัวตน
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verified && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Verified Seller</Badge>
                  <p className="text-sm text-green-800">คุณได้ยืนยันตัวตนแล้ว</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="promptpayId">หมายเลข PromptPay *</Label>
                <Input
                  id="promptpayId"
                  {...register("promptpayId")}
                  placeholder="0812345678"
                  maxLength={13}
                />
                {errors.promptpayId && (
                  <p className="text-sm text-red-500 mt-1">{errors.promptpayId.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  หมายเลขโทรศัพท์หรือเลขบัตรประชาชน 10-13 หลัก
                </p>
              </div>

              <div>
                <Label htmlFor="promptpayName">ชื่อที่แสดงใน PromptPay *</Label>
                <Input
                  id="promptpayName"
                  {...register("promptpayName")}
                  placeholder="ชื่อของคุณ"
                />
                {errors.promptpayName && (
                  <p className="text-sm text-red-500 mt-1">{errors.promptpayName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="selfieUrl">URL รูปเซลฟี่ (ไม่บังคับ)</Label>
                <Input
                  id="selfieUrl"
                  type="url"
                  {...register("selfieUrl")}
                  placeholder="https://example.com/selfie.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ในโหมดพัฒนา ให้ใส่ URL รูปภาพ (Mock)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">ข้อมูลสำคัญ</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>ข้อมูลจะถูกตรวจสอบโดยทีมงาน</li>
                  <li>ผู้ขายที่ผ่านการยืนยันจะได้รับป้าย Verified Seller</li>
                  <li>การยืนยันตัวตนช่วยเพิ่มความน่าเชื่อถือ</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "กำลังส่ง..." : "ส่งข้อมูล"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
