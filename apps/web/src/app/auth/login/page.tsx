'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shield, Mail, MessageSquare } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await api.requestOtp(email);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('code');
      alert('รหัส OTP ถูกส่งแล้ว! (ดูใน console logs ในโหมด dev)');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await api.loginWithEmail(email, code);
    if (result.error) {
      setError(result.error);
    } else {
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      
      // Redirect based on role
      if (result.data.user.role === 'admin') {
        router.push('/admin/disputes');
      } else if (result.data.user.role === 'seller') {
        router.push('/seller/dashboard');
      } else {
        router.push('/buyer/deals');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Thai Escrow</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
          <p className="text-gray-600">เพื่อซื้อขายอย่างปลอดภัย</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  อีเมล
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งรหัส OTP'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">หรือ</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                onClick={() => alert('LINE Login ยังไม่พร้อมใช้งานใน MVP นี้')}
              >
                <MessageSquare className="w-5 h-5" />
                เข้าสู่ระบบด้วย LINE
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัส OTP (6 หลัก)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  ส่งไปที่: {email}
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-blue-600 ml-2 hover:underline"
                  >
                    เปลี่ยน
                  </button>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังยืนยัน...' : 'ยืนยัน OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                ← กลับ
              </button>
            </form>
          )}

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">บัญชีทดสอบ (ใช้ OTP ใดก็ได้):</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• admin@escrow.local (Admin)</p>
              <p>• seller@escrow.local (Seller)</p>
              <p>• buyer@escrow.local (Buyer)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
