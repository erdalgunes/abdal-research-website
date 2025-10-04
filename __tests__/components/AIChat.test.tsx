import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIChat } from '@/components/AIChat'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render chat button when closed', () => {
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    expect(chatButton).toBeInTheDocument()
    expect(chatButton).toHaveAttribute('aria-label', 'Open AI Research Assistant')
  })

  it('should not render chat interface initially', () => {
    render(<AIChat />)
    
    expect(screen.queryByText('AI Research Assistant')).not.toBeInTheDocument()
  })

  it('should open chat interface when button is clicked', async () => {
    const user = userEvent.setup()
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    await user.click(chatButton)
    
    expect(screen.getByText('AI Research Assistant')).toBeInTheDocument()
    expect(screen.getByText('Ask me anything about this research!')).toBeInTheDocument()
  })

  it('should render quick action buttons when open', async () => {
    const user = userEvent.setup()
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    await user.click(chatButton)
    
    expect(screen.getByText('Explain')).toBeInTheDocument()
    expect(screen.getByText('Find Connections')).toBeInTheDocument()
    expect(screen.getByText('Find Sources')).toBeInTheDocument()
  })

  it('should populate input when quick action is clicked', async () => {
    const user = userEvent.setup()
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    await user.click(chatButton)
    
    const explainButton = screen.getByText('Explain')
    await user.click(explainButton)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    expect(input).toHaveValue('Explain this concept')
  })

  it('should render input field and submit elements', async () => {
    const user = userEvent.setup()
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    await user.click(chatButton)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should display proper branding', async () => {
    const user = userEvent.setup()
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    await user.click(chatButton)
    
    expect(screen.getByText('Powered by Claude Sonnet 4.5 + Tavily')).toBeInTheDocument()
  })

  it('should accept text input', async () => {
    const user = userEvent.setup()
    render(<AIChat />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    await user.click(chatButton)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    await user.type(input, 'Test question')
    
    expect(input).toHaveValue('Test question')
  })

  it('should render with custom slug prop', () => {
    render(<AIChat slug="test-page" />)
    
    const chatButton = screen.getByRole('button', { name: /open ai research assistant/i })
    expect(chatButton).toBeInTheDocument()
  })

  it('should handle empty initial state', () => {
    render(<AIChat />)
    
    // Component should render without errors
    expect(screen.getByRole('button', { name: /open ai research assistant/i })).toBeInTheDocument()
  })
})