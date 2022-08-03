import type { AccountData } from '@cardinal/common'
import { tryPublicKey } from '@cardinal/common'
import type { TokenData } from 'apis/api'
import { useQueries, useQuery } from 'react-query'

export const mintMetadataQueryKey = (tokenData: TokenData) => {
  return ['useMintMetadata', tokenData.metaplexData?.parsed.mint?.toString()]
}

export const mintMetadataQuery = async (
  tokenData:
    | Pick<TokenData, 'metadata'>
    | Pick<TokenData, 'metaplexData'>
    | Pick<TokenData, 'indexedData'>
) => {
  if ('metadata' in tokenData && tokenData.metadata) return tokenData.metadata
  if (
    'indexedData' in tokenData &&
    tokenData?.indexedData?.mint_address_nfts?.uri
  ) {
    const json = await fetch(
      tokenData?.indexedData?.mint_address_nfts?.uri
    ).then((r) => r.json())
    return {
      pubkey: tryPublicKey(tokenData.indexedData.address)!,
      parsed: json,
    }
  }
  if ('metaplexData' in tokenData && tokenData?.metaplexData?.parsed.data.uri) {
    const uri = tokenData?.metaplexData?.parsed.data.uri
    const json = await fetch(uri).then((r) => r.json())
    return {
      pubkey: tokenData.metaplexData.pubkey,
      parsed: json,
    }
  }
}

export const useMintMetadata = (
  tokenData:
    | Pick<TokenData, 'metadata'>
    | Pick<TokenData, 'metaplexData'>
    | Pick<TokenData, 'indexedData'>
) => {
  return useQuery<AccountData<any> | undefined>(
    [mintMetadataQueryKey(tokenData)],
    async () => {
      return mintMetadataQuery(tokenData)
    },
    { refetchOnMount: false }
  )
}

export const useMintMetadatas = (tokenDatas: TokenData[]) => {
  return useQueries(
    tokenDatas.map((tokenData) => {
      return {
        queryKey: mintMetadataQueryKey(tokenData),
        queryFn: () => mintMetadataQuery(tokenData),
      }
    })
  )
}
