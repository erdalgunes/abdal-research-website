import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function Introduction() {
  const introPath = path.join(process.cwd(), 'content', 'introduction.md');
  const introduction = fs.readFileSync(introPath, 'utf8');

  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <article className="prose prose-lg max-w-none">
          <ReactMarkdown>{introduction}</ReactMarkdown>
        </article>

        <div className="mt-12 flex justify-between border-t border-gray-200 pt-8">
          <Link
            href="/literature"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Literature Review
          </Link>
          <Link
            href="/paper.pdf"
            target="_blank"
            className="text-blue-600 hover:text-blue-800"
          >
            Download PDF →
          </Link>
        </div>
      </div>
    </main>
  );
}
