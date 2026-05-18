import { ReactNode } from 'react'

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="auth-wrapper">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">◎</span>
          <span>OmniverseWeb</span>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  )
}
