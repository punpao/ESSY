"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/email/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      if (res.ok) {
        setStep("otp");
        alert("OTP sent! Check console in dev mode.");
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/email/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        router.push("/seller/dashboard");
      } else {
        alert("OTP ไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ</CardTitle>
          <CardDescription>ใช้ LINE หรือ Email เพื่อเข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "กำลังส่ง..." : "ขอ OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Mock LINE login
                  alert("LINE Login (Mock) - In production, redirect to LINE OAuth");
                }}
              >
                เข้าสู่ระบบด้วย LINE
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="otp">รหัส OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ตรวจสอบคอนโซลในโหมดพัฒนาเพื่อดู OTP
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "กำลังตรวจสอบ..." : "ยืนยัน"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("email")}
                  className="flex-1"
                >
                  กลับ
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
