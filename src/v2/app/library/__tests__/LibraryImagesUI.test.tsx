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
import { LibraryView } from '../LibraryView';

afterEach(() => {
  cleanup();
});

async function createFixture(
  image?: ImageReference,
): Promise<{
  repos: Repositories;
  item: KnowledgeItem;
  card: ReviewCard;
}> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);

  const item: KnowledgeItem = {
    id: generateId(),
    schemaVersion: 1,
    title: 'Image fixture',
    content: 'Knowledge with image support.',
    taxonomy: {
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    },
    status: 'active',
    images: image ? [image] : undefined,
    createdAt: '2026-09-19T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
  };

  const card: ReviewCard = {
    id: generateId(),
    knowledgeItemId: item.id,
    schemaVersion: 1,
    suspended: false,
    type: 'free_recall',
    prompt: 'Recall the image fixture',
    answerGuidance: 'Image fixture answer',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);

  return { repos, item, card };
}

function createStorageGateway() {
  const uploadImage = vi.fn(
    async ({
      knowledgeItemId,
      imageId,
    }: {
      knowledgeItemId: string;
      imageId: string;
      blob: Blob;
    }) =>
      `users/test-owner/knowledgeImages/${knowledgeItemId}/${imageId}`,
  );

  const resolveDownloadUrl = vi.fn(
    async () =>
      'https://example.invalid/library-image.png',
  );

  const deleteImage = vi.fn(async () => undefined);

  const gateway: ImageStorageGateway = {
    uploadImage,
    resolveDownloadUrl,
    deleteImage,
  };

  return {
    gateway,
    uploadImage,
    resolveDownloadUrl,
    deleteImage,
  };
}

function renderLibrary(
  repos: Repositories,
  storage?: ImageStorageGateway,
): void {
  render(
    <ApplicationProvider
      customRepos={repos}
      customImageStorage={storage}
      isDev={true}
    >
      <LibraryView />
    </ApplicationProvider>,
  );
}

async function openInspector(): Promise<void> {
  await waitFor(() =>
    expect(screen.getByText('Image fixture')).toBeDefined(),
  );

  fireEvent.click(screen.getByText('Image fixture'));

  await waitFor(() =>
    expect(
      screen.getByTestId('item-inspector-modal'),
    ).toBeDefined(),
  );
}

describe('Library image management', () => {
  it('resolves and renders an attached image thumbnail', async () => {
    const image: ImageReference = {
      id: generateId(),
      storagePath:
        'users/test-owner/knowledgeImages/item/image',
      alt: 'Linux terminal screenshot',
      caption: 'Terminal output',
      placement: 'content',
    };

    const { repos } = await createFixture(image);
    const storage = createStorageGateway();

    renderLibrary(repos, storage.gateway);
    await openInspector();

    await waitFor(() => {
      const rendered = screen.getByRole('img', {
        name: 'Linux terminal screenshot',
      });

      expect(rendered.getAttribute('src')).toBe(
        'https://example.invalid/library-image.png',
      );
    });

    expect(
      storage.resolveDownloadUrl,
    ).toHaveBeenCalledWith(image.storagePath);
  });

  it('attaches a content image and persists metadata', async () => {
    const { repos, item } = await createFixture();
    const storage = createStorageGateway();

    renderLibrary(repos, storage.gateway);
    await openInspector();

    fireEvent.click(
      screen.getByRole('button', { name: 'Add image' }),
    );

    const file = new File(
      ['image-bytes'],
      'terminal.png',
      { type: 'image/png' },
    );

    fireEvent.change(
      screen.getByLabelText('Image file'),
      { target: { files: [file] } },
    );

    fireEvent.change(
      screen.getByLabelText('Alt text'),
      { target: { value: 'Attached terminal image' } },
    );

    fireEvent.change(
      screen.getByLabelText('Caption'),
      { target: { value: 'Useful output' } },
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Attach image',
      }),
    );

    await waitFor(async () => {
      const persisted =
        await repos.knowledge.get(item.id);

      expect(persisted?.images).toHaveLength(1);
      expect(persisted?.images?.[0]).toMatchObject({
        alt: 'Attached terminal image',
        caption: 'Useful output',
        placement: 'content',
      });
    });

    expect(storage.uploadImage).toHaveBeenCalledOnce();
  });

  it('supports review placement targeted to a card', async () => {
    const { repos, item, card } =
      await createFixture();
    const storage = createStorageGateway();

    renderLibrary(repos, storage.gateway);
    await openInspector();

    fireEvent.click(
      screen.getByRole('button', { name: 'Add image' }),
    );

    fireEvent.change(
      screen.getByLabelText('Image file'),
      {
        target: {
          files: [
            new File(
              ['image'],
              'diagram.webp',
              { type: 'image/webp' },
            ),
          ],
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText('Alt text'),
      { target: { value: 'Review diagram' } },
    );

    fireEvent.change(
      screen.getByLabelText('Placement'),
      { target: { value: 'review_prompt' } },
    );

    expect(
      screen.getByRole('option', {
        name: 'All cards',
      }),
    ).toBeDefined();

    fireEvent.change(
      screen.getByLabelText('Review card'),
      { target: { value: card.id } },
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Attach image',
      }),
    );

    await waitFor(async () => {
      const persisted =
        await repos.knowledge.get(item.id);

      expect(persisted?.images?.[0]).toMatchObject({
        placement: 'review_prompt',
        cardId: card.id,
      });
    });
  });

  it('removes image metadata and Storage bytes', async () => {
    const image: ImageReference = {
      id: generateId(),
      storagePath:
        'users/test-owner/knowledgeImages/item/remove-me',
      alt: 'Remove this image',
      placement: 'content',
    };

    const { repos, item } =
      await createFixture(image);
    const storage = createStorageGateway();

    renderLibrary(repos, storage.gateway);
    await openInspector();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove' }),
    );

    await waitFor(async () => {
      const persisted =
        await repos.knowledge.get(item.id);

      expect(persisted?.images).toBeUndefined();
    });

    expect(storage.deleteImage).toHaveBeenCalledWith(
      image.storagePath,
    );
  });

  it('removes the local image when Storage cleanup fails after metadata removal', async () => {
    const image: ImageReference = {
      id: generateId(),
      storagePath:
        'users/test-owner/knowledgeImages/item/orphan-me',
      alt: 'Orphan cleanup image',
      placement: 'content',
    };

    const { repos, item } =
      await createFixture(image);
    const storage = createStorageGateway();

    storage.deleteImage.mockRejectedValueOnce(
      new Error('Storage cleanup failed'),
    );

    renderLibrary(repos, storage.gateway);
    await openInspector();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove' }),
    );

    await waitFor(async () => {
      const persisted =
        await repos.knowledge.get(item.id);

      expect(persisted?.images).toBeUndefined();
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Orphan cleanup image'),
      ).toBeNull();
    });

    expect(
      screen.getByRole('alert').textContent,
    ).toContain(
      'Image metadata was removed but the Storage object could not be deleted',
    );
  });

  it('disables image mutation when Storage is unavailable', async () => {
    const { repos } = await createFixture();

    renderLibrary(repos);
    await openInspector();

    const addButton = screen.getByRole('button', {
      name: 'Add image',
    }) as HTMLButtonElement;

    expect(addButton.disabled).toBe(true);

    expect(
      screen.getByText(
        'Image storage is unavailable in this mode.',
      ),
    ).toBeDefined();
  });
});
