import * as amplitude from '@amplitude/analytics-browser'
import type { ProjectConfig } from 'config/config'

import type { TokenData } from '../apis/api'

export const logConfigEvent = (
  eventName: string,
  config: ProjectConfig,
  eventProperties?: any
) => {
  amplitude.logEvent(eventName, {
    collection_id: config.name,
    collection_name: config.displayName,
    collection_type: config.type,
    collection_rate: config.marketplaceRate,
    ...eventProperties,
  })
}

export const logConfigTokenDataEvent = (
  eventName: string,
  config: ProjectConfig,
  tokenData: TokenData,
  eventProperties?: any
) => {
  logConfigEvent(eventName, config, {
    ...eventProperties,
    nft_name: tokenData.metaplexData?.parsed.data.name,
    nft_mint_id: tokenData.metaplexData?.parsed.mint.toString(),
    token_manager_id: tokenData.tokenManager?.pubkey.toString(),
    token_manager_state_changed_at:
      tokenData.tokenManager?.parsed.stateChangedAt.toNumber(),
  })
}
