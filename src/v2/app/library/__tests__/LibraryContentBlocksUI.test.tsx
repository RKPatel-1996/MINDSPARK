import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import type { KnowledgeItem } from '../../../domain/knowledge';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { LibraryView } from '../LibraryView';

function makeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    schemaVersion: 1,
    title: 'Library content fixture',
    content: 'Legacy summary remains available.',
    taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
    status: 'active',
    createdAt: '2026-09-22T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    ...overrides,
  };
}

async function fixture(item: KnowledgeItem): Promise<Repositories> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);
  await repos.knowledge.create(item);
  return repos;
}

function renderLibrary(repos: Repositories): void {
  render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <LibraryView />
    </ApplicationProvider>,
  );
}

async function openInspector(title: string): Promise<void> {
  await waitFor(() => expect(screen.getByText(title)).toBeDefined());
  fireEvent.click(screen.getByText(title));
  await waitFor(() => expect(screen.getByTestId('item-inspector-modal')).toBeDefined());
}

function openEditor(): void {
  const editButton = document.querySelector<HTMLButtonElement>('button[title="Edit Knowledge Item"]');
  if (!editButton) throw new Error('Expected the Library edit button');
  fireEvent.click(editButton);
}

afterEach(cleanup);

describe('Library text, code, and math content', () => {
  it('keeps old items safe and editable without exposing image controls or forcing blocks', async () => {
    const item = makeItem({
      title: 'Legacy item',
      content: 'Legacy **summary** <script>window.__unsafe = true</script>',
      explanationMarkdown: '## Existing explanation\n<img src=x onerror="alert(1)"> [unsafe](javascript:alert(2))',
    });
    const repos = await fixture(item);
    renderLibrary(repos);

    await openInspector(item.title);

    expect(screen.queryByTestId('content-blocks')).toBeNull();
    expect(screen.getByText('summary')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Existing explanation' })).toBeDefined();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('unsafe').closest('a')?.getAttribute('href') ?? '')
      .not.toMatch(/^javascript:/i);
    expect(screen.queryByRole('button', { name: /image|media|upload|attach/i })).toBeNull();

    openEditor();
    expect(screen.queryAllByRole('button', { name: 'Remove' })).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(async () => {
      expect((await repos.knowledge.get(item.id))?.blocks).toBeUndefined();
    });
  });

  it('keeps the summary compact in the list and saves edited blocks in order', async () => {
    const originalCode = "  print('old')\n";
    const item = makeItem({
      title: 'Block editor fixture',
      content: 'Block summary stays visible.',
      blocks: [
        { type: 'text', content: 'Original text' },
        { type: 'code', language: 'python', content: originalCode },
        { type: 'math', content: 'old_math' },
      ],
    });
    const repos = await fixture(item);
    renderLibrary(repos);

    await waitFor(() => expect(screen.getByText(item.title)).toBeDefined());
    expect(screen.getByText(item.content)).toBeDefined();
    expect(screen.getByText('text')).toBeDefined();
    expect(screen.getByText('code')).toBeDefined();
    expect(screen.getByText('math')).toBeDefined();
    expect(screen.queryByText(originalCode)).toBeNull();

    await openInspector(item.title);
    openEditor();

    const editedCode = "  print('first')\n\tprint('second')\n";
    fireEvent.change(screen.getByLabelText('text block 1'), { target: { value: 'First **text**' } });
    fireEvent.change(screen.getByLabelText('Language for code block 2'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('code block 2'), { target: { value: editedCode } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[2]);

    fireEvent.click(screen.getByRole('button', { name: 'Add text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add code' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add math' }));
    fireEvent.change(screen.getByLabelText('text block 3'), { target: { value: 'Added text' } });
    fireEvent.change(screen.getByLabelText('Language for code block 4'), { target: { value: 'typescript' } });
    fireEvent.change(screen.getByLabelText('code block 4'), { target: { value: 'const answer = 42;\n' } });
    fireEvent.change(screen.getByLabelText('math block 5'), { target: { value: '\\frac{a+b}{c}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    const expectedBlocks: NonNullable<KnowledgeItem['blocks']> = [
      { type: 'text', content: 'First **text**' },
      { type: 'code', content: editedCode },
      { type: 'text', content: 'Added text' },
      { type: 'code', language: 'typescript', content: 'const answer = 42;\n' },
      { type: 'math', content: '\\frac{a+b}{c}' },
    ];
    await waitFor(async () => {
      expect((await repos.knowledge.get(item.id))?.blocks).toEqual(expectedBlocks);
    });

    const renderedCode = screen.getAllByTestId('content-code-block');
    expect(renderedCode[0].querySelector('code')?.textContent).toBe(editedCode);
    expect(screen.getByText('typescript')).toBeDefined();
    expect(document.querySelector('.katex')).not.toBeNull();
  });

  it('removes every block without invalidating the legacy content summary', async () => {
    const item = makeItem({
      title: 'Remove blocks fixture',
      blocks: [
        { type: 'text', content: 'Text' },
        { type: 'code', content: 'code()' },
        { type: 'math', content: 'x^2' },
      ],
    });
    const repos = await fixture(item);
    renderLibrary(repos);
    await openInspector(item.title);
    openEditor();

    while (screen.queryAllByRole('button', { name: 'Remove' }).length > 0) {
      fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(async () => {
      const saved = await repos.knowledge.get(item.id);
      expect(saved?.content).toBe(item.content);
      expect(saved?.blocks).toBeUndefined();
    });
    expect(screen.queryByTestId('content-blocks')).toBeNull();
  });
});
