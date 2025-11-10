'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/email/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to send OTP');

      toast({
        title: 'OTP ส่งแล้ว',
        description: 'โปรดตรวจสอบอีเมลของคุณ (สำหรับ MVP: ใช้ 6 หลักใดก็ได้)',
      });
      setStep('otp');
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่ง OTP ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) throw new Error('Invalid OTP');

      const { token, user } = await res.json();
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: `ยินดีต้อนรับ ${user.displayName}`,
      });

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'seller') {
        router.push('/seller/dashboard');
      } else {
        router.push('/buyer/deals');
      }
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'OTP ไม่ถูกต้อง',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">SafePay Thailand</h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>เข้าสู่ระบบ</CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'กรอกอีเมลเพื่อรับ OTP'
                : 'กรอกรหัส OTP ที่ส่งไปที่อีเมล'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'กำลังส่ง...' : 'ส่ง OTP'}
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  <p>สำหรับ MVP: ใช้อีเมลใดก็ได้</p>
                  <p className="mt-2">Demo accounts:</p>
                  <p>buyer@example.com / seller@example.com / admin@example.com</p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">รหัส OTP (6 หลัก)</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('email')}
                >
                  ใช้อีเมลอื่น
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  <p>สำหรับ MVP: ใช้ 6 หลักใดก็ได้</p>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-primary hover:underline">
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
