"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  amountSatang: z.number().int().positive("กรุณากรอกจำนวนเงิน"),
  buyerNote: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await api.createDeal({
        title: data.title,
        amountSatang: data.amountSatang * 100, // Convert THB to satang
        buyerNote: data.buyerNote,
      });

      alert(`สร้าง Paylink สำเร็จ: ${result.paylinkUrl}`);
      router.push("/seller/dashboard");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>สร้าง Paylink ใหม่</CardTitle>
          <CardDescription>
            สร้างลิงก์สำหรับให้ผู้ซื้อชำระเงิน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
              <Input
                {...register("title")}
                placeholder="เช่น iPhone 14 Pro Max"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ราคา (บาท)</label>
              <Input
                {...register("amountSatang", { valueAsNumber: true })}
                type="number"
                placeholder="45000"
              />
              {errors.amountSatang && (
                <p className="text-red-500 text-sm mt-1">{errors.amountSatang.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ (ไม่บังคับ)</label>
              <Textarea
                {...register("buyerNote")}
                rows={3}
                placeholder="ข้อมูลเพิ่มเติมสำหรับผู้ซื้อ"
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
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
