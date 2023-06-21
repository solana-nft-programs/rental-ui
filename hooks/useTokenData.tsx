import type { AccountData } from '@cardinal/common'
import { findMintMetadataId } from '@cardinal/common'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import type * as splToken from '@solana/spl-token'
import { getAccount } from '@solana/spl-token'
import type { Connection, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenData } from 'data/data'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { fetchAccountDataById } from 'providers/SolanaAccountsProvider'

export type SingleTokenData = Omit<TokenData, 'recipientTokenAccount'> & {
  recipientTokenAccount?: AccountData<splToken.Account>
  metadata?: AccountData<any>
}

export const useTokenData = (
  tokenManagerId?: PublicKey,
  refreshInterval?: number
) => {
  const { connection, environment } = useEnvironmentCtx()

  return useQuery<SingleTokenData | undefined>(
    ['useTokenData', tokenManagerId?.toString(), environment],
    async () => {
      if (!tokenManagerId) return
      return getTokenData(connection, tokenManagerId)
    },
    {
      enabled: !!tokenManagerId,
      refetchInterval: refreshInterval || 5000,
    }
  )
}

export async function getTokenData(
  connection: Connection,
  tokenManagerIdOrMintId: PublicKey
): Promise<SingleTokenData> {
  const tokenManagerData = await tokenManager.accounts
    .getTokenManager(connection, tokenManagerIdOrMintId)
    .catch(async () => {
      const tmId = findTokenManagerAddress(tokenManagerIdOrMintId)
      return tokenManager.accounts.getTokenManager(connection, tmId)
    })

  const metaplexId = findMintMetadataId(tokenManagerData.parsed.mint)
  const metaplexDataRaw = await metaplex.Metadata.fromAccountAddress(
    connection,
    metaplexId
  ).catch((e) => {
    console.log('Failed to get metaplex data', e)
    return null
  })
  const metaplexData = metaplexDataRaw
    ? {
        pubkey: metaplexId,
        parsed: metaplexDataRaw,
      }
    : undefined

  // TODO lookup metaplex in parallel
  const idsToFetch = [
    tokenManagerData.parsed.claimApprover,
    tokenManagerData.parsed.recipientTokenAccount,
    ...tokenManagerData.parsed.invalidators,
  ]
  const accountsById = await fetchAccountDataById(connection, idsToFetch)

  let metadata: AccountData<any> | null = null
  if (metaplexData) {
    try {
      const json = await fetch(metaplexData.parsed.data.uri).then((r) =>
        r.json()
      )
      metadata = { pubkey: metaplexData.pubkey, parsed: json }
    } catch (e) {
      console.log('Failed to get metadata data', e)
    }
  }

  let recipientTokenAccount: AccountData<splToken.Account> | null = null
  if (tokenManagerData?.parsed.recipientTokenAccount) {
    try {
      const recipientTokenAccountParsed = await getAccount(
        connection,
        tokenManagerData?.parsed.recipientTokenAccount
      )
      recipientTokenAccount = {
        pubkey: tokenManagerData?.parsed.recipientTokenAccount,
        parsed: recipientTokenAccountParsed,
      }
    } catch (e) {
      console.log('Failed to get recipient token account', e)
    }
  }

  const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
    (invalidator) =>
      accountsById[invalidator.toString()]?.owner.equals(
        TIME_INVALIDATOR_ADDRESS
      )
  )[0]
  const useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
    (invalidator) =>
      accountsById[invalidator.toString()]?.owner.equals(
        USE_INVALIDATOR_ADDRESS
      )
  )[0]
  return {
    metaplexData,
    tokenManager: tokenManagerData,
    claimApprover:
      tokenManagerData.parsed.claimApprover?.toString() &&
      accountsById[tokenManagerData.parsed.claimApprover?.toString()]?.type ===
        'paidClaimApprover'
        ? (accountsById[
            tokenManagerData.parsed.claimApprover?.toString()
          ] as AccountData<PaidClaimApproverData>)
        : undefined,
    useInvalidator: useInvalidatorId
      ? (accountsById[
          useInvalidatorId.toString()
        ] as AccountData<UseInvalidatorData>)
      : undefined,
    timeInvalidator: timeInvalidatorId
      ? (accountsById[
          timeInvalidatorId.toString()
        ] as AccountData<TimeInvalidatorData>)
      : undefined,
    metadata: metadata ?? undefined,
    recipientTokenAccount: recipientTokenAccount ?? undefined,
  }
}
