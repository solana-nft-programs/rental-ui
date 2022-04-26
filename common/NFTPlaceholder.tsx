import React from 'react'

import { MediaOuterStyle, TokenMetadataStyle } from './CustomStyles'

export function NFTPlaceholder() {
  return (
    <TokenMetadataStyle className="w-[280px] animate-pulse">
      <MediaOuterStyle className="h-[280px]">
        {/* <div className="flex h-full w-full animate-pulse space-x-4 px-5">
          <div
            className={`radius-100 h-full w-full rounded-md bg-[#131417]`}
          ></div>
        </div> */}
      </MediaOuterStyle>
    </TokenMetadataStyle>
  )
}
