import type { AccountData } from '@cardinal/common'
import { fetchAccountDataById, tryDecodeIdlAccount } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type {
  TOKEN_MANAGER_PROGRAM,
  TokenManagerData,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TOKEN_MANAGER_IDL } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenData } from 'apis/api'
import type { ProjectConfig, TokenFilter } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'

import { useMintList } from './useMintList'
import { WRAPPED_SOL_MINT } from './usePaymentMints'

export const TOKEN_DATA_KEY = 'tokenData'

export type BrowseAvailableTokenData = Pick<
  TokenData,
  | 'indexedData'
  | 'tokenManager'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
>

export function filterPaymentMints<
  T extends Pick<
    TokenData,
    'tokenManager' | 'timeInvalidator' | 'claimApprover'
  >
>(tokens: T[], config: ProjectConfig, paymentMints?: string[]) {
  return tokens.filter((token) => {
    if (
      config.type === 'Collection' &&
      (token.timeInvalidator?.parsed.extensionPaymentMint ||
        token.claimApprover?.parsed?.paymentMint)
    ) {
      if (config.allowNonSol) {
        const allowedMints = paymentMints ??
          config.rentalCard.invalidationOptions?.paymentMints ?? [
            WRAPPED_SOL_MINT,
          ]
        return (
          allowedMints.includes(
            token.timeInvalidator?.parsed.extensionPaymentMint?.toString() ?? ''
          ) ||
          allowedMints.includes(
            token.claimApprover?.parsed.paymentMint.toString() ?? ''
          )
        )
      } else {
        return (
          token.timeInvalidator?.parsed.extensionPaymentMint?.toString() ===
            WRAPPED_SOL_MINT ||
          token.claimApprover?.parsed.paymentMint.toString() ===
            WRAPPED_SOL_MINT
        )
      }
    }
    return true
  })
}

export const useBrowseAvailableTokenDatas2 = (
  disabled: boolean,
  disableRefetch: boolean,
  subFilter?: TokenFilter
) => {
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const page = 0
  const pageSize = 5000
  const mintList = useMintList()
  const { getAccountDataById } = useAccounts()
  return useQuery<BrowseAvailableTokenData[]>(
    [
      TOKEN_DATA_KEY,
      'useBrowseAvailableTokenDatas',
      config.name,
      subFilter,
      page,
      mintList.data?.join(','),
    ],
    async () => {
      const mintIds =
        mintList.data?.slice(page * pageSize, (page + 1) * pageSize) ?? []
      const tokenManagerIds = [...mintIds, ...mintIds, ...mintIds].map((m) =>
        findTokenManagerAddress(new PublicKey(m))
      )

      const tokenManagerAccountInfos = await fetchAccountDataById(
        connection,
        tokenManagerIds
      )
      const tokenManagerDatas: {
        pubkey: PublicKey
        parsed: TokenManagerData
      }[] = []
      Object.entries(tokenManagerAccountInfos).forEach(([k, a]) => {
        if (a) {
          const tm = tryDecodeIdlAccount<'tokenManager', TOKEN_MANAGER_PROGRAM>(
            a,
            'tokenManager',
            TOKEN_MANAGER_IDL
          )
          if (tm.parsed) {
            tokenManagerDatas.push({ ...tm, pubkey: new PublicKey(k) })
          }
        }
      })

      ////
      const idsToFetch = tokenManagerDatas.reduce(
        (acc, tm) => [
          ...acc,
          tm.parsed.claimApprover,
          ...tm.parsed.invalidators,
        ],
        [] as (PublicKey | null)[]
      )
      const accountsById = await getAccountDataById(idsToFetch)

      let tokenDatas = tokenManagerDatas.map((tokenManagerData) => {
        const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
          (invalidator) =>
            accountsById[invalidator.toString()]?.owner?.toString() ===
            TIME_INVALIDATOR_ADDRESS.toString()
        )[0]
        const useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
          (invalidator) =>
            accountsById[invalidator.toString()]?.owner?.toString() ===
            USE_INVALIDATOR_ADDRESS.toString()
        )[0]
        return {
          tokenManager: tokenManagerData,
          claimApprover: tokenManagerData.parsed.claimApprover?.toString()
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
        }
      })
      if (config.type === 'Collection') {
        tokenDatas = filterPaymentMints(tokenDatas, config)
      }
      console.log('====', tokenDatas)
      return tokenDatas
    },
    {
      refetchInterval: !disableRefetch ? 60000 : undefined,
      refetchOnMount: false,
      enabled: !!config && !disabled,
    }
  )
}
