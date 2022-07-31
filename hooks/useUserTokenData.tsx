import type { AccountData } from '@cardinal/common'
import { getBatchedMultipleAccounts } from '@cardinal/common'
import { tryPublicKey } from '@cardinal/namespaces-components'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { Edition } from '@metaplex-foundation/mpl-token-metadata'
import * as spl from '@solana/spl-token'
import type { AccountInfo, ParsedAccountData } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import { accountDataById } from 'apis/api'
import type { TokenFilter } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

import { TOKEN_DATA_KEY } from './useFilteredTokenManagers'
import { useWalletId } from './useWalletId'

export type UserTokenData = {
  tokenAccount?: {
    pubkey: PublicKey
    account: AccountInfo<ParsedAccountData>
  }
  mint?: spl.MintInfo
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: AccountData<metaplex.MetadataData>
  editionData?: AccountData<metaplex.EditionData | metaplex.MasterEditionData>
  metadata?: AccountData<any> | null
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
  recipientTokenAccount?: spl.AccountInfo | null
}

export const useUserTokenData = (filter?: TokenFilter, cluster?: string) => {
  const walletId = useWalletId()
  const { connection } = useEnvironmentCtx()

  return useQuery<UserTokenData[]>(
    [TOKEN_DATA_KEY, 'useUserTokenData', walletId, filter?.value],
    async () => {
      if (!walletId) return []

      const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletId),
        { programId: spl.TOKEN_PROGRAM_ID }
      )
      let tokenAccounts = allTokenAccounts.value
        .filter(
          (tokenAccount) =>
            tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
        )
        .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

      // lookup metaplex data
      const metaplexIds = await Promise.all(
        tokenAccounts.map(
          async (tokenAccount) =>
            (
              await metaplex.MetadataProgram.findMetadataAccount(
                new PublicKey(tokenAccount.account.data.parsed.info.mint)
              )
            )[0]
        )
      )
      // const metaplexMetadatas = await accountDataById(connection, metaplexIds)
      // TODO use accountDataById?
      const metaplexAccountInfos = await getBatchedMultipleAccounts(
        connection,
        metaplexIds
      )
      const metaplexData = metaplexAccountInfos.reduce(
        (acc, accountInfo, i) => {
          try {
            acc[tokenAccounts[i]!.pubkey.toString()] = {
              pubkey: metaplexIds[i]!,
              ...accountInfo,
              parsed: metaplex.MetadataData.deserialize(
                accountInfo?.data as Buffer
              ) as metaplex.MetadataData,
            }
          } catch (e) {}
          return acc
        },
        {} as {
          [tokenAccountId: string]: AccountData<metaplex.MetadataData>
        }
      )

      // filter by creators
      if (filter?.type === 'creators') {
        tokenAccounts = tokenAccounts.filter((tokenAccount) =>
          metaplexData[
            tokenAccount.pubkey.toString()
          ]?.parsed?.data?.creators?.some(
            (creator) =>
              filter.value.includes(creator.address.toString()) &&
              (cluster === 'devnet' || creator.verified)
          )
        )
      }

      // lookup delegates and
      const delegateIds = tokenAccounts.map((tokenAccount) =>
        tryPublicKey(tokenAccount.account.data.parsed.info.delegate)
      )
      const tokenAccountDelegateData = await accountDataById(
        connection,
        delegateIds
      )

      // filter by issuer
      if (filter?.type === 'issuer') {
        tokenAccounts = tokenAccounts.filter(
          (tokenAccount) =>
            tokenAccountDelegateData[
              tokenAccount.account.data.parsed.info.delegate
            ]?.type === 'tokenManager' &&
            filter.value.includes(
              (
                tokenAccountDelegateData[
                  tokenAccount.account.data.parsed.info.delegate
                ] as AccountData<TokenManagerData>
              ).parsed.issuer.toString()
            )
        )
      }

      const mintIds = tokenAccounts.map((tokenAccount) =>
        tryPublicKey(tokenAccount.account.data.parsed.info.mint)
      )
      const editionIds = await Promise.all(
        tokenAccounts.map(async (tokenAccount) =>
          Edition.getPDA(tokenAccount.account.data.parsed.info.mint)
        )
      )
      const idsToFetch = Object.values(tokenAccountDelegateData).reduce(
        (acc, accountData) => [
          ...acc,
          ...(accountData.type === 'tokenManager'
            ? [
                (accountData as AccountData<TokenManagerData>).parsed
                  .claimApprover,
                (accountData as AccountData<TokenManagerData>).parsed
                  .recipientTokenAccount,
                ...(accountData as AccountData<TokenManagerData>).parsed
                  .invalidators,
              ]
            : []),
        ],
        [...editionIds, ...mintIds] as (PublicKey | null)[]
      )

      const accountsById = {
        ...tokenAccountDelegateData,
        ...(await accountDataById(connection, idsToFetch)),
      }

      // const metadata = await Promise.all(
      //   tokenAccounts.map(async (tokenAccount) => {
      //     try {
      //       const md = metaplexData[tokenAccount.pubkey.toString()]
      //       const uri = md?.parsed.data.uri
      //       if (!md || !uri) {
      //         return null
      //       }
      //       const json = await fetch(uri).then((r) => r.json())
      //       return {
      //         pubkey: md.pubkey,
      //         parsed: json,
      //       }
      //     } catch (e) {}
      //   })
      // )

      return tokenAccounts.map((tokenAccount, i) => {
        const delegateData =
          accountsById[tokenAccount.account.data.parsed.info.delegate]

        let tokenManagerData: AccountData<TokenManagerData> | undefined
        let claimApproverId: PublicKey | undefined
        let timeInvalidatorId: PublicKey | undefined
        let useInvalidatorId: PublicKey | undefined
        if (delegateData?.type === 'tokenManager') {
          tokenManagerData = delegateData as AccountData<TokenManagerData>
          claimApproverId = tokenManagerData.parsed.claimApprover ?? undefined
          timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.type === 'timeInvalidator'
          )[0]
          useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.type === 'useInvalidator'
          )[0]
        }
        return {
          tokenAccount,
          mint: accountsById[
            tokenAccount.account.data.parsed.info.mint
          ] as spl.MintInfo,
          recipientTokenAccount: tokenManagerData?.parsed.recipientTokenAccount
            ? (accountsById[
                tokenManagerData.parsed.recipientTokenAccount?.toString()
              ] as spl.AccountInfo)
            : undefined,
          metaplexData: metaplexData[tokenAccount.pubkey.toString()],
          editionData: accountsById[editionIds[i]!.toString()] as
            | {
                pubkey: PublicKey
                parsed: metaplex.EditionData | metaplex.MasterEditionData
              }
            | undefined,
          // metadata: metadata.find((data) =>
          //   data
          //     ? data.pubkey.toBase58() ===
          //       metaplexData[tokenAccount.pubkey.toString()]?.pubkey.toBase58()
          //     : undefined
          // ),
          tokenManager: tokenManagerData,
          claimApprover: claimApproverId
            ? (accountsById[
                claimApproverId.toString()
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
    },
    {
      enabled: !!walletId,
      refetchInterval: 20000,
    }
  )
}
