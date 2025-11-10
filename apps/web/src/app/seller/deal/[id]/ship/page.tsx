"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const shipSchema = z.object({
  trackingNumber: z.string().min(1, "กรุณากรอกหมายเลขพัสดุ"),
  courier: z.string().min(1, "กรุณากรอกชื่อบริษัทขนส่ง"),
});

type ShipForm = z.infer<typeof shipSchema>;

export default function ShipDealPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShipForm>({
    resolver: zodResolver(shipSchema),
  });

  const onSubmit = async (data: ShipForm) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/deals/${dealId}/ship`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (res.ok) {
        router.push("/seller/dashboard");
      } else {
        alert("เกิดข้อผิดพลาด: " + (await res.text()));
      }
    } catch (error) {
      console.error("Error shipping deal:", error);
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
            <CardTitle>เพิ่มหมายเลขพัสดุ</CardTitle>
            <CardDescription>กรุณากรอกข้อมูลการจัดส่ง</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="trackingNumber">หมายเลขพัสดุ *</Label>
                <Input
                  id="trackingNumber"
                  {...register("trackingNumber")}
                  placeholder="เช่น TH123456789"
                />
                {errors.trackingNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.trackingNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="courier">บริษัทขนส่ง *</Label>
                <Input
                  id="courier"
                  {...register("courier")}
                  placeholder="เช่น Kerry Express, J&T Express"
                />
                {errors.courier && (
                  <p className="text-sm text-red-500 mt-1">{errors.courier.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
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
