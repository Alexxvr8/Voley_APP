// "Contraseña" + "Repite la contraseña" inputs, used when creating an account or choosing a new password.
import { INPUT_CLASS, LABEL_CLASS, LABEL_TEXT_CLASS } from '@/shared/ui/form'

interface PasswordFieldsProps {
  password: string
  confirmation: string
  onPasswordChange: (value: string) => void
  onConfirmationChange: (value: string) => void
  /** Label of the first field, e.g. "Contraseña nueva". */
  label?: string
}

export function PasswordFields({
  password,
  confirmation,
  onPasswordChange,
  onConfirmationChange,
  label = 'Contraseña',
}: PasswordFieldsProps) {
  return (
    <>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>{label}</span>
        <input
          className={INPUT_CLASS}
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Repite la contraseña</span>
        <input
          className={INPUT_CLASS}
          type="password"
          value={confirmation}
          onChange={(e) => onConfirmationChange(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
    </>
  )
}
