// Single TanStack Query client: caches server data and refetches it when it may be stale. The cache is
// also kept on the device (see core/offline), so data is kept for a week instead of minutes.
import { onlineManager, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 7 * 24 * 60 * 60 * 1000, retry: 1 },
  },
})

// TanStack Query assumes it is online until the browser fires an "offline" event. When the app is
// opened already without network that event never comes, so start from the browser's own flag.
onlineManager.setOnline(navigator.onLine)
