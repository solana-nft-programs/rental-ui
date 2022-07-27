import { css } from '@emotion/react'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export const Glow = ({
  colorized,
  color = 'glow',
  angle = 35.64,
  blur = 50,
  scale = 1,
  opacity = 0.7,
  children,
  className,
}: {
  colorized?: boolean
  color?: string
  angle?: number
  blur?: number
  scale?: number
  opacity?: number
  children: JSX.Element | JSX.Element[]
  className?: string
}) => {
  const { config } = useProjectConfig()
  return (
    <div className={`relative h-fit w-fit overflow-visible`}>
      <div
        className={`absolute left-1/4 top-0 h-full w-1/2 rounded-full ${
          color === 'accent'
            ? 'bg-accent'
            : color === 'secondary'
            ? 'bg-secondary'
            : 'bg-glow'
        } ${className}`}
        css={css`
          opacity: ${opacity};
          filter: blur(${blur}px);
          transform: rotate(${angle}deg) scale(${scale});
          ${colorized &&
          css`
            background-color: ${config.colors.secondary} !important;
          `}
        `}
      ></div>
      <div className="relative">{children}</div>
    </div>
  )
}
