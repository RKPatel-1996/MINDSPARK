import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../../application';
import type { InsightsSummary } from '../../application/types';
import { Loader2, ArrowRight, AlertTriangle } from 'lucide-react';

export const InsightsView: React.FC = () => {
  const navigate = useNavigate();
  const { insightsService, refreshCount, isSignedOut } = useApplication();
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const data = await insightsService.getInsights();
      setInsights(data);
    } finally {
      setLoading(false);
    }
  }, [insightsService]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights, refreshCount]);

  if (isSignedOut) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md p-8 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl paper-shadow">
          <h2 className="text-xl font-semibold mb-2 font-ui">Sign in to view insights</h2>
          <p className="text-sm text-[var(--muted-color)] font-content mb-6">
            Sign in with your Google account to compute memory retention and track learning statistics from Cloud Firestore.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !insights) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex items-center gap-3 text-[var(--muted-color)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
          <span className="text-sm font-ui">Computing memory metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full content-container pt-safe">
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-8 font-ui">Insights</h1>

        {/* Reconciliation Errors if any */}
        {insights.reconciliationErrors && insights.reconciliationErrors.length > 0 && (
          <div className="mb-8 p-4 rounded-xl border border-[var(--color-error)] bg-[var(--surface-color)] paper-shadow">
            <div className="flex items-center gap-2 text-[var(--color-error)] font-semibold text-sm mb-1 font-ui">
              <AlertTriangle className="w-4 h-4" />
              <span>Reconciliation Failures ({insights.reconciliationErrors.length})</span>
            </div>
            <p className="text-xs text-[var(--muted-color)] mb-3 font-content">
              Review history cannot be deterministically verified for the following cards:
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-[var(--text-color)] bg-[var(--bg-color)] p-3 rounded-lg border border-[var(--border-color)]">
              {insights.reconciliationErrors.map((err, i) => (
                <li key={i} className="truncate">
                  Card <strong className="text-[var(--color-primary)]">{err.cardId}</strong>: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Overall Retention */}
          <div className="p-6 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-2xl paper-shadow">
            <h3 className="text-[var(--muted-color)] font-medium mb-4 uppercase tracking-wider text-xs font-ui">
              Overall retention
            </h3>
            {insights.averageRetrievability !== null ? (
              <>
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-5xl font-light text-[var(--text-color)] font-ui">
                    {insights.averageRetrievability}%
                  </span>
                </div>
                <div className="text-sm text-[var(--muted-color)] font-medium font-ui">
                  Estimated average retrievability across active cards
                </div>
              </>
            ) : (
              <div className="py-2">
                <div className="text-xl font-medium text-[var(--text-color)] font-ui mb-1">
                  Not enough review history yet.
                </div>
                <div className="text-sm text-[var(--muted-color)] font-content">
                  Retrievability is derived from completed review evidence. Review your first cards to compute memory retention.
                </div>
              </div>
            )}
          </div>

          {/* Needs Attention */}
          <div className="p-6 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-2xl flex flex-col paper-shadow">
            <h3 className="text-[var(--muted-color)] font-medium mb-4 uppercase tracking-wider text-xs font-ui">
              Needs attention
            </h3>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-5xl font-light text-[var(--text-color)] font-ui">
                {insights.needsReviewCount}
              </span>
              <span className="text-lg text-[var(--muted-color)] mb-1 font-ui">items flagged</span>
            </div>
            <p className="text-xs text-[var(--muted-color)] mb-4 font-content">
              Knowledge items flagged for factual update or clarification. Flagged items are excluded from active review until reactivated.
            </p>
            <button
              onClick={() => navigate('/library')}
              className="mt-auto py-2 w-full text-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg font-medium hover:bg-[var(--bg-color)] hover:border-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] font-ui text-sm"
            >
              Review flagged items in Library
            </button>
          </div>
        </div>

        {/* Memory Distribution Breakdown */}
        <div className="p-6 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl paper-shadow">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-[var(--muted-color)] font-ui">
            Memory Distribution & Lifecycle
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--elevated-color)] border border-[var(--border-color)]">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-color)] block mb-1 font-ui">
                New Cards
              </span>
              <span className="text-2xl font-semibold font-mono">{insights.stageCounts.new}</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--elevated-color)] border border-[var(--border-color)]">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-color)] block mb-1 font-ui">
                Learning
              </span>
              <span className="text-2xl font-semibold font-mono">{insights.stageCounts.learning}</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--elevated-color)] border border-[var(--border-color)]">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-color)] block mb-1 font-ui">
                Review (Stable)
              </span>
              <span className="text-2xl font-semibold font-mono">{insights.stageCounts.review}</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--elevated-color)] border border-[var(--border-color)]">
              <span className="text-xs uppercase tracking-wider text-[var(--muted-color)] block mb-1 font-ui">
                Relearning
              </span>
              <span className="text-2xl font-semibold font-mono">{insights.stageCounts.relearning}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex items-center justify-between">
            <div className="text-sm font-ui">
              <span className="text-[var(--muted-color)]">Completed reviews today: </span>
              <strong className="text-[var(--text-color)] font-mono">{insights.reviewedTodayCount}</strong>
            </div>

            <button
              onClick={() => navigate('/review')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui text-sm hover:opacity-90 transition-opacity"
            >
              <span>Practice Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
