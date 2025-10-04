'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  slug?: string
}

export function AIChat({ slug }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          slug,
          context: messages
        })
      })

      const data = await response.json()

      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure API keys are configured.'
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to AI service'
      }])
    } finally {
      setLoading(false)
    }
  }

  const findCitations = async (topic: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic })
      })

      const data = await response.json()

      if (data.sources) {
        const citationsMessage = `Found ${data.sources.length} academic sources:\n\n` +
          data.sources.map((s: { title: string; url: string; snippet: string }, i: number) =>
            `${i + 1}. **${s.title}**\n   ${s.url}\n   ${s.snippet.substring(0, 150)}...`
          ).join('\n\n')

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: citationsMessage
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to find citations'
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="Open AI Research Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Research Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary/80 rounded p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-muted/50">
        <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInput('Explain this concept')}
            className="text-xs"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Explain
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInput('Find related concepts')}
            className="text-xs"
          >
            Find Connections
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => findCitations(slug || 'sacred madness')}
            className="text-xs"
          >
            Find Sources
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ask me anything about this research!</p>
            <p className="text-xs mt-2">I can explain concepts, find connections, or suggest academic sources.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Powered by Claude Sonnet 4.5 + Tavily
        </p>
      </div>
    </div>
  )
}
