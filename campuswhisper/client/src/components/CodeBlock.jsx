import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'
import { useEffect, useRef, useState } from 'react'

export default function CodeBlock({ code, language = 'javascript' }) {
  const codeRef = useRef(null)
  const [copied, setCopied] = useState(false)

  // Normalise language key
  const lang = language === 'cpp' ? 'cpp' : language

  const highlighted = (() => {
    try {
      const grammar = Prism.languages[lang] || Prism.languages.javascript
      return Prism.highlight(code, grammar, lang)
    } catch {
      return code
    }
  })()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[#0d1117] mt-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[var(--border)]">
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-0.5 rounded border border-[var(--border)] hover:border-[var(--accent-primary)]"
          aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <pre
        ref={codeRef}
        className={`language-${lang} !m-0 !rounded-none overflow-x-auto`}
        style={{ background: '#0d1117' }}
        aria-label={`Code block in ${language}`}
      >
        <code
          className={`language-${lang}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  )
}
