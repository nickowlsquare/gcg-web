'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-bg-base/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/cards" className="text-accent-gold font-bold tracking-widest text-sm">
          ✦ GCG
        </Link>
        <div className="flex gap-6">
          <Link
            href="/cards"
            className={`text-sm transition-colors ${pathname === '/cards' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Cards
          </Link>
          <Link
            href="/builder"
            className={`text-sm transition-colors ${pathname === '/builder' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Builder
          </Link>
          <span className="text-sm text-white/20 cursor-not-allowed">Counter</span>
        </div>
      </div>
    </nav>
  )
}
