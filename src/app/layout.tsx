import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MAC Auto Lab',
  description: 'Precisão • Tecnologia • Confiança',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} min-h-full bg-[#0D0D0D] text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
