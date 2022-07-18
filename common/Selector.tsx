import { css } from '@emotion/react'
import { ChevronDown } from 'assets/ChevronDown'
import { ChevronRight } from 'assets/ChevronRight'
import { darken } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useRef, useState } from 'react'

type Option<T> = { label: string; value: T }
type Props<T> = {
  placeholder?: string
  options: Option<T>[]
  className?: string
  disabled?: boolean
  defaultOption?: Option<T>
  onChange?: (arg: Option<T>) => void
}

export const Selector = <T,>({
  placeholder = 'Select',
  defaultOption,
  disabled,
  className,
  onChange,
  options = [],
}: Props<T>) => {
  const { config } = useProjectConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState<Option<T> | undefined>(defaultOption)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [ref])

  return (
    <div className="relative z-40" ref={ref}>
      <div
        className={`${className} flex justify-between gap-1 rounded-md border-[1px] border-border px-3 py-2 transition-all ${
          disabled
            ? 'cursor-default opacity-50'
            : 'cursor-pointer hover:border-primary'
        }`}
        css={css`
          background: ${darken(0.03, config.colors.main)};
        `}
        onClick={() => !disabled && setIsOpen((v) => !v)}
      >
        {value ? (
          <div className="text-sm text-light-0">{value.label}</div>
        ) : (
          <div className="text-sm text-medium-3">{placeholder}</div>
        )}
        <ChevronDown />
      </div>
      {isOpen && (
        <div
          className="absolute w-full rounded-md"
          css={css`
            background: ${darken(0.03, config.colors.main)};
          `}
        >
          {options.map((o) => (
            <div
              key={o.label}
              className="flex cursor-pointer items-center justify-between p-3 text-sm text-light-0 transition-colors hover:text-primary"
              onClick={() => {
                setValue(o)
                setIsOpen((v) => !v)
                onChange && onChange(o)
              }}
            >
              <div>{o.label}</div>
              <ChevronRight />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
