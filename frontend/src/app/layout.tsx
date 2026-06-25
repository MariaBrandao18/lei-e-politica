import type { Metadata } from 'next'
import { Newsreader, Public_Sans } from 'next/font/google'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const sans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lei & Política',
  description:
    'Transparência parlamentar com dados: como cada deputado federal vota, tema por tema, em linguagem clara.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-[1080px] flex-wrap justify-between gap-2.5 px-7 py-[26px] text-[13px] text-faint">
            <span>Lei &amp; Política · MVP acadêmico — CEUB, Ciência de Dados</span>
            <span>Fonte: Dados Abertos da Câmara dos Deputados</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
