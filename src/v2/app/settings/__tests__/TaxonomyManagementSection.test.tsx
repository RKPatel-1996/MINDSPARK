import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import {
  TaxonomyManagementSection,
  formatTaxonomyError,
} from '../TaxonomyManagementSection';
import { SettingsView } from '../SettingsView';
import { ImportKnowledgeSection } from '../ImportKnowledgeSection';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import {
  DuplicateTaxonomyError,
  TaxonomyParentNotFoundError,
  TaxonomyNodeNotFoundError,
  TaxonomyError,
} from '../../../application/taxonomyService';
import type { Repositories } from '../../../application/types';

describe('Taxonomy Management UI (Task 5/5)', () => {
  let customRepos: Repositories;

  beforeEach(async () => {
    customRepos = createInMemoryRepositories();
    await bootstrapUserRepositories(customRepos);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. current domains/topics/subtopics render hierarchically', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    // Verify domains render
    await waitFor(() => {
      expect(screen.getByText('Computing')).toBeDefined();
      expect(screen.getByText('Bioinformatics')).toBeDefined();
    });

    // Verify topics render under hierarchy
    expect(screen.getByText('Linux')).toBeDefined();
    expect(screen.getByText('Sequence Analysis')).toBeDefined();

    // Verify subtopics render
    expect(screen.getByText('Shell')).toBeDefined();
    expect(screen.getByText('Sequence Formats')).toBeDefined();
  });

  it('2. controlled tags render as read-only chips without delete or rename controls', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('#concept')).toBeDefined();
      expect(screen.getByText('#command')).toBeDefined();
    });

    // Ensure tags section exists
    const tagsList = screen.getByTestId('controlled-tags-list');
    expect(tagsList).toBeDefined();

    // Ensure there are no delete or rename buttons inside controlled-tags-list
    const buttonsInTags = tagsList.querySelectorAll('button');
    expect(buttonsInTags.length).toBe(0);
  });

  it('3. Add Domain calls the typed taxonomy service with a human-facing name only', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computing')).toBeDefined();
    });

    const addDomainBtn = screen.getByRole('button', { name: /Add Domain/i });
    fireEvent.click(addDomainBtn);

    // Verify input asks for name, not ID
    const input = screen.getByLabelText(/Domain name/i) as HTMLInputElement;
    expect(input).toBeDefined();
    expect(screen.queryByLabelText(/Domain ID/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/id/i)).toBeNull();

    // Type human-facing name
    fireEvent.change(input, { target: { value: 'Neuroscience & Cognition' } });

    // Click explicit confirmation "Add"
    const confirmBtn = screen.getByRole('button', { name: /^Add$/i });
    fireEvent.click(confirmBtn);

    // Immediately displays newly persisted domain
    await waitFor(() => {
      expect(screen.getByText('Neuroscience & Cognition')).toBeDefined();
    });

    // Verify persisted in repository with deterministically derived ID
    const reg = await customRepos.taxonomy.get();
    const createdDomain = reg?.domains.find((d) => d.name === 'Neuroscience & Cognition');
    expect(createdDomain).toBeDefined();
    expect(createdDomain?.id).toBe('neuroscience-cognition');
  });

  it('4. Add Topic uses the correct parent domain with human-facing name only', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computing')).toBeDefined();
    });

    // Find the Add Topic button under Computing
    const addTopicBtns = screen.getAllByRole('button', { name: /Add Topic/i });
    fireEvent.click(addTopicBtns[0]); // First domain is Computing

    // Verify parent context is clearly stated
    expect(screen.getByText(/Add topic to "Computing"/i)).toBeDefined();

    const input = screen.getByLabelText(/Topic name/i);
    expect(screen.queryByLabelText(/Topic ID/i)).toBeNull();

    fireEvent.change(input, { target: { value: 'Distributed Systems' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => {
      expect(screen.getByText('Distributed Systems')).toBeDefined();
    });

    const reg = await customRepos.taxonomy.get();
    const createdTopic = reg?.topics.find((t) => t.name === 'Distributed Systems');
    expect(createdTopic).toBeDefined();
    expect(createdTopic?.domainId).toBe('computing');
    expect(createdTopic?.id).toBe('distributed-systems');
  });

  it('5. Add Subtopic uses the correct parent topic with human-facing name only', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Linux')).toBeDefined();
    });

    const addSubtopicBtns = screen.getAllByRole('button', { name: /Add Subtopic/i });
    fireEvent.click(addSubtopicBtns[0]); // Linux

    // Verify parent context is clearly stated
    expect(screen.getByText(/Add subtopic to "Linux"/i)).toBeDefined();

    const input = screen.getByLabelText(/Subtopic name/i);
    expect(screen.queryByLabelText(/Subtopic ID/i)).toBeNull();

    fireEvent.change(input, { target: { value: 'Process Management' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => {
      expect(screen.getByText('Process Management')).toBeDefined();
    });

    const reg = await customRepos.taxonomy.get();
    const createdSubtopic = reg?.subtopics.find((s) => s.name === 'Process Management');
    expect(createdSubtopic).toBeDefined();
    expect(createdSubtopic?.topicId).toBe('linux');
    expect(createdSubtopic?.id).toBe('process-management');
  });

  it('6. Add Tag works without asking for an ID', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('#concept')).toBeDefined();
    });

    const addTagBtn = screen.getByRole('button', { name: /Add Tag/i });
    fireEvent.click(addTagBtn);

    const input = screen.getByLabelText(/Tag name/i);
    expect(screen.queryByLabelText(/Tag ID/i)).toBeNull();

    fireEvent.change(input, { target: { value: 'machine-learning' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => {
      expect(screen.getByText('#machine-learning')).toBeDefined();
    });

    const reg = await customRepos.taxonomy.get();
    expect(reg?.allowedTags.includes('machine-learning')).toBe(true);
  });

  it('7. rename preserves node identity through the service and forbids ID editing', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computing')).toBeDefined();
    });

    const renameBtns = screen.getAllByRole('button', { name: /Rename/i });
    // First rename button is on "Computing" domain
    fireEvent.click(renameBtns[0]);

    // Input prefilled with current display name
    const input = screen.getByLabelText(/Domain name/i) as HTMLInputElement;
    expect(input.value).toBe('Computing');
    expect(screen.queryByLabelText(/ID/i)).toBeNull();

    fireEvent.change(input, { target: { value: 'Computer Science' } });

    // Explicit confirmation "Save"
    const saveBtn = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Computer Science')).toBeDefined();
    });

    // Check registry: node identity ("computing") was strictly preserved
    const reg = await customRepos.taxonomy.get();
    const domain = reg?.domains.find((d) => d.id === 'computing');
    expect(domain).toBeDefined();
    expect(domain?.name).toBe('Computer Science');

    // Topics still point to "computing"
    const topicsUnderDomain = reg?.topics.filter((t) => t.domainId === 'computing');
    expect(topicsUnderDomain?.length).toBeGreaterThan(0);
  });

  it('8. successful mutation immediately displays the returned persisted registry without reload', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Microbiology')).toBeDefined();
    });

    // Click Add Topic under Microbiology
    const addTopicBtns = screen.getAllByRole('button', { name: /Add Topic/i });
    // Microbiology is the 4th domain
    fireEvent.click(addTopicBtns[3]);

    const input = screen.getByLabelText(/Topic name/i);
    fireEvent.change(input, { target: { value: 'Bacteriophages' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    // Verify immediately displayed in UI
    await waitFor(() => {
      expect(screen.getByText('Bacteriophages')).toBeDefined();
    });
  });

  it('9. duplicate/conflict failure preserves the user input and does not mutate displayed registry', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computing')).toBeDefined();
    });

    const addDomainBtn = screen.getByRole('button', { name: /Add Domain/i });
    fireEvent.click(addDomainBtn);

    const input = screen.getByLabelText(/Domain name/i) as HTMLInputElement;
    // Enter duplicate of existing domain "Computing" (case-insensitive check)
    fireEvent.change(input, { target: { value: 'computing' } });

    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    // An accessible alert appears
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toMatch(/A domain named "computing" already exists/i);
    });

    // The editor remains open and the user input is PRESERVED
    expect(input.value).toBe('computing');
    expect(screen.getByRole('button', { name: /^Add$/i })).toBeDefined();

    // The registry was not mutated
    const reg = await customRepos.taxonomy.get();
    expect(reg?.domains.filter((d) => d.name.toLowerCase() === 'computing').length).toBe(1);
  });

  it('10. typed failure handling strictly inspects error type without parsing error.message', () => {
    // 1. DuplicateTaxonomyError with obscured message
    const duplicateDomainErr = new DuplicateTaxonomyError('domain', 'Genomics');
    (duplicateDomainErr as any).message = 'INTERNAL_DB_CODE_987234';
    expect(formatTaxonomyError(duplicateDomainErr)).toBe('A domain named "Genomics" already exists.');

    const duplicateTopicErr = new DuplicateTaxonomyError('topic', 'RNA', 'genomics');
    (duplicateTopicErr as any).message = 'UNEXPECTED_STRING';
    expect(formatTaxonomyError(duplicateTopicErr)).toBe(
      'A topic named "RNA" already exists under this parent.'
    );

    const duplicateTagErr = new DuplicateTaxonomyError('tag', 'crispr');
    (duplicateTagErr as any).message = 'RANDOM_TEXT';
    expect(formatTaxonomyError(duplicateTagErr)).toBe('Tag "crispr" already exists.');

    // 2. TaxonomyParentNotFoundError with obscured message
    const parentNotFoundErr = new TaxonomyParentNotFoundError('domain', 'quantum');
    (parentNotFoundErr as any).message = 'NOT_IN_STORE';
    expect(formatTaxonomyError(parentNotFoundErr)).toBe('Parent domain could not be found.');

    // 3. TaxonomyNodeNotFoundError with obscured message
    const nodeNotFoundErr = new TaxonomyNodeNotFoundError('topic', 'unknown-topic');
    (nodeNotFoundErr as any).message = 'ERR_123';
    expect(formatTaxonomyError(nodeNotFoundErr)).toBe('The selected topic could not be found.');

    // 4. TaxonomyError with code 'invalid_input'
    const invalidErr = new TaxonomyError('invalid_input', 'EMPTY_OR_WHATEVER');
    expect(formatTaxonomyError(invalidErr)).toBe(
      'Please enter a valid, non-empty name containing alphanumeric characters.'
    );
  });

  it('11. no delete, move, ID-edit, or tag-rename controls are rendered anywhere in the UI', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computing')).toBeDefined();
    });

    // Check for forbidden action words across all buttons and controls
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() ?? '';
      expect(text).not.toContain('delete');
      expect(text).not.toContain('remove');
      expect(text).not.toContain('trash');
      expect(text).not.toContain('destroy');
      expect(text).not.toContain('move');
      expect(text).not.toContain('reparent');
      expect(text).not.toContain('rename tag');
      expect(text).not.toContain('edit id');
    }

    // Check for any inputs with id-editing attributes
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      expect(input.getAttribute('name')?.toLowerCase() ?? '').not.toContain('id');
      expect(input.getAttribute('aria-label')?.toLowerCase() ?? '').not.toContain('id');
    }
  });

  it('12. signed-out and unconfigured states disable taxonomy mutations', async () => {
    // Render in production build without configuration (unconfigured)
    render(
      <ApplicationProvider isDev={false}>
        <TaxonomyManagementSection defaultExpanded={true} />
      </ApplicationProvider>
    );

    // Wait for the notice
    await waitFor(() => {
      expect(screen.getByText(/Configuration required:/i)).toBeDefined();
      expect(screen.getByText(/taxonomy mutations are disabled in this state/i)).toBeDefined();
    });

    // Add Domain button is disabled
    const addDomainBtn = screen.getByRole('button', { name: /Add Domain/i });
    expect(addDomainBtn.hasAttribute('disabled')).toBe(true);

    // Add Tag button is disabled
    const addTagBtn = screen.getByRole('button', { name: /Add Tag/i });
    expect(addTagBtn.hasAttribute('disabled')).toBe(true);

    // Hierarchy buttons (Rename, Add Topic) are disabled
    const renameBtns = screen.queryAllByRole('button', { name: /Rename/i });
    renameBtns.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(true);
    });
  });

  it('13. existing import preview and strict unknown-taxonomy validation remain unchanged', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={20} />
      </ApplicationProvider>
    );

    const textarea = screen.getByLabelText(/MindSpark JSON packet/i);

    // Packet with an unknown domain "Astrophysics"
    const packetWithUnknownDomain = {
      item: {
        title: 'Star Formation Dynamics',
        content: 'Stars form within molecular clouds in interstellar space.',
        taxonomy: {
          domainId: 'astrophysics', // Unknown domain
          topicId: 'stellar-nucleosynthesis',
        },
        tags: ['concept'],
      },
      cards: [
        {
          type: 'flashcard',
          front: 'Where do stars form?',
          back: 'Molecular clouds in interstellar space',
        },
      ],
    };

    fireEvent.change(textarea, { target: { value: JSON.stringify(packetWithUnknownDomain) } });

    // Validation must fail strictly without offering to create taxonomy
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toMatch(/astrophysics/i);
    });
    // Verify there is no "Create missing taxonomy" button or prompt
    expect(screen.queryByRole('button', { name: /create.*taxonomy/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /add.*taxonomy/i })).toBeNull();
  });

  it('14. integrates into SettingsView under Knowledge organization and is collapsed by default', async () => {
    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <SettingsView initialTab="library" />
      </ApplicationProvider>
    );

    // Verify Knowledge Organization header is present
    expect(screen.getByText('Knowledge Organization')).toBeDefined();

    // Verify it is collapsed by default
    const toggleBtn = screen.getByRole('button', { name: /Manage Taxonomy/i });
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

    // Hierarchy tree should not be visible when collapsed
    expect(screen.queryByTestId('taxonomy-tree')).toBeNull();

    // Clicking Manage Taxonomy expands it
    fireEvent.click(toggleBtn);
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

    await waitFor(() => {
      expect(screen.getByTestId('taxonomy-tree')).toBeDefined();
      expect(screen.getByText('Computing')).toBeDefined();
    });
  });
});
