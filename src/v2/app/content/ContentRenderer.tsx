import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { ContentBlock } from '../../domain/contentBlock';

const markdownRemarkPlugins = [remarkGfm, remarkMath];
const markdownRehypePlugins: any = [[rehypeKatex, {
  throwOnError: false,
  strict: 'ignore',
  errorColor: 'var(--color-error)',
}]];

export interface MarkdownContentProps {
  source: string;
  className?: string;
}

/** Safe local Markdown/math rendering. Raw HTML is deliberately not enabled. */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({ source, className }) => (
  <div className={className}>
    <ReactMarkdown
      skipHtml
      remarkPlugins={markdownRemarkPlugins}
      rehypePlugins={markdownRehypePlugins}
      components={{
        a: ({ children, node: _node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        pre: ({ children, node: _node }) => (
          <pre className="overflow-x-auto whitespace-pre rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-4 font-mono text-sm">
            {children}
          </pre>
        ),
        code: ({ children, className: codeClassName, node: _node, ...props }) => (
          <code {...props} className={`${codeClassName ?? ''} font-mono`}>
            {children}
          </code>
        ),
      }}
    >
      {source}
    </ReactMarkdown>
  </div>
);

export interface ContentBlocksProps {
  blocks: readonly ContentBlock[];
  className?: string;
}

export const ContentBlocks: React.FC<ContentBlocksProps> = ({ blocks, className }) => (
  <div className={className} data-testid="content-blocks">
    {blocks.map((block, index) => {
      if (block.type === 'text') {
        return (
          <MarkdownContent
            key={index}
            source={block.content}
            className="content-markdown"
          />
        );
      }
      if (block.type === 'code') {
        return (
          <div key={index} className="my-4" data-testid="content-code-block">
            {block.language && (
              <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--muted-color)]">
                {block.language}
              </div>
            )}
            <pre className="overflow-x-auto whitespace-pre rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-4 text-sm">
              <code className="font-mono">{block.content}</code>
            </pre>
          </div>
        );
      }
      return (
        <MarkdownContent
          key={index}
          source={`$$\n${block.content}\n$$`}
          className="my-4 overflow-x-auto text-center content-math"
        />
      );
    })}
  </div>
);