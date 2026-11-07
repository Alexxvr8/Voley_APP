// Large monospace recovery code with a copy button.
import { useState } from 'react'

export function RecoveryCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Clipboard access can be blocked; the code is still on screen to write down.
    }
  }

  return (
    <div className="space-y-2 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200">
      <p className="font-mono text-2xl font-bold tracking-widest text-blue-900 select-all">
        {code}
      </p>
      <button type="button" onClick={copy} className="text-sm font-medium text-blue-800 underline">
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
