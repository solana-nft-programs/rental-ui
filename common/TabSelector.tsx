import { css } from '@emotion/react'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'

type Option<T> = {
  label: string | React.ReactNode
  value: T
  disabled?: boolean
}

type Props<T> = {
  placeholder?: string
  options: Option<T>[]
  defaultOption?: Option<T>
  onChange?: (arg: Option<T>) => void
}

export const TabSelector = <T,>({
  defaultOption,
  onChange,
  options = [],
}: Props<T>) => {
  const { config } = useProjectConfig()
  const [value, setValue] = useState<Option<T> | undefined>(defaultOption)
  return (
    <div
      className="flex rounded-lg border-[1px] border-border"
      css={css`
        background: ${lighten(0.08, config.colors.main)};
      `}
    >
      {options.map((o) => (
        <div
          key={o.label?.toString()}
          className={`flex items-center justify-between rounded-lg px-5 py-2 text-sm text-light-0 transition-colors ${
            o.disabled ? 'opacity-25' : 'cursor-pointer hover:text-primary'
          }`}
          css={css`
            background: ${value?.value === o.value
              ? lighten(0.03, config.colors.main)
              : ''};
          `}
          onClick={() => {
            if (o.disabled) return
            setValue(o)
            onChange && onChange(o)
          }}
        >
          <div>{o.label}</div>
        </div>
      ))}
    </div>
  )
}
