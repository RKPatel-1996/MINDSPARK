import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ApplicationProvider } from '../application/ApplicationContext';
import { ImportKnowledgeSection } from '../app/settings/ImportKnowledgeSection';
import { SEED_PACKETS } from '../application/seedData';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import { importDraftPayload } from '../application/importService';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';
import type { Repositories } from '../application/types';

describe('Import Preview UI & Automatic Inspection Interaction', () => {
  let customRepos: Repositories;

  beforeEach(async () => {
    customRepos = createInMemoryRepositories();
    await bootstrapUserRepositories(customRepos);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('pasting a valid packet automatically produces preview without clicking Inspect', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    // Verify there is no Inspect button anywhere
    expect(screen.queryByRole('button', { name: /inspect/i })).toBeNull();

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    // Preview should appear automatically after debounce
    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
    });

    expect(screen.getByText(/Ready to Import/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /inspect/i })).toBeNull();
  });

  it('inspection is debounced', async () => {
    vi.useFakeTimers();

    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={400} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    // After 200ms (less than 400ms), preview is not yet visible
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText(SEED_PACKETS[0].item.title)).toBeNull();

    // Advance by remaining 200ms -> preview arrives
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
  });

  it('editing text immediately disables Import and invalidates previous preview', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
    });

    const importButton = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
    expect(importButton.disabled).toBe(false);

    // Edit text slightly
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) + ' ' } });

    // Import button must be disabled immediately and preview invalidated immediately
    expect(importButton.disabled).toBe(true);
    expect(screen.queryByText(/Ready to Import/i)).toBeNull();
  });

  it('stale asynchronous inspection results cannot overwrite newer results', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);

    // Change to Packet 0
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    // Quickly change to Packet 1 before Packet 0 finishes or replaces
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[1]) } });

    // Only Packet 1 should eventually be displayed
    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[1].item.title)).toBeDefined();
    });

    expect(screen.queryByText(SEED_PACKETS[0].item.title)).toBeNull();
  });

  it('ready preview displays normalized title, taxonomy, tags, card counts, and normalized card information', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const packet = SEED_PACKETS[0];
    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(packet) } });

    await waitFor(() => {
      expect(screen.getByText(packet.item.title)).toBeDefined();
    });

    // Taxonomy path
    expect(screen.getAllByText(new RegExp(`${packet.item.taxonomy.domainId}.*${packet.item.taxonomy.topicId}`)).length).toBeGreaterThan(0);

    // Card count
    expect(screen.getByText(new RegExp(`${packet.cards.length} card`))).toBeDefined();

    // Check MCQ card contents
    const mcqCard = packet.cards.find((c) => c.type === 'mcq') as any;
    if (mcqCard) {
      expect(screen.getByText(mcqCard.question)).toBeDefined();
      expect(screen.getByText(new RegExp(mcqCard.options[mcqCard.correctOptionIndex]))).toBeDefined();
    }

    // Check true/false card contents
    const tfCard = packet.cards.find((c) => c.type === 'true_false') as any;
    if (tfCard) {
      expect(screen.getByText(tfCard.statement)).toBeDefined();
    }

    // Verify no internal generated/persistent IDs, CardState or FSRS internals are exposed
    expect(screen.queryByText(/stability/i)).toBeNull();
    expect(screen.queryByText(/difficulty/i)).toBeNull();
    expect(screen.queryByText(/cardState/i)).toBeNull();
  });

  it('duplicate state blocks Import and exposes no bypass', async () => {
    // Pre-import packet 0 into the repository
    await importDraftPayload(SEED_PACKETS[0], customRepos, CANONICAL_TAXONOMY_REGISTRY);

    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    await waitFor(() => {
      expect(screen.getByText(/Already in your library/i)).toBeDefined();
    });

    expect(
      screen.getByText(/An item with this title and taxonomy already exists/i)
    ).toBeDefined();

    // Import button must be disabled
    const importButton = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
    expect(importButton.disabled).toBe(true);

    // No bypass button like "Import anyway"
    expect(screen.queryByText(/Import anyway/i)).toBeNull();
  });

  it('invalid packet remains editable and is not cleared, showing concise error message', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i) as HTMLTextAreaElement;
    const invalidJson = '{"item": {"title": "Missing rest of schema"}}';
    fireEvent.change(textarea, { target: { value: invalidJson } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });

    // Textarea remains intact with user's input
    expect(textarea.value).toBe(invalidJson);

    // User can edit and fix it
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Import is enabled only for current ready inspection', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    const importButton = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;

    // Empty state: disabled
    expect(importButton.disabled).toBe(true);

    // Invalid JSON: disabled
    fireEvent.change(textarea, { target: { value: '{ invalid' } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(importButton.disabled).toBe(true);

    // Ready state: enabled
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });
    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
    });
    expect(importButton.disabled).toBe(false);
  });

  it('final Import goes through importPacket and successful import clears input/preview and reports title/card count', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
    });

    const importButton = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
    fireEvent.click(importButton);

    // Wait for success status
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
    });

    expect(screen.getByText(new RegExp(`Successfully imported "${SEED_PACKETS[0].item.title}" with ${SEED_PACKETS[0].cards.length} review card`))).toBeDefined();

    // Textarea cleared
    expect(textarea.value).toBe('');

    // Preview cleared
    expect(screen.queryByText(/Ready to Import/i)).toBeNull();

    // Item actually persisted in repository
    const items = await customRepos.knowledge.list();
    expect(items.length).toBe(1);
    expect(items[0].title).toBe(SEED_PACKETS[0].item.title);
  });

  it('duplicate discovered during final import does not clear the packet and shows duplicate message', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const packet = SEED_PACKETS[0];
    const textarea = screen.getByLabelText(/MindSpark JSON packet/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: JSON.stringify(packet) } });

    await waitFor(() => {
      expect(screen.getByText(packet.item.title)).toBeDefined();
    });

    // Simulate another tab/process importing the duplicate after preview was rendered
    await importDraftPayload(packet, customRepos, CANONICAL_TAXONOMY_REGISTRY);

    // Now user clicks Import
    const importButton = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText(/Already in your library/i)).toBeDefined();
    });

    // Textarea must NOT be cleared!
    expect(textarea.value).toBe(JSON.stringify(packet));
    expect(importButton.disabled).toBe(true);

    // Existing KnowledgeItem UUID is not exposed in the UI
    const existingItems = await customRepos.knowledge.list();
    expect(screen.queryByText(existingItems[0].id)).toBeNull();
  });

  it('renders Cloze count, prompt, and answer in the normalized preview', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={30} />
      </ApplicationProvider>
    );

    const packet = JSON.parse(JSON.stringify(SEED_PACKETS[0])) as any;
    packet.cards.push({
      type: 'cloze',
      prompt: 'CLOZE_PREVIEW_PROMPT ____.',
      answer: 'CLOZE_PREVIEW_ANSWER',
    });

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(packet) } });

    await waitFor(() => {
      expect(screen.getByText(packet.item.title)).toBeDefined();
    });

    expect(screen.getByText('Cloze: 1')).toBeDefined();
    expect(screen.getByText('CLOZE_PREVIEW_PROMPT ____.')).toBeDefined();
    expect(screen.getByText('CLOZE_PREVIEW_ANSWER')).toBeDefined();
  });
});
