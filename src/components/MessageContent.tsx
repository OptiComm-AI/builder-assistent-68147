import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
  content: string;
}

export const MessageContent = ({ content }: MessageContentProps) => {
  return (
    <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent mb-4 mt-6">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-foreground mb-3 mt-5">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
            {children}
          </h3>
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 last:mb-0 text-foreground/90 whitespace-pre-wrap break-words overflow-hidden">
            {children}
          </p>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-1 text-foreground/90">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground/90">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="ml-4 break-words">{children}</li>
        ),
        
        // Code blocks
        code: ({ inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-lg my-4 overflow-x-auto"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
              {children}
            </code>
          );
        },
        
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-words"
          >
            {children}
          </a>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r">
            {children}
          </blockquote>
        ),
        
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-border">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-4 py-2">
            {children}
          </td>
        ),
        
        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-bold text-foreground break-words">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="my-6 border-border" />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
