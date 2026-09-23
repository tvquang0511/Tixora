const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_BASE_URL. Set it in apps/mobile-app/.env before starting the app.',
  );
}

export const APP_CONFIG = {
  appName: 'Tixora Staff',
  apiBaseUrl,
};

export const STORAGE_KEYS = {
  accessToken: 'tixora.staff.accessToken',
  refreshToken: 'tixora.staff.refreshToken',
  currentScanSession: 'tixora.staff.currentScanSession',
  prefetchedTicketSet: 'tixora.staff.prefetchedTicketSet',
  localScannedBuckets: 'tixora.staff.localScannedBuckets',
  pendingSyncQueue: 'tixora.staff.pendingSyncQueue',
  recentScanHistory: 'tixora.staff.recentScanHistory',
} as const;