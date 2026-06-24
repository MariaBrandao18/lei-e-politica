import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lei e Política',
  description:
    'Acompanhe o comportamento de voto dos deputados federais por tema e descubra como a ciência de dados prevê posicionamentos parlamentares.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-bold text-blue-700">
              Lei e Política
            </a>
            <nav className="flex gap-6 text-sm font-medium text-gray-600">
              <a href="/" className="hover:text-blue-700">
                Início
              </a>
              <a href="/deputados" className="hover:text-blue-700">
                Deputados
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
          Dados abertos da Câmara dos Deputados · Projeto acadêmico CEUB
        </footer>
      </body>
    </html>
  )
}
