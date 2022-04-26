import React from 'react'

import {
  MediaOuterStyle,
  NFTImageHeight,
  NFTImageWidth,
  TokenMetadataStyle,
} from './CustomStyles'

export function NFTPlaceholder() {
  return (
    <TokenMetadataStyle className={`${NFTImageWidth} animate-pulse`}>
      <MediaOuterStyle className={`${NFTImageHeight}`}>
        {/* <div className="flex h-full w-full animate-pulse space-x-4 px-5">
          <div
            className={`radius-100 h-full w-full rounded-md bg-[#131417]`}
          ></div>
        </div> */}
      </MediaOuterStyle>
    </TokenMetadataStyle>
  )
}
