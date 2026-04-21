/**
 * LLMConfigPage — set up the AI provider(s) that power Vidhya.
 *
 * Route: /llm-config
 *
 * UX principles (from the user's brief):
 *   1. Quick Setup first — one provider, one key, done
 *   2. Progressive disclosure — advanced per-role overrides hidden by default
 *   3. Corner cases handled:
 *       - key masking (••••••••)
 *       - paste-friendly (single text input, reveal toggle)
 *       - format validation before hitting the network
 *       - live validation via /api/llm/validate
 *       - rotation (just paste new value over old)
 *       - local models (Ollama) don't need a key
 *       - custom endpoint field for OpenRouter / Ollama
 *       - clear indicator that keys stay in-browser
 *       - mobile-friendly (stacked layout, large taps, show/hide button)
 *   4. Primary → dependents cascade — picking a primary auto-fills role
 *      defaults; each role can be independently overridden via the
 *      advanced accordion
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Check, X, Loader2, Eye, EyeOff, ChevronDown, ChevronRight,
  ExternalLink, Shield, AlertCircle, Sparkles, Zap, Image as ImageIcon,
  Braces, Trash2, RefreshCw, Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { maskKey, validateKeyLocally } from '@/lib/llm/config-store';
import { fadeInUp, staggerContainer } from '@/lib/animations';

// ============================================================================
// Types — server-returned shape
// ============================================================================

type LLMRole = 'chat' | 'vision' | 'json';

interface ProviderModel {
  id: string;
  label: string;
  roles: LLMRole[];
  context_window: number;
  cost_tier: 'free' | 'cheap' | 'mid' | 'premium';
  note?: string;
}

interface Provider {
  id: string;
  name: string;
  homepage: string;
  key_docs_url: string;
  description: string;
  icon: string;
  key_format?: { prefix?: string; min_length?: number; max_length?: number };
  requires_key: boolean;
  endpoint_overridable: boolean;
  default_endpoint: string;
  capabilities: {
    streaming: boolean;
    json_mode: boolean;
    image_input: boolean;
    system_prompt: boolean;
  };
  models: ProviderModel[];
  default_models: Partial<Record<LLMRole, string>>;
}

// ============================================================================
// Role metadata for UI
// ============================================================================

const ROLE_META: Record<LLMRole, { icon: typeof Sparkles; label: string; description: string; color: string }> = {
  chat:   { icon: Sparkles, label: 'Chat & reasoning', description: 'Conversational responses, tutor-style', color: 'text-sky-400' },
  vision: { icon: ImageIcon, label: 'Image understanding', description: 'Photos of math problems, diagrams, handwriting', color: 'text-emerald-400' },
  json:   { icon: Braces, label: 'Structured output', description: 'Intent detection, explainer generation, extraction', color: 'text-purple-400' },
};

const COST_TIER_LABEL: Record<ProviderModel['cost_tier'], string> = {
  free: 'free', cheap: '$', mid: '$$', premium: '$$$',
};
const COST_TIER_COLOR: Record<ProviderModel['cost_tier'], string> = {
  free: 'text-emerald-400',
  cheap: 'text-sky-400',
  mid: 'text-amber-400',
  premium: 'text-rose-400',
};

// ============================================================================
// Main component
// ============================================================================

export default function LLMConfigPage() {
  const { config, configured, update, updateOverride, clearOverride, clear } = useLLMConfig();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState<string>('');
  const [endpointDraft, setEndpointDraft] = useState<string>('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<null | { ok: boolean; reason?: string; latency_ms?: number }>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Load providers once
  useEffect(() => {
    fetch('/api/llm/providers')
      .then(r => r.json())
      .then(d => { setProviders(d.providers || []); setLoadingProviders(false); })
      .catch(() => { setProviders([]); setLoadingProviders(false); });
  }, []);

  const primary = useMemo(() =>
    providers.find(p => p.id === config.primary_provider_id) || null,
    [providers, config.primary_provider_id]);

  // Rehydrate the key draft when the primary provider changes
  useEffect(() => {
    setKeyDraft(config.primary_key || '');
    setEndpointDraft(config.primary_endpoint_override || '');
    setValidationResult(null);
  }, [config.primary_provider_id]);

  // --------------------------------------------------------------------------
  // Primary provider selection
  // --------------------------------------------------------------------------

  const selectPrimary = (provider_id: string) => {
    const p = providers.find(pr => pr.id === provider_id);
    update({
      primary_provider_id: provider_id,
      primary_key: config.primary_provider_id === provider_id ? config.primary_key : null,
      primary_endpoint_override: null,
      last_validated_at: null,
      last_validation_ok: null,
    });
    setKeyDraft('');
    setEndpointDraft(p?.default_endpoint || '');
    setValidationResult(null);
  };

  // --------------------------------------------------------------------------
  // Save & test
  // --------------------------------------------------------------------------

  const localCheck = useMemo(() => validateKeyLocally(primary, keyDraft), [primary, keyDraft]);

  const saveKey = () => {
    if (!primary) return;
    if (!localCheck.ok) {
      setValidationResult({ ok: false, reason: localCheck.reason });
      return;
    }
    update({
      primary_key: keyDraft,
      primary_endpoint_override: endpointDraft && endpointDraft !== primary.default_endpoint ? endpointDraft : null,
    });
    setValidationResult({ ok: true });
  };

  const testConnection = useCallback(async () => {
    if (!primary) return;
    if (!localCheck.ok) {
      setValidationResult({ ok: false, reason: localCheck.reason });
      return;
    }
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch('/api/llm/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: primary.id,
          key: keyDraft,
          endpoint: endpointDraft || primary.default_endpoint,
        }),
      });
      const d = await res.json();
      setValidationResult({ ok: !!d.valid, reason: d.reason, latency_ms: d.latency_ms });
      if (d.valid) {
        update({
          primary_key: keyDraft,
          primary_endpoint_override: endpointDraft && endpointDraft !== primary.default_endpoint ? endpointDraft : null,
          last_validated_at: new Date().toISOString(),
          last_validation_ok: true,
        });
      }
    } catch (err) {
      setValidationResult({ ok: false, reason: (err as Error).message });
    } finally {
      setValidating(false);
    }
  }, [primary, keyDraft, endpointDraft, localCheck, update]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (loadingProviders) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-surface-400 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Loading providers...
      </div>
    );
  }

  return (
    <motion.div className="space-y-5 max-w-2xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-xl font-bold text-surface-100 flex items-center gap-2">
          <Key size={20} className="text-sky-400" />
          AI Provider Setup
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Pick the AI you want to power Vidhya. Your keys stay in your browser — never sent to our servers for storage.
        </p>
      </motion.div>

      {/* Privacy notice */}
      <motion.div
        variants={fadeInUp}
        className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5"
      >
        <Shield size={14} className="shrink-0 mt-0.5 text-emerald-400" />
        <div className="text-xs text-emerald-200/90 leading-relaxed">
          <span className="font-medium text-emerald-300">Keys stay on your device.</span>{' '}
          They're stored in your browser's localStorage and sent only as authentication headers on outbound API calls. We don't persist them server-side. Clear your browser data to erase them.
        </div>
      </motion.div>

      {/* Step 1: Provider picker */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <p className="text-[10px] text-surface-500 uppercase tracking-wide">
          1. Choose a provider
        </p>
        <div className="grid grid-cols-2 gap-2">
          {providers.map(p => {
            const isSelected = config.primary_provider_id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectPrimary(p.id)}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/30'
                    : 'bg-surface-900 border-surface-800 hover:border-surface-600',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.icon}</span>
                    <span className={clsx('text-sm font-medium', isSelected ? 'text-sky-200' : 'text-surface-200')}>
                      {p.name}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="text-sky-400 shrink-0 mt-0.5" />}
                </div>
                <p className="text-[10px] text-surface-500 mt-1.5 leading-relaxed">
                  {p.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px]">
                  {!p.requires_key && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      no key needed
                    </span>
                  )}
                  {p.capabilities.image_input && (
                    <span className="text-surface-500 inline-flex items-center gap-0.5">
                      <ImageIcon size={9} /> vision
                    </span>
                  )}
                  {p.capabilities.streaming && (
                    <span className="text-surface-500 inline-flex items-center gap-0.5">
                      <Zap size={9} /> stream
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 2: API key entry */}
      {primary && (
        <motion.div variants={fadeInUp} className="space-y-3">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide">
            2. {primary.requires_key ? `Your ${primary.name} API key` : 'Configure endpoint'}
          </p>

          {primary.requires_key && (
            <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyDraft}
                  onChange={e => { setKeyDraft(e.target.value); setValidationResult(null); }}
                  placeholder={primary.key_format?.prefix ? `${primary.key_format.prefix}...` : 'paste your key'}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-950 border border-surface-800 text-sm text-surface-200 font-mono placeholder:text-surface-600 focus:outline-none focus:border-sky-500/50"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'hide key' : 'show key'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-surface-500 hover:text-surface-300"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Where to get one */}
              <a
                href={primary.key_docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
              >
                Get an API key <ExternalLink size={10} />
              </a>

              {/* Format warning inline */}
              {keyDraft.length > 0 && !localCheck.ok && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <AlertCircle size={10} />
                  {localCheck.reason}
                </div>
              )}
            </div>
          )}

          {/* Endpoint override */}
          {primary.endpoint_overridable && (
            <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-1.5">
              <p className="text-[10px] text-surface-500 uppercase tracking-wide">Custom endpoint (optional)</p>
              <input
                type="text"
                value={endpointDraft}
                onChange={e => setEndpointDraft(e.target.value)}
                placeholder={primary.default_endpoint}
                className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-surface-800 text-xs text-surface-200 font-mono placeholder:text-surface-600 focus:outline-none focus:border-sky-500/50"
              />
              <p className="text-[10px] text-surface-500">
                Leave blank to use default: <span className="font-mono">{primary.default_endpoint}</span>
              </p>
            </div>
          )}

          {/* Save + Test buttons */}
          <div className="flex gap-2">
            <button
              onClick={testConnection}
              disabled={validating || (primary.requires_key && !localCheck.ok)}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2',
                'bg-gradient-to-r from-sky-500 to-emerald-500 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {validating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {validating ? 'Testing...' : 'Test & save'}
            </button>
            <button
              onClick={saveKey}
              disabled={primary.requires_key && !localCheck.ok}
              className="px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-300 hover:text-surface-100 disabled:opacity-40"
            >
              Save without testing
            </button>
          </div>

          {/* Validation result */}
          <AnimatePresence mode="wait">
            {validationResult && (
              <motion.div
                key={validationResult.ok ? 'ok' : 'fail'}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={clsx(
                  'p-3 rounded-xl border flex items-start gap-2',
                  validationResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : 'bg-rose-500/10 border-rose-500/25',
                )}
              >
                {validationResult.ok
                  ? <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <X size={14} className="text-rose-400 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    'text-xs font-medium',
                    validationResult.ok ? 'text-emerald-300' : 'text-rose-300',
                  )}>
                    {validationResult.ok ? 'Key works — saved' : 'Key didn\'t validate'}
                  </p>
                  {validationResult.reason && (
                    <p className="text-[11px] text-surface-400 mt-0.5 break-words">{validationResult.reason}</p>
                  )}
                  {validationResult.ok && validationResult.latency_ms !== undefined && (
                    <p className="text-[10px] text-surface-500 mt-0.5">Roundtrip: {validationResult.latency_ms}ms</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Step 3: Cascading role defaults preview */}
      {primary && configured && (
        <motion.div variants={fadeInUp} className="space-y-2">
          <p className="text-[10px] text-surface-500 uppercase tracking-wide">
            3. How it will be used
          </p>
          <div className="space-y-1.5">
            {(['chat', 'vision', 'json'] as LLMRole[]).map(role => {
              const meta = ROLE_META[role];
              const Icon = meta.icon;
              const override = config.overrides?.[role];
              const providerId = override?.provider_id || primary.id;
              const rolePrimaryProvider = providers.find(p => p.id === providerId) || primary;
              const modelId = override?.model_id || rolePrimaryProvider.default_models[role];
              const model = rolePrimaryProvider.models.find(m => m.id === modelId);
              const supportsRole = !!rolePrimaryProvider.default_models[role] || !!override?.model_id;

              return (
                <div
                  key={role}
                  className={clsx(
                    'p-2.5 rounded-lg border flex items-center gap-3',
                    supportsRole
                      ? 'bg-surface-900 border-surface-800'
                      : 'bg-surface-900/50 border-surface-800 opacity-60',
                  )}
                >
                  <Icon size={14} className={meta.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-200">{meta.label}</p>
                    <p className="text-[10px] text-surface-500 mt-0.5">
                      {supportsRole ? (
                        <>
                          <span className="text-surface-400">{rolePrimaryProvider.name}</span>
                          {model && <> · <span className="font-mono">{model.label}</span></>}
                          {model && <> <span className={COST_TIER_COLOR[model.cost_tier]}>{COST_TIER_LABEL[model.cost_tier]}</span></>}
                          {override && <span className="ml-1 text-amber-400">(custom)</span>}
                        </>
                      ) : (
                        <>not supported by {rolePrimaryProvider.name} — will fall back</>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Advanced: per-role overrides */}
      {primary && configured && (
        <motion.div variants={fadeInUp}>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center gap-2 text-xs text-surface-400 hover:text-surface-200 py-2"
          >
            {advancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-medium">Advanced — per-role overrides</span>
            <span className="text-surface-600">
              {Object.keys(config.overrides || {}).length > 0
                ? `${Object.keys(config.overrides || {}).length} customized`
                : 'all defaults'}
            </span>
          </button>

          <AnimatePresence>
            {advancedOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-2 pb-2">
                  {(['chat', 'vision', 'json'] as LLMRole[]).map(role => (
                    <RoleOverrideRow
                      key={role}
                      role={role}
                      primary={primary}
                      providers={providers}
                      override={config.overrides?.[role]}
                      onUpdate={(patch) => updateOverride(role, patch)}
                      onClear={() => clearOverride(role)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Clear all */}
      {configured && (
        <motion.div variants={fadeInUp} className="pt-4 mt-4 border-t border-surface-800">
          <button
            onClick={() => {
              if (confirm('Clear all LLM configuration from this browser?')) clear();
            }}
            className="inline-flex items-center gap-1.5 text-[11px] text-rose-400 hover:text-rose-300"
          >
            <Trash2 size={11} />
            Clear all config from this browser
          </button>
          <p className="text-[10px] text-surface-600 mt-1">
            You can always come back to /llm-config to set up again.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Per-role override row
// ============================================================================

function RoleOverrideRow({
  role, primary, providers, override, onUpdate, onClear,
}: {
  role: LLMRole;
  primary: Provider;
  providers: Provider[];
  override: { provider_id?: string | null; model_id?: string | null; key?: string | null } | undefined;
  onUpdate: (patch: { provider_id?: string | null; model_id?: string | null; key?: string | null }) => void;
  onClear: () => void;
}) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  const effectiveProviderId = override?.provider_id || primary.id;
  const effectiveProvider = providers.find(p => p.id === effectiveProviderId) || primary;
  const availableModels = effectiveProvider.models.filter(m => m.roles.includes(role));
  const effectiveModelId = override?.model_id || effectiveProvider.default_models[role] || '';
  const needsOwnKey = !!override?.provider_id && override.provider_id !== primary.id && effectiveProvider.requires_key;

  return (
    <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} className={meta.color} />
          <span className="text-xs font-medium text-surface-200">{meta.label}</span>
        </div>
        {override && (
          <button
            onClick={onClear}
            className="text-[10px] text-surface-500 hover:text-rose-400 inline-flex items-center gap-1"
          >
            <RefreshCw size={9} /> reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-surface-500 uppercase tracking-wide block mb-1">Provider</label>
          <select
            value={effectiveProviderId}
            onChange={e => onUpdate({ provider_id: e.target.value === primary.id ? null : e.target.value })}
            className="w-full px-2 py-1.5 rounded-lg bg-surface-950 border border-surface-800 text-xs text-surface-200"
          >
            {providers.filter(p =>
              p.models.some(m => m.roles.includes(role))
            ).map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.id === primary.id ? ' (primary)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-surface-500 uppercase tracking-wide block mb-1">Model</label>
          <select
            value={effectiveModelId}
            onChange={e => onUpdate({ model_id: e.target.value })}
            className="w-full px-2 py-1.5 rounded-lg bg-surface-950 border border-surface-800 text-xs text-surface-200 font-mono"
          >
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.label} {COST_TIER_LABEL[m.cost_tier]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {needsOwnKey && (
        <div>
          <label className="text-[10px] text-surface-500 uppercase tracking-wide block mb-1">
            Key for {effectiveProvider.name} <span className="text-amber-400">(different from primary)</span>
          </label>
          <input
            type="password"
            value={override?.key || ''}
            onChange={e => onUpdate({ key: e.target.value })}
            placeholder={`paste ${effectiveProvider.name} key`}
            className="w-full px-2 py-1.5 rounded-lg bg-surface-950 border border-surface-800 text-xs text-surface-200 font-mono"
          />
        </div>
      )}
    </div>
  );
}
