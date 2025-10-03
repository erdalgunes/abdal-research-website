'use client'

import React, { useState, useEffect } from 'react'
import { Menu, ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

interface TocItem {
  id: string
  text: string
  level: number
}

interface WikiLayoutProps {
  children: React.ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
  tocItems?: TocItem[]
}

export default function WikiLayout({
  children,
  breadcrumbs = [{ label: 'Home', href: '/' }],
  tocItems = []
}: WikiLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTocItem, setActiveTocItem] = useState<string>('')

  useEffect(() => {
    if (tocItems.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveTocItem(entry.target.id)
            }
          })
        },
        { rootMargin: '-20% 0px -35% 0px' }
      )

      tocItems.forEach((item) => {
        const element = document.getElementById(item.id)
        if (element) observer.observe(element)
      })

      return () => observer.disconnect()
    }
  }, [tocItems])

  const scrollToTocItem = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu for Mobile */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <WikiSidebar />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Home className="h-6 w-6" />
              <span className="hidden sm:inline">Sacred Madness</span>
            </Link>

            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex-1" />

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 px-4 py-3 bg-muted/50 border-b text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label}>
            {index > 0 && <span className="text-muted-foreground mx-1">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Main Layout */}
      <div className="flex">
        {/* Collapsible Sidebar (Desktop) */}
        <div className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'} overflow-hidden`}>
          <div className="sticky top-16 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto">
            <WikiSidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <article className="prose prose-gray dark:prose-invert max-w-none">
              {children}
            </article>
          </div>
        </main>

        {/* Sticky Table of Contents */}
        {tocItems.length > 0 && (
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-20 p-4">
              <div className="border rounded-lg p-4 bg-background">
                <h2 className="text-lg font-semibold mb-4">Contents</h2>
                <nav>
                  <ol className="space-y-2">
                    {tocItems.map((item, index) => (
                      <li
                        key={index}
                        style={{ marginLeft: `${(item.level - 2) * 16}px` }}
                      >
                        <button
                          onClick={() => scrollToTocItem(item.id)}
                          className={`text-left text-sm hover:text-primary transition-colors ${
                            activeTocItem === item.id
                              ? 'font-medium text-primary'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

// Sidebar Component
function WikiSidebar() {
  const navigation = [
    {
      title: 'Holy Fools & Christianity',
      items: [
        { title: 'Origins and Meanings', href: '/wiki/the-tradition-of-the-holy-fool-origins-and-meanings' },
        { title: 'Survey of Holy Fools', href: '/wiki/the-tradition-across-time-and-space-a-survey-of-holy-fools' },
        { title: 'Deep Dives', href: '/wiki/theological-and-cultural-patterns-six-deep-dives' },
      ]
    },
    {
      title: 'Mental Health & Care',
      items: [
        { title: 'St. Dymphna & Geel', href: '/wiki/st-dymphna-geel-and-the-social-care-of-madness' },
        { title: 'Psychiatry & Neuroscience', href: '/wiki/psychiatry-neuroscience-and-the-mystical-brain' },
        { title: 'Bipolar II Reflections', href: '/wiki/bipolar-ii-and-the-mystic-practical-reflections' },
      ]
    },
    {
      title: 'Sufi Traditions',
      items: [
        { title: 'Intoxication & Sobriety', href: '/wiki/sufi-concepts-of-intoxication-and-sobriety' },
        { title: 'Abdals & Kalenderi', href: '/wiki/abdals-the-kalenderi-and-antinomian-dervishes' },
        { title: 'Majdhub / Mast', href: '/wiki/majdhub-mast-the-attracted-and-the-drunken' },
        { title: 'Kaygusuz Abdal', href: '/wiki/kaygusuz-abdal-and-alevi-mysticism' },
      ]
    },
    {
      title: 'Comparative Analysis',
      items: [
        { title: 'Theologies of Ecstasy', href: '/wiki/theologies-of-ecstasy-fools-and-divine-irrationality' },
        { title: 'Language & Metaphor', href: '/wiki/language-metaphor-and-the-risk-of-misreading' },
        { title: 'Phenomenology', href: '/wiki/phenomenology-overlaps-and-distinctions' },
      ]
    },
  ]

  return (
    <div className="p-4">
      <nav className="space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-2 px-3 rounded hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
