// Centered grey message for empty, loading and error states of a screen.
import type { ReactNode } from 'react'

export function PageMessage({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-slate-500">{children}</p>
}
