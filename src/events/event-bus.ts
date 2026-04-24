// @ts-nocheck
/**
 * src/events/event-bus.ts — Minimal type contract for the EventBus
 * consumed by src/channels/service.ts.
 *
 * WHY THIS FILE EXISTS
 *
 * src/channels/service.ts imports `EventBus` from this path. Previously
 * this file did not exist; the import survived only because TypeScript
 * type-elision stripped it at runtime (EventBus is used only as a type
 * annotation in service.ts, never as a value). That is a fragile shape:
 * any future code that uses EventBus as a value would crash at runtime
 * with no warning from typecheck (the codebase uses @ts-nocheck).
 *
 * This file makes the contract textual. It is a type-only shim — it
 * declares the shape channels/service.ts depends on. No runtime
 * behaviour is introduced. When a concrete event bus is implemented,
 * that implementation must satisfy this shape.
 *
 * See: agents/_shared/communication-protocols.md — the agent-graph
 * event bus contract operates on the same publish/subscribe model.
 */

/**
 * Event shape used by the channel layer when publishing domain events.
 * Minimal fields required by src/channels/service.ts.
 */
export interface EventBusEvent {
  id: string;
  type: string;
  source: string;
  payload?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * EventBus contract — the object injected into channels/service.ts via
 * setEventBus(bus). At minimum the bus publishes events; a richer
 * implementation may also subscribe and unsubscribe.
 */
export interface EventBus {
  /**
   * Publish an event. Fire-and-forget from the caller's perspective.
   */
  publish(event: EventBusEvent): Promise<void>;

  /**
   * Optional: subscribe a handler to events of a given type. Returns
   * an unsubscribe function. Concrete implementations that support
   * pub-sub should implement this; callers that only publish do not
   * require it.
   */
  subscribe?(
    eventType: string,
    handler: (event: EventBusEvent) => Promise<void> | void
  ): () => void;
}
