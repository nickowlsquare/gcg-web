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
          <Link
            href="/build"
            className={`text-sm transition-colors ${pathname === '/build' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Build
          </Link>
          <Link
            href="/top-decks"
            className={`text-sm transition-colors ${pathname === '/top-decks' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Top Decks
          </Link>
          <Link
            href="/counter"
            className={`text-sm transition-colors ${pathname === '/counter' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Counter
          </Link>
          <Link
            href="/tier-list"
            className={`text-sm transition-colors ${pathname === '/tier-list' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            Tier List
          </Link>
          <Link
            href="/history"
            className={`text-sm transition-colors ${pathname === '/history' ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  )
}
