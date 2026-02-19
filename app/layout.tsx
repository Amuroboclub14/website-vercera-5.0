import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { CursorCircularText } from '@/components/cursor-circular-text'
import { FloatingSocialNav } from '@/components/floating-social-nav'
import { BootloaderWrapper } from '@/components/bootloader-wrapper'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Vercera 5.0 - Technical Fest',
  description: 'Experience innovation at Vercera 5.0, the premier national-level technical fest featuring hackathons, robotics, gaming, and more.',
  keywords: 'tech fest, hackathon, robotics, gaming, technical events',
  icons: {
    icon: '/vercera_logo.png',
    apple: '/vercera_logo.png',
  },
  openGraph: {
    title: 'Vercera 5.0',
    description: 'National-level technical fest with multiple events',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#C1E734',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/vercera_logo.png" type="image/png" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        <CursorCircularText />
        <BootloaderWrapper>
          <SmoothScrollProvider>
            <AuthProvider>
              {children}
              <FloatingSocialNav />
            </AuthProvider>
          </SmoothScrollProvider>
        </BootloaderWrapper>
      </body>
    </html>
  )
}
