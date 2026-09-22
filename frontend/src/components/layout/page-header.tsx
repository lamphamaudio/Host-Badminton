import React from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

/** Shared title block for every app tab, so headings never wrap around their action buttons. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 pt-2">
      <div className="min-w-0">
        <h1 className="text-[1.65rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-fg text-balance">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm leading-snug text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}
