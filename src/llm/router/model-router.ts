// @ts-nocheck
import { EventEmitter } from 'events';

interface AgentBudget {
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  warningSent: boolean;
  exceededSent: boolean;
}

interface ProviderFailureState {
  count: number;
  available: boolean;
}

export class ModelRouter extends EventEmitter {
  private config: any;
  private agentBudgets = new Map<string, AgentBudget>();
  private providerFailures = new Map<string, ProviderFailureState>();

  constructor(config: any) {
    super();
    this.config = config;
  }

  selectRoute(opts: {
    taskType?: string;
    agentId?: string;
    preferredModel?: string;
    preferredProvider?: string;
  } = {}): { provider: string; model: string; reason: string } {
    const { taskType, preferredModel, preferredProvider } = opts;

    // Explicit model override — find which provider has it
    if (preferredModel) {
      for (const [pid, pconfig] of Object.entries(this.config.providers || {})) {
        for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
          if ((mconfig as any).id === preferredModel) {
            return { provider: pid, model: preferredModel, reason: 'explicit model' };
          }
        }
      }
    }

    // Explicit provider override — use its first model
    if (preferredProvider) {
      const pconfig = this.config.providers?.[preferredProvider];
      if (pconfig) {
        const models = Object.values(pconfig.models || {}) as any[];
        return { provider: preferredProvider, model: models[0]?.id || '', reason: 'explicit provider' };
      }
    }

    // Task-based routing
    const rules = taskType ? this.config.routingRules?.taskTypes?.[taskType] : undefined;
    const preferredProviders: string[] = rules?.preferredProviders || Object.keys(this.config.providers || {});
    const preferredTiers: string[] = rules?.preferredTiers || [];
    const preferredSpecs: string[] = rules?.preferredSpecializations || [];

    for (const pid of preferredProviders) {
      const pconfig = this.config.providers?.[pid];
      if (!pconfig?.enabled) continue;

      const health = this.providerFailures.get(pid);
      if (health?.available === false) continue;

      const models = Object.values(pconfig.models || {}) as any[];
      let best: any = null;

      // Try tier + spec match
      if (preferredTiers.length && preferredSpecs.length) {
        best = models.find(m =>
          preferredTiers.includes(m.tier) &&
          preferredSpecs.some(s => (Array.isArray(m.specialization) ? m.specialization : [m.specialization]).includes(s))
        );
      }

      // Try tier-only match
      if (!best && preferredTiers.length) {
        best = models.find(m => preferredTiers.includes(m.tier));
      }

      // Try spec-only match
      if (!best && preferredSpecs.length) {
        best = models.find(m =>
          preferredSpecs.some(s => (Array.isArray(m.specialization) ? m.specialization : [m.specialization]).includes(s))
        );
      }

      // First available
      if (!best) best = models[0];

      if (best) {
        return { provider: pid, model: best.id, reason: `routing for ${taskType || 'default'}` };
      }
    }

    // Last resort: first enabled provider
    for (const [pid, pconfig] of Object.entries(this.config.providers || {})) {
      if (!(pconfig as any).enabled) continue;
      const models = Object.values((pconfig as any).models || {}) as any[];
      if (models[0]) return { provider: pid, model: (models[0] as any).id, reason: 'fallback' };
    }

    return { provider: this.config.defaultProvider || '', model: '', reason: 'default' };
  }

  // Backward-compat alias
  route(taskType?: string, agentId?: string) {
    return this.selectRoute({ taskType, agentId });
  }

  getFallbackChain(route: { provider: string; model: string }): Array<{ provider: string; model: string }> {
    const fallbacks: Array<{ provider: string; model: string }> = [];
    for (const [pid, pconfig] of Object.entries(this.config.providers || {})) {
      if (!(pconfig as any).enabled) continue;
      for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
        const mid = (mconfig as any).id;
        if (pid === route.provider && mid === route.model) continue;
        fallbacks.push({ provider: pid, model: mid });
      }
    }
    return fallbacks;
  }

  recordUsage(agentId: string, inputTokens: number, outputTokens: number, cost: number, provider?: string): void {
    // Provider recovery
    if (provider) {
      const state = this.providerFailures.get(provider);
      if (state) {
        state.count = 0;
        state.available = true;
        this.providerFailures.set(provider, state);
      }
    }

    const existing = this.agentBudgets.get(agentId) || {
      totalCost: 0, inputTokens: 0, outputTokens: 0, warningSent: false, exceededSent: false,
    };
    existing.totalCost += cost;
    existing.inputTokens += inputTokens;
    existing.outputTokens += outputTokens;
    this.agentBudgets.set(agentId, existing);

    const limit = this._getBudgetLimit(agentId);
    const threshold = this._getWarningThreshold(agentId);
    const percentage = existing.totalCost / limit;

    if (!existing.warningSent && percentage >= threshold) {
      existing.warningSent = true;
      this.emit('budget:warning', { agentId, percentage, totalCost: existing.totalCost });
    }
    if (!existing.exceededSent && existing.totalCost >= limit) {
      existing.exceededSent = true;
      this.emit('budget:exceeded', { agentId, totalCost: existing.totalCost });
    }
  }

  getBudgetStatus(agentId: string): { totalCost: number; inputTokens: number; outputTokens: number; limit: number } {
    const b = this.agentBudgets.get(agentId) || {
      totalCost: 0, inputTokens: 0, outputTokens: 0, warningSent: false, exceededSent: false,
    };
    return { totalCost: b.totalCost, inputTokens: b.inputTokens, outputTokens: b.outputTokens, limit: this._getBudgetLimit(agentId) };
  }

  resetDailyBudgets(): void {
    for (const agentId of Array.from(this.agentBudgets.keys())) {
      this.agentBudgets.set(agentId, { totalCost: 0, inputTokens: 0, outputTokens: 0, warningSent: false, exceededSent: false });
    }
  }

  recordFailure(providerId: string, model: string, errorType: string): void {
    const current = this.providerFailures.get(providerId) || { count: 0, available: true };
    current.count++;
    if (current.count >= 5) current.available = false;
    this.providerFailures.set(providerId, current);
  }

  getProviderHealth(providerId: string): { recentFailures: number; available: boolean } {
    const state = this.providerFailures.get(providerId) || { count: 0, available: true };
    return { recentFailures: state.count, available: state.available };
  }

  estimateCost(opts: {
    taskType?: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    includeLocalModels?: boolean;
  }): { provider: string; model: string; estimatedCost: number; alternatives?: Array<{ provider: string; model: string; estimatedCost: number }> } {
    const route = this.selectRoute({ taskType: opts.taskType });
    const mc = this._findModelConfig(route.provider, route.model);
    const cost = this._calcCost(mc, opts.estimatedInputTokens, opts.estimatedOutputTokens);
    const result: any = { provider: route.provider, model: route.model, estimatedCost: cost };

    if (opts.includeLocalModels) {
      const alternatives: any[] = [];
      for (const [pid, pconfig] of Object.entries(this.config.providers || {})) {
        for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
          const m = mconfig as any;
          if ((m.costPer1kInput || 0) === 0 && (m.costPer1kOutput || 0) === 0) {
            alternatives.push({ provider: pid, model: m.id, estimatedCost: 0 });
          }
        }
      }
      result.alternatives = alternatives;
    }

    return result;
  }

  findModelsBySpecialization(spec: string): any[] {
    const result: any[] = [];
    for (const [, pconfig] of Object.entries(this.config.providers || {})) {
      for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
        const m = mconfig as any;
        const specs: string[] = Array.isArray(m.specialization) ? m.specialization : (m.specialization ? [m.specialization] : []);
        if (specs.includes(spec)) result.push(m);
      }
    }
    return result;
  }

  findModelsByTier(tier: string): any[] {
    const result: any[] = [];
    for (const [, pconfig] of Object.entries(this.config.providers || {})) {
      for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
        const m = mconfig as any;
        if (m.tier === tier) result.push(m);
      }
    }
    return result;
  }

  findCheapestModel(): any {
    let cheapest: any = null;
    for (const [, pconfig] of Object.entries(this.config.providers || {})) {
      for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
        const m = mconfig as any;
        if (!cheapest || (m.costPer1kInput || 0) < (cheapest.costPer1kInput || 0)) {
          cheapest = m;
        }
      }
    }
    return cheapest;
  }

  findFastestModel(): any {
    for (const tier of ['flash', 'mini', 'fast', 'local']) {
      for (const [, pconfig] of Object.entries(this.config.providers || {})) {
        for (const [, mconfig] of Object.entries((pconfig as any).models || {})) {
          if ((mconfig as any).tier === tier) return mconfig;
        }
      }
    }
    const first = Object.values((Object.values(this.config.providers || {})[0] as any)?.models || {});
    return first[0] || null;
  }

  // Backward-compat stubs
  getAdapter(providerId: string): any | undefined {
    return undefined;
  }

  getHealthyProviders(): string[] {
    return Object.keys(this.config.providers || {}).filter(pid => {
      const state = this.providerFailures.get(pid);
      return !state || state.available !== false;
    });
  }

  updateHealth(_providerId: string, _health: any): void {}
  updateBudget(_agentId: string, _status: any): void {}
  async checkAllHealth(): Promise<Map<string, any>> { return new Map(); }

  private _getBudgetLimit(agentId: string): number {
    return (
      this.config.routingRules?.budgetLimits?.[agentId]?.dailyLimit ||
      this.config.routingRules?.budgetLimits?.default?.dailyLimit ||
      this.config.budget?.dailyLimitUsd ||
      10
    );
  }

  private _getWarningThreshold(agentId: string): number {
    return (
      this.config.routingRules?.budgetLimits?.[agentId]?.warningThreshold ||
      this.config.routingRules?.budgetLimits?.default?.warningThreshold ||
      this.config.budget?.warningThreshold ||
      0.8
    );
  }

  private _findModelConfig(providerId: string, modelId: string): any {
    const pconfig = this.config.providers?.[providerId];
    if (!pconfig) return null;
    for (const [, mconfig] of Object.entries(pconfig.models || {})) {
      if ((mconfig as any).id === modelId) return mconfig;
    }
    return null;
  }

  private _calcCost(mc: any, inputTokens: number, outputTokens: number): number {
    if (!mc) return 0;
    return (inputTokens / 1000) * (mc.costPer1kInput || 0) + (outputTokens / 1000) * (mc.costPer1kOutput || 0);
  }
}
