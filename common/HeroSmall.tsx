import { css } from '@emotion/react'
import { darken } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { Glow } from './Glow'
import { HeroStats } from './HeroStats'

export const HeroSmall: React.FC = () => {
  const { config } = useProjectConfig()
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-16 py-8 px-4 lg:justify-between lg:px-10">
      <div className="flex items-center gap-4">
        <div
          className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-border"
          css={css`
            background: ${darken(0.05, config.colors.main)};
          `}
        >
          <img className="w-full" src={config.logoImage} alt={config.name} />
        </div>
        <div className="text-3xl text-light-0">{config.displayName}</div>
      </div>
      <HeroStats />
    </div>
  )
}
