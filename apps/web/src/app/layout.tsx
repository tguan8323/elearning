import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import './globals.css'
import { ServiceWorkerRegistration } from './service-worker-registration'

export const metadata: Metadata = {
  title: '家庭英语教学网站',
  description: '低刺激、家长陪伴式英语教学网页',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = { themeColor: '#315c52' }

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><ServiceWorkerRegistration />{children}</body>
    </html>
  )
}
