/**
 * useLLMConfig — React hook for the LLM config store.
 *
 * Subscribes to storage events so multiple tabs and multiple components
 * see the same config live.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadConfig,
  saveConfig,
  clearConfig,
  isConfigured,
  type LLMConfig,
  type LLMRole,
} from '@/lib/llm/config-store';

export function useLLMConfig() {
  const [config, setConfig] = useState<LLMConfig>(() => loadConfig());

  // Listen for cross-tab updates
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vidhya.llm.config.v1') {
        setConfig(loadConfig());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((patch: Partial<LLMConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveConfig(next);
      return next;
    });
  }, []);

  const updateOverride = useCallback((role: LLMRole, patch: {
    provider_id?: string | null;
    key?: string | null;
    model_id?: string | null;
    endpoint?: string | null;
  }) => {
    setConfig(prev => {
      const overrides = { ...(prev.overrides || {}) };
      overrides[role] = { ...(overrides[role] || {}), ...patch };
      const next = { ...prev, overrides };
      saveConfig(next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((role: LLMRole) => {
    setConfig(prev => {
      const overrides = { ...(prev.overrides || {}) };
      delete overrides[role];
      const next = { ...prev, overrides };
      saveConfig(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    clearConfig();
    setConfig(loadConfig());
  }, []);

  return {
    config,
    configured: isConfigured(config),
    update,
    updateOverride,
    clearOverride,
    clear,
  };
}
