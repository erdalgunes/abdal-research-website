import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function Home() {
  const abstractPath = path.join(process.cwd(), 'content', 'abstract.md');
  const abstract = fs.readFileSync(abstractPath, 'utf8');

  return (
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title and Author */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            From Saloi to Abdal: Religious Continuity and Holy Foolishness in Anatolian Conversion to Islam
          </h1>
          <p className="text-lg text-gray-600">
            Erdal Günes
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <a href="mailto:erdalgns@gmail.com" className="hover:text-gray-700">
              erdalgns@gmail.com
            </a>
          </p>
        </div>

        {/* Abstract */}
        <div className="prose prose-lg max-w-none mb-12">
          <ReactMarkdown>{abstract}</ReactMarkdown>
        </div>

        {/* Download PDF */}
        <div className="text-center py-8 border-t border-gray-200">
          <Link
            href="/paper.pdf"
            target="_blank"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Download Full Paper (PDF)
          </Link>
        </div>

        {/* Navigation to Sections */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/literature"
            className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Literature Review</h2>
            <p className="text-gray-600">
              Historiographical paradigms, Byzantine holy fools, and Abdalan-i Rum scholarship.
            </p>
          </Link>
          <Link
            href="/introduction"
            className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Introduction</h2>
            <p className="text-gray-600">
              The problem of religious continuity across Anatolia's transformation.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
