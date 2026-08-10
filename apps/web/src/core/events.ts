import type { EntityId, IsoDateTime } from "@/core/identity";

export type DomainEventType =
  | "learning.task.completed"
  | "learning.space.archived"
  | "learning.space.created"
  | "learning.space.updated"
  | "learning.space.paused"
  | "learning.task.scheduled"
  | "career.skill-gap.changed"
  | "fitness.session.completed"
  | "knowledge.resource.updated"
  | "badge.earned"
  | "plan.revision.proposed"
  | "plan.revision.confirmed";

export type DomainEvent<T = unknown> = {
  eventId: EntityId;
  eventType: DomainEventType;
  moduleId: string;
  entityId: EntityId;
  schemaVersion: number;
  occurredAt: IsoDateTime;
  payload: T;
};

export type DomainEventHandler<T = unknown> = (event: DomainEvent<T>) => void;

/**
 * In-process typed event bus. Deliberately synchronous and dependency-free:
 * no distributed infrastructure until a real second process needs it
 * (MODULE_ARCHITECTURE.md §6).
 */
export function createEventBus() {
  const handlers = new Map<DomainEventType, Set<DomainEventHandler>>();

  function subscribe<T>(eventType: DomainEventType, handler: DomainEventHandler<T>) {
    const set = handlers.get(eventType) ?? new Set<DomainEventHandler>();
    set.add(handler as DomainEventHandler);
    handlers.set(eventType, set);
    return () => {
      set.delete(handler as DomainEventHandler);
    };
  }

  function publish<T>(event: DomainEvent<T>) {
    const set = handlers.get(event.eventType);
    if (!set) return;
    for (const handler of set) {
      handler(event);
    }
  }

  return { subscribe, publish };
}

export type EventBus = ReturnType<typeof createEventBus>;
