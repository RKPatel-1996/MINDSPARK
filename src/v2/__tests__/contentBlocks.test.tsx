import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  codeContentBlockSchema,
  contentBlocksSchema,
  mathContentBlockSchema,
  textContentBlockSchema,
} from '../domain/contentBlock';
import { knowledgeItemSchema } from '../domain/knowledge';
import { transformDraftToDomain } from '../import/transformDraft';
import type { TaxonomyRegistry } from '../domain/taxonomy';
import { ContentBlocks, MarkdownContent } from '../app/content/ContentRenderer';

const registry: TaxonomyRegistry = {
  domains: [{ id: 'computing', name: 'Computing' }],
  topics: [{ id: 'code', domainId: 'computing', name: 'Code' }],
  subtopics: [],
  allowedTags: [],
};

const baseItem = {
  id: '11111111-1111-4111-8111-111111111111',
  schemaVersion: 1 as const,
  title: 'Blocks',
  content: 'Text-only summary',
  taxonomy: { domainId: 'computing', topicId: 'code' },
  status: 'active' as const,
  createdAt: '2026-09-22T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
};

describe('text, code, and math content blocks', () => {
  it('validates strict block variants and rejects blank or unknown content', () => {
    expect(textContentBlockSchema.parse({ type: 'text', content: '# Heading' })).toEqual({
      type: 'text', content: '# Heading',
    });
    expect(codeContentBlockSchema.parse({ type: 'code', content: 'echo ok' })).toEqual({
      type: 'code', content: 'echo ok',
    });
    expect(mathContentBlockSchema.parse({ type: 'math', content: 'E = mc^2' })).toEqual({
      type: 'math', content: 'E = mc^2',
    });
    expect(() => contentBlocksSchema.parse([{ type: 'code', content: '   ' }])).toThrow();
    expect(() => contentBlocksSchema.parse([{ type: 'video', content: 'x' }])).toThrow();
    expect(() => textContentBlockSchema.parse({ type: 'text', content: 'x', html: true })).toThrow();
  });

  it('preserves code whitespace, optional language, math source, and block order', () => {
    const code = "  def answer():\n\treturn 42\n";
    const math = "\\frac{a+b}{c}";
    const blocks = [
      { type: 'text' as const, content: '**Context**' },
      { type: 'code' as const, language: 'python', content: code },
      { type: 'math' as const, content: math },
      { type: 'code' as const, content: 'plain()' },
    ];

    const item = knowledgeItemSchema.parse({ ...baseItem, blocks });
    expect(item.blocks).toEqual(blocks);
    expect(item.blocks?.[1]).toMatchObject({ language: 'python', content: code });
    expect(item.blocks?.[3]).not.toHaveProperty('language');
  });

  it('imports text, code, and math without trimming exact block source', () => {
    const code = "  console.log('hello');\n";
    const math = "  x^2 + y^2 = z^2  ";
    const result = transformDraftToDomain({
      item: {
        title: 'Imported blocks',
        content: 'Searchable summary',
        blocks: [
          { type: 'text', content: '## Markdown text' },
          { type: 'code', language: 'typescript', content: code },
          { type: 'math', content: math },
        ],
        taxonomy: { domainId: 'computing', topicId: 'code' },
      },
      cards: [{ type: 'flashcard', front: 'Prompt', back: 'Answer' }],
    }, registry);

    expect(result.knowledgeItem.blocks?.map((block) => block.type)).toEqual(['text', 'code', 'math']);
    expect(result.knowledgeItem.blocks?.[1].content).toBe(code);
    expect(result.knowledgeItem.blocks?.[2].content).toBe(math);
  });

  it('renders code as inert copy-friendly text with whitespace intact', () => {
    const source = "  <script>alert('never')</script>\n\treturn value;";
    render(<ContentBlocks blocks={[{ type: 'code', language: 'html', content: source }]} />);

    const code = screen.getByTestId('content-code-block').querySelector('code');
    expect(code?.textContent).toBe(source);
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText('html')).toBeDefined();
  });

  it('escapes raw HTML, blocks executable URLs, and renders local math with invalid-source fallback', () => {
    const { container, rerender } = render(
      <MarkdownContent source={'<img src=x onerror="alert(1)"> **safe** [bad](javascript:alert(2))'} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('safe')).toBeDefined();
    const link = screen.getByText('bad').closest('a');
    expect(link?.getAttribute('href') ?? '').not.toMatch(/^javascript:/i);

    rerender(<ContentBlocks blocks={[{ type: 'math', content: '\\frac{' }]} />);
    expect(container.textContent).toContain('\\frac{');
  });
});