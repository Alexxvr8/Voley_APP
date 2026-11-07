// Username input with the mobile keyboard tweaks (no autocapitalize or autocorrect).
import { INPUT_CLASS, LABEL_CLASS, LABEL_TEXT_CLASS } from '@/shared/ui/form'

export function UsernameField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className={LABEL_CLASS}>
      <span className={LABEL_TEXT_CLASS}>Usuario</span>
      <input
        className={INPUT_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />
    </label>
  )
}
