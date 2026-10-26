import type { NotificationItem } from '../types'
import { STORAGE_KEYS, Store, useStoreValue } from './storage'
import { tsDaysAgo } from '../utils'

function seedNotifications(): NotificationItem[] {
  return [
    {
      id: 'nt_sample_1',
      createdAt: tsDaysAgo(0, 5),
      kind: 'community-watch',
      title: 'Community watch — North District',
      body: 'Dark-spot reports on tomato in North District look elevated across the last four weeks (starter data). This is not a confirmed outbreak.',
      read: false,
      sample: true,
      link: { label: 'Open community centre', to: '/app/community?region=north&crop=tomato' },
    },
    {
      id: 'nt_sample_2',
      createdAt: tsDaysAgo(2, 3),
      kind: 'analysis-complete',
      title: 'Assessment ready — Tomato',
      body: 'A starter diagnosis for North Block completed: Early blight pattern, moderate band. Produced by the local engine after the run.',
      read: false,
      sample: true,
      link: { label: 'View explanations', to: '/app/explanations?analysis=hx_sample_1' },
    },
    {
      id: 'nt_sample_3',
      createdAt: tsDaysAgo(2, 4),
      kind: 'comparison-saved',
      title: 'Treatment comparison saved',
      body: 'A 3-option comparison for the early-blight assessment is stored in the treatment planner.',
      read: true,
      sample: true,
      link: { label: 'Open treatment planner', to: '/app/treatments' },
    },
    {
      id: 'nt_sample_4',
      createdAt: tsDaysAgo(4, 8),
      kind: 'reminder',
      title: 'Follow-up scouting reminder',
      body: 'If patches on the maize starter plot grew since the last check, capture a fresh observation in Fields & Crops.',
      read: true,
      sample: true,
      link: { label: 'Open fields', to: '/app/fields' },
    },
    {
      id: 'nt_sample_5',
      createdAt: tsDaysAgo(6, 2),
      kind: 'community-watch',
      title: 'Community watch — River Belt',
      body: 'Yellowing reports on rice in River Belt remain at watch level (starter data). Elevation is modest and needs continued observation.',
      read: true,
      sample: true,
      link: { label: 'Open community centre', to: '/app/community?region=river&crop=rice' },
    },
  ]
}

export const notificationsStore = new Store<NotificationItem[]>(STORAGE_KEYS.notifications, seedNotifications)

export function useNotifications(): NotificationItem[] {
  return useStoreValue(notificationsStore)
}

export function useUnreadCount(): number {
  return useNotifications().filter((n) => !n.read).length
}

export function pushNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'read' | 'sample'> & { sample?: boolean }) {
  notificationsStore.update((prev) => [
    { id: `nt_${Date.now().toString(36)}`, createdAt: Date.now(), read: false, sample: item.sample ?? false, ...item },
    ...prev,
  ].slice(0, 50))
}

export function markNotification(id: string, read: boolean) {
  notificationsStore.update((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
}

export function toggleNotificationRead(id: string) {
  notificationsStore.update((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)))
}

export function markAllNotificationsRead() {
  notificationsStore.update((prev) => prev.map((n) => ({ ...n, read: true })))
}

export function removeNotification(id: string) {
  notificationsStore.update((prev) => prev.filter((n) => n.id !== id))
}
