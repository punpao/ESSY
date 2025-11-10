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
import { Textarea } from "@/components/ui/textarea";

const createDealSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  amountSatang: z.number().int().positive("กรุณากรอกจำนวนเงิน"),
  buyerNote: z.string().optional(),
});

type CreateDealForm = z.infer<typeof createDealSchema>;

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDealForm>({
    resolver: zodResolver(createDealSchema),
  });

  const onSubmit = async (data: CreateDealForm) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amountSatang: data.amountSatang * 100, // Convert THB to satang
        }),
      });

      if (res.ok) {
        const deal = await res.json();
        router.push(`/seller/dashboard`);
      } else {
        alert("เกิดข้อผิดพลาด: " + (await res.text()));
      }
    } catch (error) {
      console.error("Error creating deal:", error);
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
            <CardTitle>สร้าง Paylink ใหม่</CardTitle>
            <CardDescription>สร้างลิงก์ชำระเงินสำหรับสินค้าของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title">ชื่อสินค้า *</Label>
                <Input id="title" {...register("title")} placeholder="เช่น iPhone 15 Pro Max" />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label htmlFor="amountSatang">ราคา (บาท) *</Label>
                <Input
                  id="amountSatang"
                  type="number"
                  {...register("amountSatang", { valueAsNumber: true })}
                  placeholder="45000"
                />
                {errors.amountSatang && (
                  <p className="text-sm text-red-500 mt-1">{errors.amountSatang.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="buyerNote">หมายเหตุสำหรับผู้ซื้อ (ไม่บังคับ)</Label>
                <Textarea
                  id="buyerNote"
                  {...register("buyerNote")}
                  placeholder="เช่น ส่งฟรีทั่วประเทศ"
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "กำลังสร้าง..." : "สร้าง Paylink"}
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
