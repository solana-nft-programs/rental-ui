import styled from '@emotion/styled'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React from 'react'

import { TokenMetadata } from './NFT'

export const TokensOuter = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-width: 880px;
  margin: 10px auto;
  gap: 20px;

  @media (max-width: 1224px) {
    justify-content: center;
  }
`

export function NFTPlaceholder() {
  const { config } = useProjectConfig()
  return (
    <TokenMetadata allBorderRadius={true} className="animate-pulse">
      <div id="media-outer">
        <div className="flex h-full w-full animate-pulse space-x-4 px-5">
          <div
            style={{ background: lighten(0.1, config.colors.main) }}
            className={`radius-100 h-full w-full rounded-md`}
          ></div>
        </div>
      </div>
    </TokenMetadata>
  )
}
