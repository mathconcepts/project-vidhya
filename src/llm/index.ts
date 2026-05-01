// @ts-nocheck
import { readFileSync } from 'fs';
import { EventEmitter } from 'events';

import { GeminiAdapter } from './adapters/gemini';
import { AnthropicAdapter } from './adapters/anthropic';
import { OpenAIAdapter } from './adapters/openai';
import { OllamaAdapter } from './adapters/ollama';
import { ModelRouter } from './router/model-router';

const API_KEY_ENV: Record<string, string> = {
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  ollama: '',
  learnlm: 'GEMINI_API_KEY',
};

const DEFAULT_BASE_URL: Record<string, string> = {
  gemini: 'https://generativelanguage.googleapis.com',
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434',
  learnlm: 'https://generativelanguage.googleapis.com',
};

export class LLMClient extends EventEmitter {
  private config: any;
  private router: ModelRouter;
  private providerAdapters = new Map<string, any>();

  constructor(configOrPath: any) {
    super();

    if (typeof configOrPath === 'string') {
      try {
        const text = readFileSync(configOrPath, 'utf-8');
        try { this.config = JSON.parse(text); } catch { this.config = {}; }
      } catch { this.config = {}; }
    } else {
      this.config = configOrPath || {};
    }

    this.router = new ModelRouter(this.config);

    // Forward budget events from router
    this.router.on('budget:warning', (data: any) => this.emit('budget:warning', data));
    this.router.on('budget:exceeded', (data: any) => this.emit('budget:exceeded', data));

    // Create adapters for enabled providers
    for (const [pid, pconfig] of Object.entries(this.config.providers || {})) {
      if (!(pconfig as any).enabled) continue;
      try {
        const pc = pconfig as any;
        const apiKey = pc.apiKey || (API_KEY_ENV[pid] ? process.env[API_KEY_ENV[pid]] : '') || '';
        const baseUrl = pc.baseUrl || DEFAULT_BASE_URL[pid] || '';
        const models = pc.models || {};
        const defaultModel = pc.fallbackOrder?.[0] || Object.keys(models)[0] || '';
        const cfg = { apiKey, baseUrl, models, defaultModel };

        let adapter: any;
        switch (pid) {
          case 'gemini':
          case 'learnlm':
            adapter = new GeminiAdapter(cfg);
            break;
          case 'anthropic':
            adapter = new AnthropicAdapter(cfg);
            break;
          case 'openai':
            adapter = new OpenAIAdapter(cfg as any);
            break;
          case 'ollama':
            adapter = new OllamaAdapter(cfg);
            break;
        }
        if (adapter) this.providerAdapters.set(pid, adapter);
      } catch {
        // provider unavailable
      }
    }
  }

  // Override on() to return cleanup function instead of this
  on(event: string | symbol, listener: (...args: any[]) => void): () => void {
    super.on(event, listener);
    return () => this.removeListener(event, listener);
  }

  async initialize(): Promise<void> {
    this.emit('ready');
  }

  async generate(request: any): Promise<any> {
    const correlationId = request.metadata?.correlationId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Budget enforcement
    if (request.enforeBudget && request.agentId) {
      const status = this.router.getBudgetStatus(request.agentId);
      if (status.totalCost >= status.limit) {
        throw new Error(`Budget exceeded for agent ${request.agentId}`);
      }
    }

    this.emit('generate:start', { correlationId, agentId: request.agentId, taskType: request.taskType });

    // Determine route
    let route: any;
    if (request.model) {
      route = this.router.selectRoute({ preferredModel: request.model });
      if (!route.provider) {
        // Fallback: find by scanning providers
        for (const [pid, pconfig] of Object.entries(this.config.providers || {})) {
          for (const [, mc] of Object.entries((pconfig as any).models || {})) {
            if ((mc as any).id === request.model) {
              route = { provider: pid, model: request.model, reason: 'explicit model' };
              break;
            }
          }
          if (route.provider) break;
        }
      }
    } else {
      route = this.router.selectRoute({ taskType: request.taskType, agentId: request.agentId });
    }

    const maxRetries: number = request.maxRetries ?? 1;
    const fallbackChain = this.router.getFallbackChain(route);
    const toTry = [route, ...fallbackChain.slice(0, maxRetries)];

    let lastError: any;

    for (let i = 0; i < toTry.length; i++) {
      const current = toTry[i];
      const adapter = this.providerAdapters.get(current.provider);
      if (!adapter) {
        lastError = new Error(`No adapter for provider: ${current.provider}`);
        continue;
      }

      try {
        const startTime = Date.now();
        const response = await adapter.generate(request);

        // Track usage
        if (request.agentId && response.usage) {
          this.router.recordUsage(
            request.agentId,
            response.usage.inputTokens || 0,
            response.usage.outputTokens || 0,
            response.usage.estimatedCostUsd || 0,
            current.provider,
          );
        }

        this.emit('generate:complete', {
          correlationId,
          provider: current.provider,
          model: current.model,
          latencyMs: response.latencyMs || (Date.now() - startTime),
        });

        return response;
      } catch (error: any) {
        lastError = error;
        this.router.recordFailure(current.provider, current.model, error?.type || 'unknown');

        if (i < toTry.length - 1) {
          this.emit('fallback', {
            fromProvider: current.provider,
            toProvider: toTry[i + 1].provider,
            reason: error?.message || 'provider error',
          });
        }
      }
    }

    throw lastError || new Error('All providers failed');
  }

  async *stream(request: any): AsyncGenerator<any> {
    const route = this.router.selectRoute({
      taskType: request.taskType,
      agentId: request.agentId,
      preferredModel: request.model,
    });
    const adapter = this.providerAdapters.get(route.provider);
    if (!adapter) throw new Error(`No adapter for provider: ${route.provider}`);

    for await (const chunk of adapter.generateStream(request)) {
      if (chunk.done) {
        yield { type: 'done', totalTokens: chunk.usage?.totalTokens || 0 };
      } else if (chunk.content) {
        this.emit('stream:chunk', { content: chunk.content, provider: route.provider });
        yield { type: 'content', content: chunk.content, tokenCount: Math.ceil(chunk.content.length / 4) };
      }
    }
  }

  // Backward-compat alias
  async *generateStream(request: any): AsyncGenerator<any> {
    yield* this.stream(request);
  }

  async embed(request: any): Promise<any> {
    const model = request.model || '';
    // OpenAI embedding models
    if (model.startsWith('text-embedding')) {
      const adapter = this.providerAdapters.get('openai') || new OpenAIAdapter({
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        models: {},
        defaultModel: model,
      } as any);
      return adapter.embed(request);
    }
    // Try gemini
    const gemini = this.providerAdapters.get('gemini');
    if (gemini) return gemini.embed(request);
    throw new Error('No embedding provider available');
  }

  async recordUsage(agentId: string, inputTokens: number, outputTokens: number, cost: number): Promise<void> {
    this.router.recordUsage(agentId, inputTokens, outputTokens, cost);
  }

  getBudgetStatus(agentId: string): any {
    return this.router.getBudgetStatus(agentId);
  }

  getProviderHealth(): Record<string, { available: boolean; recentFailures: number }> {
    const result: Record<string, any> = {};
    for (const pid of Object.keys(this.config.providers || {})) {
      result[pid] = this.router.getProviderHealth(pid);
    }
    return result;
  }

  resetDailyBudgets(): void {
    this.router.resetDailyBudgets();
  }

  async checkHealth(): Promise<void> {
    await this.router.checkAllHealth();
  }
}

// Re-export types
export * from './types';
export { ModelRouter } from './router/model-router';
export { createAdapter, getAdapter } from './adapters';
