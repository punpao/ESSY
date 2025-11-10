"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/utils";

interface SellerProfile {
  verified: boolean;
  promptpay_id: string;
  promptpay_name: string;
  kyc_status: string;
}

export default function KYCPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    promptpay_id: "",
    promptpay_name: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await apiFetch("/seller/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          promptpay_id: data.promptpay_id || "",
          promptpay_name: data.promptpay_name || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await apiFetch("/seller/verify/basic", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        alert("ส่งข้อมูลแล้ว รอการตรวจสอบ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>ยืนยันตัวตนผู้ขาย</CardTitle>
          <CardDescription>
            กรอกข้อมูล PromptPay และอัปโหลดรูปภาพเพื่อยืนยันตัวตน
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.verified && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="default">✓ Verified Seller</Badge>
                <span className="text-sm text-gray-600">
                  คุณได้รับการยืนยันแล้ว
                </span>
              </div>
            </div>
          )}

          {profile?.kyc_status === "pending" && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                กำลังรอการตรวจสอบ กรุณารอสักครู่
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                เลข PromptPay (เบอร์โทรศัพท์หรือเลขบัญชี)
              </label>
              <input
                type="text"
                required
                value={formData.promptpay_id}
                onChange={(e) => setFormData({ ...formData, promptpay_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0812345678"
                disabled={profile?.verified || profile?.kyc_status === "pending"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อใน PromptPay</label>
              <input
                type="text"
                required
                value={formData.promptpay_name}
                onChange={(e) => setFormData({ ...formData, promptpay_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="ชื่อของคุณ"
                disabled={profile?.verified || profile?.kyc_status === "pending"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">อัปโหลดรูปภาพ (Mock)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 border rounded-md"
                disabled={profile?.verified || profile?.kyc_status === "pending"}
              />
              <p className="text-xs text-gray-500 mt-1">
                ในระบบจริงจะมีการตรวจสอบ liveness
              </p>
            </div>
            {!profile?.verified && profile?.kyc_status !== "pending" && (
              <Button type="submit" disabled={submitting}>
                {submitting ? "กำลังส่ง..." : "ส่งข้อมูลเพื่อยืนยัน"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
