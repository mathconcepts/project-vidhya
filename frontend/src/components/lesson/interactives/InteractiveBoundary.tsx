/**
 * InteractiveBoundary — try-each-provider-in-order render orchestration.
 *
 * Walks the provider chain from PROVIDER_REGISTRY[directive], rendering
 * the first one that succeeds. On render error, falls through to the next.
 * If every provider throws, the boundary itself renders a quiet text-only
 * placeholder so the lesson stays readable (the upfront-baseline contract).
 *
 * Implementation: a single error boundary wraps a state-driven provider
 * index. On error → log + advance index + re-render. State resets when
 * directive/attrs change.
 *
 * Honors prefers-reduced-data: if set, skips heavy interactive providers
 * (anything except StaticFallback at the end of the chain).
 */

import { Component, ReactNode, useState, useEffect } from 'react';
import { PROVIDER_REGISTRY, type DirectiveType, type DirectiveProps } from './registry';

interface Props {
  directive: DirectiveType;
  attrs: Record<string, any>;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Inner error boundary that catches render errors from a single provider.
 * The outer InteractiveBoundary swaps providers on `key` change; this
 * boundary just reports the error upward via onError.
 */
class ProviderErrorBoundary extends Component<
  { children: ReactNode; onError: (err: Error) => void },
  State
> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, errorMessage: err.message };
  }

  componentDidCatch(err: Error) {
    this.props.onError(err);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function prefersReducedData(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-data: reduce)').matches;
  } catch {
    return false;
  }
}

export function InteractiveBoundary({ directive, attrs }: Props) {
  const [providerIdx, setProviderIdx] = useState(0);
  const chain = PROVIDER_REGISTRY[directive] ?? [];

  // On directive change, reset the chain pointer back to primary.
  useEffect(() => {
    setProviderIdx(0);
  }, [directive, JSON.stringify(attrs)]);

  // Reduced-data: skip everything except the final StaticFallback in the chain.
  const effectiveIdx = prefersReducedData() ? Math.max(chain.length - 1, 0) : providerIdx;

  if (chain.length === 0) {
    return (
      <div className="my-3 p-3 rounded-md bg-surface-900 border border-surface-800 text-xs text-surface-500">
        (interactive type "{directive}" is not yet wired)
      </div>
    );
  }

  const Provider = chain[effectiveIdx];
  if (!Provider) {
    // Exhausted the chain — quiet placeholder, atom text remains readable.
    return (
      <div className="my-3 p-3 rounded-md bg-surface-900 border border-surface-800 text-xs text-surface-500">
        (interactive could not load — see explanation above)
      </div>
    );
  }

  return (
    <ProviderErrorBoundary
      key={`${directive}-${effectiveIdx}`}
      onError={(err) => {
        console.warn(
          `[InteractiveBoundary] ${directive} provider ${effectiveIdx} failed: ${err.message}; falling through`,
        );
        setProviderIdx((i) => i + 1);
      }}
    >
      <Provider directive={directive} attrs={attrs} />
    </ProviderErrorBoundary>
  );
}
