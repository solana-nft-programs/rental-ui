import styled from '@emotion/styled'
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

export function NFTPlaceholder({}) {
  return (
    <TokenMetadata>
      <div id="media-outer">
        <div className="flex h-full w-full animate-pulse space-x-4 px-5">
          <div className="radius-100 h-full w-full rounded-md bg-gray-700"></div>
        </div>
      </div>
    </TokenMetadata>
  )
}
