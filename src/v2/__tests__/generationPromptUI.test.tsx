import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../application/ApplicationContext';
import { ImportKnowledgeSection } from '../app/settings/ImportKnowledgeSection';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';
import { buildMindSparkGenerationPrompt } from '../import/generationPrompt';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import type { Repositories } from '../application/types';

describe('ImportKnowledgeSection AI generation prompt', () => {
  let customRepos: Repositories;

  beforeEach(async () => {
    customRepos = createInMemoryRepositories();
    await bootstrapUserRepositories(customRepos);
  });

  afterEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
  });

  async function renderReadyPromptUi() {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const copyButton = screen.getByRole('button', {
      name: /copy generation prompt/i,
    }) as HTMLButtonElement;

    const viewButton = screen.getByRole('button', {
      name: /view prompt/i,
    }) as HTMLButtonElement;

    await waitFor(() => {
      expect(copyButton.disabled).toBe(false);
      expect(viewButton.disabled).toBe(false);
    });

    return { copyButton, viewButton };
  }

  it('renders the Create with AI workflow without changing the existing import input', async () => {
    const { copyButton, viewButton } = await renderReadyPromptUi();

    expect(screen.getByText('Create with AI')).toBeDefined();
    expect(copyButton).toBeDefined();
    expect(viewButton).toBeDefined();

    expect(screen.getByLabelText(/MindSpark JSON packet/i)).toBeDefined();
    expect(screen.queryByLabelText(/MindSpark generation prompt/i)).toBeNull();
  });

  it('View prompt reveals the exact canonical prompt built from the current registry', async () => {
    const { viewButton } = await renderReadyPromptUi();

    fireEvent.click(viewButton);

    const promptView = await screen.findByLabelText(/MindSpark generation prompt/i);
    const expectedPrompt = buildMindSparkGenerationPrompt(
      CANONICAL_TAXONOMY_REGISTRY
    );

    expect(promptView.textContent).toBe(expectedPrompt);

    const firstDomain = CANONICAL_TAXONOMY_REGISTRY.domains[0];
    expect(promptView.textContent).toContain(firstDomain.id);
    expect(promptView.textContent).toContain(firstDomain.name);

    expect(
      screen.getByRole('button', { name: /hide prompt/i })
    ).toBeDefined();
  });

  it('copies the exact same canonical prompt and shows confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { copyButton } = await renderReadyPromptUi();

    fireEvent.click(copyButton);

    const expectedPrompt = buildMindSparkGenerationPrompt(
      CANONICAL_TAXONOMY_REGISTRY
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(expectedPrompt);
    });

    expect(
      screen.getByText(/generation prompt copied to clipboard/i)
    ).toBeDefined();
  });

  it('handles clipboard failure without disturbing the existing import workflow', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { copyButton } = await renderReadyPromptUi();

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(
        screen.getByText(/could not copy automatically/i)
      ).toBeDefined();
    });

    expect(screen.getByLabelText(/MindSpark JSON packet/i)).toBeDefined();

    const viewButton = screen.getByRole('button', {
      name: /view prompt/i,
    });

    fireEvent.click(viewButton);

    expect(
      await screen.findByLabelText(/MindSpark generation prompt/i)
    ).toBeDefined();
  });
});
