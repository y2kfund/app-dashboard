declare module '@y2kfund/analyze-timeline' {
  import type { DefineComponent } from 'vue'
  
  export interface TimelineEvent {
    id: string
    date: Date
    title?: string
    description?: string
  }
  
  export interface AnalyzeTimelineProps {
    events?: TimelineEvent[]
    selectedEventId?: string
  }
  
  export const AnalyzeTimeline: DefineComponent<
    AnalyzeTimelineProps,
    {},
    {},
    {},
    {},
    {},
    {},
    {
      'event-selected': (event: TimelineEvent) => void
      'navigate': (direction: 'prev' | 'next') => void
    }
  >
  
  export default AnalyzeTimeline
}
