import { historyStore } from './historyService'
import { notificationsStore } from './notificationService'
import { fieldsStore } from './fieldService'
import { reportsStore } from './communityService'
import { savedComparisonsStore } from './savedComparisons'
import { updatePreferences } from './preferences'
import { downloadJSON } from '../utils/image'

/**
 * Central workspace-data management for Settings + the profile menu.
 */
export function resetWorkspaceData() {
  historyStore.reset()
  notificationsStore.reset()
  fieldsStore.reset()
  reportsStore.reset()
  savedComparisonsStore.reset()
  updatePreferences({ onboardedAt: null })
}

export function exportWorkspaceData() {
  downloadJSON('agrownex-workspace-data.json', {
    exportedAt: new Date().toISOString(),
    note: 'Workspace data snapshot exported from AgrowNex. Contains your local records and starter data.',
    history: historyStore.read(),
    notifications: notificationsStore.read(),
    fields: fieldsStore.read(),
    communityReports: reportsStore.read(),
    savedComparisons: savedComparisonsStore.read(),
  })
}
