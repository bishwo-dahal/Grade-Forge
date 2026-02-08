// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

import type { ComponentType } from "react";

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  type: string;
}

export interface AlertItem extends NotificationItem {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}

export type CalendarDay = number;

// NOTE: Added dashboard task types to keep notification services consistent.
export interface TaskItem {
  id: number;
  text: string;
  completed: boolean;
}

// NOTE: Added deadline model for legacy right panel lists.
export interface DeadlineItem {
  title: string;
  className: string;
  dueDate: string;
  type: string;
  color: string;
}
