/**
 * Lightweight event bus for Phaser ↔ React communication.
 * Phaser scenes emit events here; React components subscribe to them.
 */

type Listener = (...args: any[]) => void;

class GameEventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }

  removeAll() {
    this.listeners.clear();
  }
}

export const EventBus = new GameEventBus();
