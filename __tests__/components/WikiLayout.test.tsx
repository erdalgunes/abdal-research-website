import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WikiLayout from '@/components/WikiLayout'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  }
}))

// Mock ThemeToggle component
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>
}))

describe('WikiLayout', () => {
  it('should render children content', () => {
    render(
      <WikiLayout>
        <div data-testid="test-content">Test Content</div>
      </WikiLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render default breadcrumbs', () => {
    render(
      <WikiLayout>
        <div>Content</div>
      </WikiLayout>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('should render custom breadcrumbs', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Wiki', href: '/wiki' },
      { label: 'Current Page' }
    ]

    render(
      <WikiLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </WikiLayout>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Wiki')).toBeInTheDocument()
    expect(screen.getByText('Current Page')).toBeInTheDocument()
  })

  it('should render table of contents when tocItems are provided', () => {
    const tocItems = [
      { id: 'section-1', text: 'Section 1', level: 2 },
      { id: 'section-2', text: 'Section 2', level: 2 },
      { id: 'subsection-1', text: 'Subsection 1', level: 3 }
    ]

    render(
      <WikiLayout tocItems={tocItems}>
        <div>Content</div>
      </WikiLayout>
    )

    expect(screen.getByText('Contents')).toBeInTheDocument()
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
    expect(screen.getByText('Subsection 1')).toBeInTheDocument()
  })

  it('should not render table of contents when tocItems is empty', () => {
    render(
      <WikiLayout tocItems={[]}>
        <div>Content</div>
      </WikiLayout>
    )

    expect(screen.queryByText('Contents')).not.toBeInTheDocument()
  })

  it('should render header with logo and navigation', () => {
    render(
      <WikiLayout>
        <div>Content</div>
      </WikiLayout>
    )

    expect(screen.getByText('Sacred Madness')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('should render sidebar navigation sections', () => {
    render(
      <WikiLayout>
        <div>Content</div>
      </WikiLayout>
    )

    // Check for main navigation sections
    expect(screen.getByText('Holy Fools & Christianity')).toBeInTheDocument()
    expect(screen.getByText('Mental Health & Care')).toBeInTheDocument()
    expect(screen.getByText('Sufi Traditions')).toBeInTheDocument()
    expect(screen.getByText('Comparative Analysis')).toBeInTheDocument()

    // Check for some navigation items
    expect(screen.getByText('Origins and Meanings')).toBeInTheDocument()
    expect(screen.getByText('St. Dymphna & Geel')).toBeInTheDocument()
    expect(screen.getByText('Intoxication & Sobriety')).toBeInTheDocument()
  })

  it('should render breadcrumb links correctly', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Wiki', href: '/wiki' },
      { label: 'Current Page' }
    ]

    render(
      <WikiLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </WikiLayout>
    )

    // Check that links have correct href attributes
    const homeLink = screen.getByRole('link', { name: 'Home' })
    const wikiLink = screen.getByRole('link', { name: 'Wiki' })
    
    expect(homeLink).toHaveAttribute('href', '/')
    expect(wikiLink).toHaveAttribute('href', '/wiki')
    
    // Current page should not be a link
    expect(screen.getByText('Current Page')).not.toHaveAttribute('href')
  })

  it('should apply proper styling classes', () => {
    const { container } = render(
      <WikiLayout>
        <div>Content</div>
      </WikiLayout>
    )

    // Check for main layout classes
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    expect(container.querySelector('.prose')).toBeInTheDocument()
  })
})