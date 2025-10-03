import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function Literature() {
  const litPath = path.join(process.cwd(), 'content', 'literature.md');
  const literature = fs.readFileSync(litPath, 'utf8');

  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <article className="prose prose-lg max-w-none">
          <ReactMarkdown>{literature}</ReactMarkdown>
        </article>

        <div className="mt-12 flex justify-between border-t border-gray-200 pt-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Abstract
          </Link>
          <Link
            href="/introduction"
            className="text-blue-600 hover:text-blue-800"
          >
            Introduction →
          </Link>
        </div>
      </div>
    </main>
  );
}
