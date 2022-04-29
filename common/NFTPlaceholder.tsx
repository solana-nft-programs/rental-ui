import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'

import {
  NFTImageHeight,
  NFTImageWidth,
  TokenMetadataStyle,
} from './CustomStyles'

export function NFTPlaceholder() {
  const { config } = useProjectConfig()
  return (
    <TokenMetadataStyle
      className={`${NFTImageHeight} ${NFTImageWidth} animate-pulse`}
      style={{ background: lighten(0.1, config.colors.main) }}
    >
      {/*  */}
    </TokenMetadataStyle>
  )
}
