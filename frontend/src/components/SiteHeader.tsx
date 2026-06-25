'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/deputados', label: 'Deputados' },
  { href: '/temas', label: 'Temas' },
]

function ativo(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-forest text-cream">
      <div className="mx-auto flex h-[66px] max-w-[1080px] items-center justify-between px-7">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gold font-serif text-[17px] font-bold text-forest">
            L
          </span>
          <span className="font-serif text-[21px] font-semibold tracking-tight">
            Lei <span className="italic opacity-55">&amp;</span> Política
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const on = ativo(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[9px] px-[15px] py-[9px] text-[14.5px] font-semibold transition-colors ${
                  on ? 'bg-gold/15 text-gold' : 'text-cream/80 hover:text-cream'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
