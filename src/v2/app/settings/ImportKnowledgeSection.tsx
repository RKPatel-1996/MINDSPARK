import React, { useState, useRef, useEffect } from 'react';
import { useApplication } from '../../application';
import { Upload, Check, Loader2, AlertTriangle, Lock, Copy, Eye, EyeOff } from 'lucide-react';
import { isDuplicateImportError, type ImportDraftInspection } from '../../application/importService';
import { buildMindSparkGenerationPrompt } from '../../import/generationPrompt';

export type ImportUiStatus =
  | 'empty'
  | 'inspecting'
  | 'ready'
  | 'duplicate'
  | 'invalid'
  | 'importing'
  | 'imported';

function formatValidationError(err: any): string {
  if (err?.issues && Array.isArray(err.issues)) {
    return err.issues
      .map((i: any) => `${i.path.length > 0 ? i.path.join('.') + ': ' : ''}${i.message}`)
      .join('; ');
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  return 'Invalid import packet';
}

export interface ImportKnowledgeSectionProps {
  debounceMs?: number;
}

export const ImportKnowledgeSection: React.FC<ImportKnowledgeSectionProps> = ({
  debounceMs = 400,
}) => {
  const {
    inspectImportPacket,
    importPacket,
    taxonomyService,
    refreshCount,
    isSignedOut,
    isUnconfigured,
    isEphemeralDev,
  } = useApplication();

  const [importJson, setImportJson] = useState('');
  const [status, setStatus] = useState<ImportUiStatus>('empty');
  const [inspection, setInspection] = useState<ImportDraftInspection | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const [generationPrompt, setGenerationPrompt] = useState<string | null>(null);
  const [generationPromptError, setGenerationPromptError] = useState<string | null>(null);
  const [isGenerationPromptVisible, setIsGenerationPromptVisible] = useState(false);
  const [copyPromptStatus, setCopyPromptStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const inspectionVersionRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    setGenerationPrompt(null);
    setGenerationPromptError(null);
    setCopyPromptStatus('idle');

    taxonomyService.getRegistry()
      .then((registry) => {
        if (cancelled) return;
        setGenerationPrompt(buildMindSparkGenerationPrompt(registry));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setGenerationPromptError(
          err instanceof Error
            ? err.message
            : 'Unable to load the current taxonomy registry.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [taxonomyService, refreshCount]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setImportJson(text);
    setImportSuccess(null);

    // Cancel pending timers and invalidate in-flight async inspections immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const currentVersion = ++inspectionVersionRef.current;

    const trimmed = text.trim();
    if (!trimmed) {
      setStatus('empty');
      setInspection(null);
      setValidationError(null);
      return;
    }

    // Immediately mark as inspecting and invalidate preview & import button
    setStatus('inspecting');
    setInspection(null);
    setValidationError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(trimmed);
        } catch (err: any) {
          if (currentVersion !== inspectionVersionRef.current) return;
          setStatus('invalid');
          setInspection(null);
          setValidationError(`Invalid JSON: ${err.message}`);
          return;
        }

        const result = await inspectImportPacket(parsed);
        if (currentVersion !== inspectionVersionRef.current) return;

        if (result.ok) {
          setStatus('ready');
          setInspection(result);
          setValidationError(null);
        } else if (result.status === 'duplicate') {
          setStatus('duplicate');
          setInspection(result);
          setValidationError(null);
        }
      } catch (err: any) {
        if (currentVersion !== inspectionVersionRef.current) return;
        setStatus('invalid');
        setInspection(null);
        setValidationError(formatValidationError(err));
      }
    }, debounceMs);
  };

  const isPersistenceDisabled = isSignedOut || (isUnconfigured && !isEphemeralDev);

  const handleCopyGenerationPrompt = async () => {
    if (!generationPrompt) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser context.');
      }

      await navigator.clipboard.writeText(generationPrompt);
      setCopyPromptStatus('copied');
    } catch {
      setCopyPromptStatus('error');
    }
  };

  const handleImportPacket = async () => {
    if (isPersistenceDisabled || status !== 'ready' || !importJson.trim()) return;

    setStatus('importing');
    setValidationError(null);
    setImportSuccess(null);

    try {
      const parsed = JSON.parse(importJson);
      const res = await importPacket(parsed);

      setStatus('imported');
      setImportSuccess(
        `Successfully imported "${res.knowledgeItem.title}" with ${res.cards.length} review card${
          res.cards.length === 1 ? '' : 's'
        } added.`
      );
      setImportJson('');
      setInspection(null);
      setValidationError(null);
    } catch (err: any) {
      if (isDuplicateImportError(err)) {
        setStatus('duplicate');
        setValidationError(null);
      } else {
        setStatus('invalid');
        setValidationError(formatValidationError(err));
      }
    }
  };

  const isImportDisabled = status !== 'ready' || isPersistenceDisabled;

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
      <h3 className="font-semibold text-lg font-ui mb-1">Import Knowledge Packet</h3>
      <p className="text-sm text-[var(--muted-color)] font-content mb-4">
        Paste a valid MindSpark JSON packet adhering to the schema specification.
      </p>

      <section
        className="mb-5 rounded-xl border border-[var(--border-color)] bg-[var(--elevated-color)] p-4"
        aria-labelledby="create-with-ai-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h4 id="create-with-ai-heading" className="font-semibold text-sm font-ui">
              Create with AI
            </h4>
            <p className="text-xs text-[var(--muted-color)] font-content leading-relaxed">
              Copy MindSpark&apos;s generation prompt, give it to ChatGPT or another chatbot
              together with your study material, then paste the returned JSON below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyGenerationPrompt}
              disabled={!generationPrompt}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] text-xs font-medium font-ui hover:border-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-3.5 h-3.5" />
              {copyPromptStatus === 'copied' ? 'Copied' : 'Copy generation prompt'}
            </button>

            <button
              type="button"
              onClick={() => setIsGenerationPromptVisible((visible) => !visible)}
              disabled={!generationPrompt}
              aria-expanded={isGenerationPromptVisible}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] text-xs font-medium font-ui hover:border-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerationPromptVisible ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              {isGenerationPromptVisible ? 'Hide prompt' : 'View prompt'}
            </button>
          </div>
        </div>

        <ol className="mt-3 ml-4 list-decimal space-y-1 text-xs text-[var(--muted-color)] font-content">
          <li>Copy the MindSpark generation prompt.</li>
          <li>Send it with the source or study material you want converted.</li>
          <li>Paste the chatbot&apos;s JSON-only response into the import box below.</li>
        </ol>

        {!generationPrompt && !generationPromptError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-color)] font-ui">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading current taxonomy for the generation prompt...
          </div>
        )}

        {generationPromptError && (
          <div
            className="mt-3 rounded-lg bg-[var(--color-soft-error)] p-3 text-xs text-[var(--color-error)] font-ui"
            role="alert"
          >
            Generation prompt unavailable: {generationPromptError}
          </div>
        )}

        {copyPromptStatus === 'copied' && (
          <div
            className="mt-3 flex items-center gap-2 text-xs text-[var(--color-success)] font-ui"
            role="status"
          >
            <Check className="w-3.5 h-3.5" />
            Generation prompt copied to clipboard.
          </div>
        )}

        {copyPromptStatus === 'error' && (
          <div
            className="mt-3 rounded-lg bg-[var(--color-soft-error)] p-3 text-xs text-[var(--color-error)] font-ui"
            role="alert"
          >
            Could not copy automatically. Use View prompt and copy it manually.
          </div>
        )}

        {isGenerationPromptVisible && generationPrompt && (
          <pre
            aria-label="MindSpark generation prompt"
            className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] p-3 text-[11px] leading-relaxed font-mono"
          >
            {generationPrompt}
          </pre>
        )}
      </section>

      {/* Read-only / unconfigured status banner */}
      {isPersistenceDisabled && (
        <div
          className="p-3.5 mb-4 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-xs flex items-center gap-2.5 font-ui"
          role="status"
        >
          <Lock className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            {isSignedOut ? (
              <>
                <strong>Authentication required:</strong> Sign in to import and persist knowledge packets in your personal library.
              </>
            ) : (
              <>
                <strong>Configuration required:</strong> Firebase Firestore is not configured. Cloud persistence is unavailable and library imports are disabled in this state.
              </>
            )}
          </span>
        </div>
      )}

      <textarea
        rows={6}
        value={importJson}
        onChange={handleTextChange}
        aria-label="MindSpark JSON packet"
        placeholder='{"item": {"title": "...", "content": "...", "taxonomy": {...}}, "cards": [...]}'
        className="w-full p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-xs font-mono font-content mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />

      {/* Inspecting status indicator */}
      {status === 'inspecting' && (
        <div
          className="flex items-center gap-2 text-xs text-[var(--muted-color)] font-ui py-2 mb-4"
          aria-live="polite"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
          <span>Inspecting packet...</span>
        </div>
      )}

      {/* Duplicate message (blocking) */}
      {status === 'duplicate' && (
        <div
          className="p-4 mb-4 bg-[var(--color-soft-attention)] text-[var(--color-attention)] rounded-xl border border-[var(--color-attention)] text-xs space-y-2 font-content"
          role="alert"
        >
          <div className="flex items-center gap-2 font-semibold font-ui text-sm text-[var(--color-error)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Already in your library</span>
          </div>
          <p className="text-xs text-[var(--text-color)]">
            An item with this title and taxonomy already exists.
          </p>
          {inspection && (
            <div className="pt-2 border-t border-[var(--border-color)] text-[11px] font-mono text-[var(--muted-color)]">
              <div>Title: {inspection.preview.title}</div>
              <div>
                Taxonomy: {inspection.preview.taxonomy.domainId} &rarr;{' '}
                {inspection.preview.taxonomy.topicId}
                {inspection.preview.taxonomy.subtopicId
                  ? ` \u2192 ${inspection.preview.taxonomy.subtopicId}`
                  : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation error */}
      {status === 'invalid' && validationError && (
        <div
          className="p-3 mb-4 bg-[var(--color-soft-error)] text-[var(--color-error)] rounded-lg text-xs font-mono"
          role="alert"
        >
          {validationError}
        </div>
      )}

      {/* Ready preview */}
      {status === 'ready' && inspection && (
        <div className="space-y-4 pt-2 mb-4 border-t border-[var(--border-color)]">
          {/* Summary */}
          <div className="space-y-2 bg-[var(--elevated-color)] p-4 rounded-xl border border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] font-ui">
                Inspection Preview
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-soft-success)] text-[var(--color-success)] font-ui">
                Ready to Import
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-base text-[var(--text-color)] font-ui">
                {inspection.preview.title}
              </h4>
              <div className="text-xs text-[var(--muted-color)] font-mono mt-0.5">
                {inspection.preview.taxonomy.domainId} &rarr; {inspection.preview.taxonomy.topicId}
                {inspection.preview.taxonomy.subtopicId
                  ? ` \u2192 ${inspection.preview.taxonomy.subtopicId}`
                  : ''}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs font-ui">
              <span className="px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] font-medium">
                {inspection.preview.cardCount}{' '}
                {inspection.preview.cardCount === 1 ? 'card' : 'cards'}
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--muted-color)]">
                {inspection.preview.sourceCount}{' '}
                {inspection.preview.sourceCount === 1 ? 'source' : 'sources'}
              </span>
              {inspection.preview.tags.length > 0 ? (
                inspection.preview.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--muted-color)]"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--muted-color)]">
                  No tags
                </span>
              )}
            </div>

            {/* Card Types breakdown */}
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-[var(--muted-color)] font-ui">
              {inspection.preview.cardTypeCounts.free_recall > 0 && (
                <span>Free Recall: {inspection.preview.cardTypeCounts.free_recall}</span>
              )}
              {inspection.preview.cardTypeCounts.flashcard > 0 && (
                <span>Flashcard: {inspection.preview.cardTypeCounts.flashcard}</span>
              )}
              {inspection.preview.cardTypeCounts.mcq > 0 && (
                <span>MCQ: {inspection.preview.cardTypeCounts.mcq}</span>
              )}
              {inspection.preview.cardTypeCounts.true_false > 0 && (
                <span>True/False: {inspection.preview.cardTypeCounts.true_false}</span>
              )}
              {inspection.preview.cardTypeCounts.cloze > 0 && (
                <span>Cloze: {inspection.preview.cardTypeCounts.cloze}</span>
              )}
            </div>
          </div>

          {/* Normalized card contents */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] font-ui">
              Cards ({inspection.normalizedDraft.cards.length})
            </h5>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {inspection.normalizedDraft.cards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg text-xs space-y-1.5 font-content"
                >
                  <div className="flex items-center justify-between font-ui">
                    <span className="font-semibold text-[var(--text-color)]">Card {idx + 1}</span>
                    <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--elevated-color)] border border-[var(--border-color)] text-[var(--muted-color)]">
                      {card.type.replace('_', ' ')}
                    </span>
                  </div>

                  {card.type === 'mcq' && (
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--text-color)]">{card.question}</p>
                      <ul className="pl-2 space-y-0.5 text-[var(--muted-color)]">
                        {card.options.map((opt, optIdx) => (
                          <li
                            key={optIdx}
                            className={
                              optIdx === card.correctOptionIndex
                                ? 'text-[var(--color-success)] font-medium'
                                : ''
                            }
                          >
                            {optIdx === card.correctOptionIndex ? '✓ ' : '• '}
                            {opt}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[11px] text-[var(--color-success)] font-ui">
                        Correct: {card.options[card.correctOptionIndex]}
                      </div>
                      {card.explanation && (
                        <div className="text-[11px] text-[var(--muted-color)] italic">
                          {card.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {card.type === 'true_false' && (
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--text-color)]">{card.statement}</p>
                      <div className="text-[11px] font-ui text-[var(--color-success)]">
                        Correct: {card.isTrue ? 'True' : 'False'}
                      </div>
                      {card.explanation && (
                        <div className="text-[11px] text-[var(--muted-color)] italic">
                          {card.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {card.type === 'flashcard' && (
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold font-ui text-[var(--muted-color)]">
                          Front:{' '}
                        </span>
                        {card.front}
                      </div>
                      <div>
                        <span className="font-semibold font-ui text-[var(--muted-color)]">
                          Back:{' '}
                        </span>
                        {card.back}
                      </div>
                    </div>
                  )}

                  {card.type === 'free_recall' && (
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold font-ui text-[var(--muted-color)]">
                          Prompt:{' '}
                        </span>
                        {card.prompt}
                      </div>
                      <div>
                        <span className="font-semibold font-ui text-[var(--muted-color)]">
                          Guidance:{' '}
                        </span>
                        {card.answerGuidance}
                      </div>
                    </div>
                  )}

                  {card.type === 'cloze' && (
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold font-ui text-[var(--muted-color)]">
                          Prompt:{' '}
                        </span>
                        {card.prompt}
                      </div>
                      <div>
                        <span className="font-semibold font-ui text-[var(--muted-color)]">
                          Answer:{' '}
                        </span>
                        {card.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success notification */}
      {importSuccess && (
        <div
          className="p-3 mb-4 bg-[var(--color-soft-success)] text-[var(--color-success)] rounded-lg text-sm flex items-center gap-2 font-ui"
          role="status"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{importSuccess}</span>
        </div>
      )}

      {/* Import action button */}
      <button
        onClick={handleImportPacket}
        disabled={isImportDisabled}
        title={
          isSignedOut
            ? 'Authentication required: Sign in to import packets'
            : isUnconfigured && !isEphemeralDev
            ? 'Configuration required: Persistence unavailable'
            : undefined
        }
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      >
        {status === 'importing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {status === 'importing' ? 'Validating & Importing...' : 'Import Packet'}
      </button>
    </div>
  );
};
