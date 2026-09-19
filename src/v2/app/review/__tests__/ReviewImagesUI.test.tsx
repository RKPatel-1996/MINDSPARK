import React from 'react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import type { ImageStorageGateway } from '../../../application/imageAttachmentService';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import { generateId } from '../../../domain/id';
import type {
  ImageReference,
  KnowledgeItem,
} from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { ReviewView } from '../ReviewView';

afterEach(() => {
  cleanup();
});

function makeImage(
  alt: string,
  placement: ImageReference['placement'],
  cardId?: string,
): ImageReference {
  const id = generateId();

  return {
    id,
    storagePath: `users/test-owner/knowledgeImages/test-item/${id}`,
    alt,
    placement,
    cardId,
  };
}

function createStorageGateway(
  rejectPath?: string,
): {
  gateway: ImageStorageGateway;
  resolveDownloadUrl: ReturnType<typeof vi.fn>;
} {
  const resolveDownloadUrl = vi.fn(
    async (storagePath: string) => {
      if (storagePath === rejectPath) {
        throw new Error('Transient URL unavailable');
      }

      const id = storagePath.split('/').at(-1);
      return `https://example.invalid/${id}.png`;
    },
  );

  const gateway: ImageStorageGateway = {
    uploadImage: vi.fn(async () => 'unused'),
    resolveDownloadUrl,
    deleteImage: vi.fn(async () => undefined),
  };

  return {
    gateway,
    resolveDownloadUrl,
  };
}

async function createFreeRecallFixture(): Promise<{
  repos: Repositories;
  card: ReviewCard;
  images: {
    promptGeneral: ImageReference;
    promptTargeted: ImageReference;
    promptOther: ImageReference;
    answerGeneral: ImageReference;
    answerTargeted: ImageReference;
    answerOther: ImageReference;
    content: ImageReference;
  };
}> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);

  const itemId = generateId();
  const cardId = generateId();
  const otherCardId = generateId();

  const images = {
    promptGeneral: makeImage(
      'General prompt diagram',
      'review_prompt',
    ),
    promptTargeted: makeImage(
      'Targeted prompt diagram',
      'review_prompt',
      cardId,
    ),
    promptOther: makeImage(
      'Other-card prompt diagram',
      'review_prompt',
      otherCardId,
    ),
    answerGeneral: makeImage(
      'General answer diagram',
      'review_answer',
    ),
    answerTargeted: makeImage(
      'Targeted answer diagram',
      'review_answer',
      cardId,
    ),
    answerOther: makeImage(
      'Other-card answer diagram',
      'review_answer',
      otherCardId,
    ),
    content: makeImage(
      'Content-only diagram',
      'content',
    ),
  };

  const item: KnowledgeItem = {
    id: itemId,
    schemaVersion: 1,
    title: 'Review image fixture',
    content: 'Knowledge item content.',
    taxonomy: {
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    },
    status: 'active',
    images: Object.values(images),
    createdAt: '2026-09-19T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
  };

  const card: ReviewCard = {
    id: cardId,
    knowledgeItemId: itemId,
    schemaVersion: 1,
    suspended: false,
    type: 'free_recall',
    prompt: 'Recall the image-linked fact',
    answerGuidance: 'The revealed image-linked answer.',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);

  return {
    repos,
    card,
    images,
  };
}

async function createMcqFixture(): Promise<{
  repos: Repositories;
  card: ReviewCard;
  promptImage: ImageReference;
  answerImage: ImageReference;
}> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);

  const itemId = generateId();
  const cardId = generateId();

  const promptImage = makeImage(
    'MCQ prompt diagram',
    'review_prompt',
  );

  const answerImage = makeImage(
    'MCQ answer diagram',
    'review_answer',
  );

  const item: KnowledgeItem = {
    id: itemId,
    schemaVersion: 1,
    title: 'MCQ image fixture',
    content: 'MCQ image content.',
    taxonomy: {
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    },
    status: 'active',
    images: [promptImage, answerImage],
    createdAt: '2026-09-19T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
  };

  const card: ReviewCard = {
    id: cardId,
    knowledgeItemId: itemId,
    schemaVersion: 1,
    suspended: false,
    type: 'mcq',
    question: 'Which option is correct?',
    options: ['Correct option', 'Incorrect option'],
    correctOptionIndex: 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);

  return {
    repos,
    card,
    promptImage,
    answerImage,
  };
}

function renderReview(
  repos: Repositories,
  storage: ImageStorageGateway,
): void {
  render(
    <ApplicationProvider
      customRepos={repos}
      customImageStorage={storage}
      isDev={true}
    >
      <ReviewView />
    </ApplicationProvider>,
  );
}

describe('Review image presentation', () => {
  it('shows only applicable prompt images before Reveal and applicable answer images afterwards', async () => {
    const {
      repos,
      images,
    } = await createFreeRecallFixture();

    const storage = createStorageGateway();

    renderReview(repos, storage.gateway);

    await waitFor(() =>
      expect(
        screen.getByText('Recall the image-linked fact'),
      ).toBeDefined(),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('img', {
          name: 'General prompt diagram',
        }),
      ).toBeDefined();

      expect(
        screen.getByRole('img', {
          name: 'Targeted prompt diagram',
        }),
      ).toBeDefined();
    });

    expect(
      screen.queryByText('Other-card prompt diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('General answer diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('Targeted answer diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('Other-card answer diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('Content-only diagram'),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Reveal answer/i,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('img', {
          name: 'General answer diagram',
        }),
      ).toBeDefined();

      expect(
        screen.getByRole('img', {
          name: 'Targeted answer diagram',
        }),
      ).toBeDefined();
    });

    expect(
      screen.queryByText('General prompt diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('Targeted prompt diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('Other-card answer diagram'),
    ).toBeNull();

    expect(
      screen.queryByText('Content-only diagram'),
    ).toBeNull();

    expect(
      storage.resolveDownloadUrl,
    ).not.toHaveBeenCalledWith(
      images.promptOther.storagePath,
    );

    expect(
      storage.resolveDownloadUrl,
    ).not.toHaveBeenCalledWith(
      images.answerOther.storagePath,
    );

    expect(
      storage.resolveDownloadUrl,
    ).not.toHaveBeenCalledWith(
      images.content.storagePath,
    );
  });

  it('switches from prompt to answer images after objective Check answer', async () => {
    const {
      repos,
    } = await createMcqFixture();

    const storage = createStorageGateway();

    renderReview(repos, storage.gateway);

    await waitFor(() =>
      expect(
        screen.getByText('Which option is correct?'),
      ).toBeDefined(),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('img', {
          name: 'MCQ prompt diagram',
        }),
      ).toBeDefined(),
    );

    expect(
      screen.queryByText('MCQ answer diagram'),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: /^1Correct option$/,
      }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Check answer/i,
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('img', {
          name: 'MCQ answer diagram',
        }),
      ).toBeDefined(),
    );

    expect(
      screen.queryByText('MCQ prompt diagram'),
    ).toBeNull();
  });

  it('falls back to alt text when a review image URL cannot be resolved', async () => {
    const {
      repos,
      images,
    } = await createFreeRecallFixture();

    const storage = createStorageGateway(
      images.promptGeneral.storagePath,
    );

    renderReview(repos, storage.gateway);

    await waitFor(() =>
      expect(
        storage.resolveDownloadUrl,
      ).toHaveBeenCalledWith(
        images.promptGeneral.storagePath,
      ),
    );

    expect(
      screen.queryByRole('img', {
        name: 'General prompt diagram',
      }),
    ).toBeNull();

    expect(
      screen.getByText('General prompt diagram'),
    ).toBeDefined();
  });
});
