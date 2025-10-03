import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

export async function POST(request: Request) {
  const { message, slug, context } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Get page content if slug provided
  let pageContext = ''
  if (slug) {
    try {
      const filePath = join(process.cwd(), 'content/chapters', `${slug}.md`)
      const source = await readFile(filePath, 'utf8')
      const { data: frontmatter, content } = matter(source)
      pageContext = `\n\nCurrent Page: ${frontmatter.title}\n\n${content.substring(0, 2000)}`
    } catch {
      // Ignore if page not found
    }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sacred-madness.vercel.app',
        'X-Title': 'Sacred Madness Wiki'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'system',
            content: `You are a research assistant for the "Sacred Madness" academic wiki, which explores holy foolishness, divine intoxication, and mystical practices across Orthodox Christianity and Sufi Islam.

Your role is to:
- Help researchers understand complex concepts
- Suggest connections between ideas
- Generate research questions
- Explain theological and mystical terminology
- Be academically rigorous but accessible

The wiki covers: Byzantine saloi, Russian yurodivye, Sufi majdhub/mast, Abdals, Kalenderi dervishes, comparative mysticism, and the intersection of psychiatry and spirituality.${pageContext}`
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'AI request failed' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      message: data.choices[0].message.content
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to contact AI service' },
      { status: 500 }
    )
  }
}
