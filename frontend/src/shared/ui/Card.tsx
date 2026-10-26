// White rounded container used to group content on every screen.
import type { ReactNode } from 'react'

/** Extra classes in `className` are appended, e.g. to add spacing or remove padding. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>
}
