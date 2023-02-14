import type { AccountData } from '@cardinal/common'
import { tryPublicKey } from '@cardinal/common'
import type { TokenData } from 'apis/api'
import { getMintfromTokenData } from 'common/tokenDataUtils'
import type { ProjectConfig } from 'config/config'
import { tracer, withTrace } from 'monitoring/trace'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQueries, useQuery } from '@tanstack/react-query'

export const mintMetadataQueryKey = (
  tokenData: Pick<TokenData, 'metaplexData'> | Pick<TokenData, 'indexedData'>
) => {
  return ['useMintMetadata', getMintfromTokenData(tokenData)]
}

export const mintMetadataQuery = async (
  config: ProjectConfig,
  tokenData:
    | Pick<TokenData, 'metadata'>
    | Pick<TokenData, 'metaplexData'>
    | Pick<TokenData, 'indexedData'>
) => {
  if ('metadata' in tokenData && tokenData.metadata) return tokenData.metadata
  if (
    'indexedData' in tokenData &&
    tokenData?.indexedData?.mint_address_nfts?.metadata_json?.image &&
    !config.indexMetadataDisabled
  ) {
    return {
      pubkey: tryPublicKey(tokenData.indexedData.address)!,
      parsed: {
        image: tokenData?.indexedData?.mint_address_nfts?.metadata_json?.image,
        attributes: Array.isArray(
          tokenData?.indexedData?.mint_address_nfts?.metadatas_attributes
        )
          ? tokenData?.indexedData?.mint_address_nfts?.metadatas_attributes
          : [],
      },
    }
  }

  if (
    'indexedData' in tokenData &&
    tokenData?.indexedData?.mint_address_nfts?.uri
  ) {
    const json = await fetch(
      tokenData?.indexedData?.mint_address_nfts?.uri
    ).then((r) => r.json())
    if (!json) return undefined
    return {
      pubkey: tryPublicKey(tokenData.indexedData.address)!,
      parsed: json,
    }
  }
  if ('metaplexData' in tokenData && tokenData?.metaplexData?.parsed.data.uri) {
    const uri = tokenData?.metaplexData?.parsed.data.uri
    const json = await fetch(uri).then((r) => r.json())
    if (!json) return undefined
    return {
      pubkey: tokenData.metaplexData.pubkey,
      parsed: json,
    }
  }
}

export const useMintMetadata = (
  tokenData: Pick<TokenData, 'metaplexData'> | Pick<TokenData, 'indexedData'>
) => {
  const { config } = useProjectConfig()
  return useQuery<
    | AccountData<{
        image: string
        attributes?: { trait_type: string; value: string }[]
      }>
    | undefined
  >(
    mintMetadataQueryKey(tokenData),
    () =>
      withTrace(() => {
        return mintMetadataQuery(config, tokenData)
      }, tracer({ name: 'useMintMetadata' })),
    { refetchOnMount: false }
  )
}

export const useMintMetadatas = (tokenDatas: TokenData[]) => {
  const { config } = useProjectConfig()
  return useQueries(
    tokenDatas.map((tokenData) => {
      return {
        queryKey: mintMetadataQueryKey(tokenData),
        queryFn: () => mintMetadataQuery(config, tokenData),
      }
    })
  )
}
