import Link from 'next/link'
import { Book, Cross, Flame, Brain, Users, ScrollText } from 'lucide-react'
import WikiLayout from '@/components/WikiLayout'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const breadcrumbs = [{ label: 'Home' }]

  const sections = [
    {
      icon: Cross,
      title: 'Holy Fools & Christianity',
      description: 'Explore the Byzantine saloi and Russian yurodivye traditions of sacred madness',
      articles: [
        { title: 'Origins and Meanings', href: '/wiki/the-tradition-of-the-holy-fool-origins-and-meanings' },
        { title: 'Survey of Holy Fools', href: '/wiki/the-tradition-across-time-and-space-a-survey-of-holy-fools' },
        { title: 'Six Deep Dives', href: '/wiki/theological-and-cultural-patterns-six-deep-dives' },
      ],
      color: 'border-blue-500 dark:border-blue-400'
    },
    {
      icon: Flame,
      title: 'Sufi Mysticism',
      description: 'Discover the Abdals, Kalenderi dervishes, and majdhub traditions of Islamic spirituality',
      articles: [
        { title: 'Intoxication & Sobriety', href: '/wiki/sufi-concepts-of-intoxication-and-sobriety' },
        { title: 'Abdals & Kalenderi', href: '/wiki/abdals-the-kalenderi-and-antinomian-dervishes' },
        { title: 'Kaygusuz Abdal', href: '/wiki/kaygusuz-abdal-and-alevi-mysticism' },
      ],
      color: 'border-green-500 dark:border-green-400'
    },
    {
      icon: Brain,
      title: 'Mental Health & Spirituality',
      description: 'Examine the intersection of mystical experience and psychiatric understanding',
      articles: [
        { title: 'St. Dymphna & Geel', href: '/wiki/st-dymphna-geel-and-the-social-care-of-madness' },
        { title: 'Psychiatry & Neuroscience', href: '/wiki/psychiatry-neuroscience-and-the-mystical-brain' },
        { title: 'Bipolar II Reflections', href: '/wiki/bipolar-ii-and-the-mystic-practical-reflections' },
      ],
      color: 'border-purple-500 dark:border-purple-400'
    },
    {
      icon: ScrollText,
      title: 'Comparative Analysis',
      description: 'Cross-cultural perspectives on ecstasy, divine madness, and spiritual transgression',
      articles: [
        { title: 'Theologies of Ecstasy', href: '/wiki/theologies-of-ecstasy-fools-and-divine-irrationality' },
        { title: 'Language & Metaphor', href: '/wiki/language-metaphor-and-the-risk-of-misreading' },
        { title: 'Phenomenology', href: '/wiki/phenomenology-overlaps-and-distinctions' },
      ],
      color: 'border-orange-500 dark:border-orange-400'
    },
  ]

  return (
    <WikiLayout breadcrumbs={breadcrumbs}>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Sacred Madness
        </h1>
        <p className="text-xl text-muted-foreground mb-4">
          Saints, Dervishes, and the Mystical Path
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          A comprehensive study of divine intoxication in Orthodox Christianity and Sufi Islam
        </p>
      </div>

      {/* Introduction */}
      <div className="prose prose-gray dark:prose-invert max-w-none mb-12">
        <p className="lead text-lg">
          When does ecstasy become pathology? When does divine intoxication shade into delusion?
          This wiki explores the contested boundary between mystical experience and what modern
          psychiatry calls &ldquo;madness&rdquo; across Christian and Islamic traditions.
        </p>
      </div>

      {/* Main Sections */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div
              key={section.title}
              className={`border-l-4 ${section.color} bg-card rounded-r-lg p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
                  <p className="text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {section.articles.map((article) => (
                  <li key={article.href}>
                    <Link
                      href={article.href}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                      <span>→</span>
                      <span>{article.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Featured Content */}
      <div className="border-t pt-8">
        <h2 className="text-3xl font-bold mb-6">Featured Content</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/wiki/preface"
            className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <Book className="h-8 w-8 mb-3 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Preface</h3>
            <p className="text-muted-foreground text-sm">
              Read about the author&apos;s lived experience with Bipolar II and Alevi Kalenderi Abdal heritage
            </p>
          </Link>

          <Link
            href="/wiki/introduction-why-sacred-madness"
            className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <Users className="h-8 w-8 mb-3 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Introduction</h3>
            <p className="text-muted-foreground text-sm">
              Understand the central questions: when does ecstasy become pathology?
            </p>
          </Link>

          <Link
            href="/wiki/conclusion-toward-an-ethics-of-sacred-difference"
            className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <ScrollText className="h-8 w-8 mb-3 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Conclusion</h3>
            <p className="text-muted-foreground text-sm">
              Explore an ethics of sacred difference in modern spiritual practice
            </p>
          </Link>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 bg-muted/50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Explore the Full Research</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          This wiki contains 20 comprehensive chapters exploring holy foolishness across religious traditions,
          from Byzantine saloi to Sufi abdals, with insights from psychiatry, neuroscience, and lived experience.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/wiki/the-tradition-of-the-holy-fool-origins-and-meanings">
            <Button size="lg">
              Start Reading
            </Button>
          </Link>
        </div>
      </div>
    </WikiLayout>
  )
}
