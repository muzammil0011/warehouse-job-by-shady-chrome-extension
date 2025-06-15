// utils/eventBus.ts
type EventHandler = (payload?: any) => void;

class EventBus {
  private events = new Map<string, Set<EventHandler>>();

  on(eventName: string, handler: EventHandler): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(handler);

    // Return cleanup function
    return () => this.off(eventName, handler);
  }

  off(eventName: string, handler: EventHandler) {
    this.events.get(eventName)?.delete(handler);
  }

  emit(eventName: string, payload?: any) {
    this.events.get(eventName)?.forEach((handler) => handler(payload));
  }
}

export const eventBus = new EventBus();
