import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // تجربة وضعها في المستوى الأساسي أولاً
  // @ts-ignore - لتجاهل خطأ النوع إذا لم يتعرف عليها المحرر
  allowedDevOrigins: ['192.168.1.12', 'localhost:3000'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8001/api/:path*',
      },
    ];
  },

  // إعدادات إضافية لضمان عمل الـ WebSocket مع Turbopack
  experimental: {
    // إذا لم يعمل الحل أعلاه، جرب نقلها هنا وقم بإزالة التعليق:
    // allowedDevOrigins: ['192.168.1.12'],
  } as any, // استخدام any هنا يحل مشكلة الـ TypeScript التي ظهرت في صورتك
};

export default nextConfig;