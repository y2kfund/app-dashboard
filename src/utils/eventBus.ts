// src/utils/eventBus.ts
export const eventBus = {
    events: {} as Record<string, Function[]>,
  
    emit(event: string, data: any) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data))
      }
    },
  
    on(event: string, callback: Function) {
      if (!this.events[event]) {
        this.events[event] = []
      }
      this.events[event].push(callback)
    },
  
    off(event: string, callback: Function) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(cb => cb !== callback)
      }
    }
  }
  