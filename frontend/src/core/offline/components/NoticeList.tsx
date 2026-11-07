// Floating messages pushed with `notify`, each with a close button.
import { dismissNotice, useNotices } from '../notices'

export function NoticeList() {
  const notices = useNotices()
  if (notices.length === 0) return null

  return (
    <div
      className="fixed inset-x-0 top-2 z-50 mx-auto flex max-w-md flex-col gap-2 px-4"
      aria-live="polite"
    >
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="flex items-start gap-3 rounded-xl bg-slate-900 p-3 text-sm text-white shadow-lg"
        >
          <p className="flex-1">{notice.text}</p>
          <button
            type="button"
            onClick={() => dismissNotice(notice.id)}
            aria-label="Cerrar aviso"
            className="text-slate-300"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
