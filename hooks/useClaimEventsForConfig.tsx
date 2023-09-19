import '@sentry/tracing'

import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { BN } from '@coral-xyz/anchor'
import type { PublicKey } from '@solana/web3.js'
import type { AccountData } from '@solana-nft-programs/common'
import { tryPublicKey } from '@solana-nft-programs/common'
import type { PaidClaimApproverData } from '@solana-nft-programs/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@solana-nft-programs/token-manager/dist/cjs/programs/timeInvalidator'
import { useInfiniteQuery } from '@tanstack/react-query'
import { tracer } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export const ACTIVITY_KEY = 'activity'

export type IndexedClaimEvent = {
  mint?: string
  token_manager_address?: string
  state?: number
  state_changed_at?: string
  issuer?: string
  recipient_token_account?: string
  claim_approver?: string
  paid_claim_approver_payment_mint: string
  paid_claim_approver_payment_amount: number
  time_invalidator_address: string
  time_invalidator_duration_seconds: number
  time_invalidator_extension_duration_seconds: number
  time_invalidator_extension_payment_amount: number
  time_invalidator_extension_payment_mint: string
  time_invalidator_max_expiration: number
  time_invalidator_expiration: number
  mint_address_nfts?: {
    name?: string
    uri?: string
    metadata_json?: {
      image?: string
    }
  }
}

export const tryBN = (n: number | null | undefined): BN | null => {
  if (n === null || n === undefined) return null
  try {
    return new BN(n)
  } catch {}
  return null
}

export const timeInvalidatorFromIndexedClaimEvent = (
  claimEvent: IndexedClaimEvent
): AccountData<
  Pick<
    TimeInvalidatorData,
    | 'durationSeconds'
    | 'expiration'
    | 'maxExpiration'
    | 'extensionDurationSeconds'
    | 'extensionPaymentAmount'
    | 'extensionPaymentMint'
  >
> | null => {
  const address = tryPublicKey(claimEvent.time_invalidator_address)
  if (!address) return null
  return {
    pubkey: address,
    parsed: {
      durationSeconds: tryBN(claimEvent.time_invalidator_duration_seconds ?? 0),
      extensionDurationSeconds: tryBN(
        claimEvent.time_invalidator_extension_duration_seconds
      ),
      extensionPaymentAmount: tryBN(
        claimEvent.time_invalidator_extension_payment_amount
      ),
      extensionPaymentMint: tryPublicKey(
        claimEvent.time_invalidator_extension_payment_mint
      ),
      maxExpiration: tryBN(claimEvent.time_invalidator_max_expiration),
      expiration: tryBN(claimEvent.time_invalidator_expiration),
    },
  }
}

export const claimApproverFromIndexedClaimEvent = (
  claimEvent: IndexedClaimEvent
): AccountData<
  Pick<PaidClaimApproverData, 'paymentMint' | 'paymentAmount'>
> | null => {
  const address = tryPublicKey(claimEvent.claim_approver)
  const paymentMint = tryPublicKey(claimEvent.paid_claim_approver_payment_mint)
  const paymentAmount = tryBN(claimEvent.paid_claim_approver_payment_amount)
  if (!address || !paymentMint || !paymentAmount || !claimEvent.claim_approver)
    return null
  return {
    pubkey: address,
    parsed: {
      paymentMint,
      paymentAmount,
    },
  }
}

const dedupeClaimEvents = (
  claimEvents: IndexedClaimEvent[],
  thresholdSeconds = 10
) => {
  return claimEvents.reduce(
    (acc, e) =>
      !acc.some(
        (e2) =>
          e.mint === e2.mint &&
          e.issuer === e2.issuer &&
          e.recipient_token_account === e2.recipient_token_account &&
          Math.abs(
            new Date(e.state_changed_at ?? 0).getTime() -
              new Date(e2.state_changed_at ?? 0).getTime()
          ) <=
            thresholdSeconds * 1000 // 10 seconds
      )
        ? [...acc, e]
        : acc,
    [] as IndexedClaimEvent[]
  )
}

const PAGE_SIZE = 10

export const useClaimEventsForConfig = (
  disabled?: boolean,
  user?: PublicKey
) => {
  const { config } = useProjectConfig()
  const { environment } = useEnvironmentCtx()
  return useInfiniteQuery<IndexedClaimEvent[]>(
    [ACTIVITY_KEY, 'useClaimEventsForConfig', config.name, user?.toString()],
    async ({ pageParam }) => {
      /////
      const indexer = new ApolloClient({
        uri: environment.index,
        cache: new InMemoryCache({ resultCaching: false }),
      })
      if (
        !(
          (environment.index && config.filter?.type === 'creators') ||
          (config.filter?.type === 'issuer' && !config.indexDisabled) ||
          user
        )
      ) {
        return []
      }

      const trace = tracer({
        name: `[useClaimEventsForConfig] ${config.name}`,
      })
      const tokenManagerResponse =
        config.filter?.type === 'creators'
          ? await indexer.query({
              query: gql`
                query GetActivity(
                  $limit: Int!
                  $offset: Int!
                  $creators: [String!]!
                  ${user ? '$issuer: String!' : ''}
                ) {
                  claim_events(
                    limit: $limit
                    offset: $offset
                    order_by: { state_changed_at: desc }
                    where: {
                      mint_address_nfts: {
                        metadatas_metadata_creators: {
                          _and: {
                            creator_address: { _in: $creators }
                            _and: { verified: { _eq: true } }
                          }
                        }
                      }
                      ${user ? 'issuer: {_eq: $issuer}' : ''}
                      ${
                        config.showUnknownInvalidators
                          ? ''
                          : `time_invalidator_address: {_is_null: false}`
                      }
                    }
                  ) {
                    token_manager_address
                    mint
                    state
                    state_changed_at
                    issuer
                    claim_approver
                    recipient_token_account
                    paid_claim_approver_payment_mint
                    paid_claim_approver_payment_amount
                    time_invalidator_address
                    time_invalidator_duration_seconds
                    time_invalidator_extension_duration_seconds
                    time_invalidator_extension_payment_amount
                    time_invalidator_extension_payment_mint
                    time_invalidator_max_expiration
                    time_invalidator_expiration
                    mint_address_nfts {
                      name
                      uri
                      metadata_json {
                        image
                      }
                    }
                  }
                }
              `,
              variables: {
                creators: config.filter.value,
                limit: PAGE_SIZE,
                offset: pageParam * PAGE_SIZE,
                issuer: user,
              },
            })
          : await indexer.query({
              query: gql`
                query GetActivity(
                  $limit: Int!
                  $offset: Int!
                  $issuers: [String!]!
                ) {
                  claim_events(
                    limit: $limit
                    offset: $offset
                    where: { 
                      issuer: { _in: $issuers }
                      ${
                        config.showUnknownInvalidators
                          ? ''
                          : `time_invalidator_address: {_is_null: false}`
                      }
                    }
                    order_by: { state_changed_at: desc }
                  ) {
                    token_manager_address
                    mint
                    state
                    state_changed_at
                    issuer
                    claim_approver
                    recipient_token_account
                    paid_claim_approver_payment_mint
                    paid_claim_approver_payment_amount
                    time_invalidator_address
                    time_invalidator_duration_seconds
                    time_invalidator_extension_duration_seconds
                    time_invalidator_extension_payment_amount
                    time_invalidator_extension_payment_mint
                    time_invalidator_max_expiration
                    time_invalidator_expiration
                    mint_address_nfts {
                      name
                      uri
                      metadata_json {
                        image
                      }
                    }
                  }
                }
              `,
              variables: {
                issuers: config.filter?.value ?? user,
                limit: PAGE_SIZE,
                offset: pageParam * PAGE_SIZE,
              },
            })
      /////
      const indexedClaimEvents = tokenManagerResponse.data[
        'claim_events'
      ] as IndexedClaimEvent[]
      trace.finish()

      return dedupeClaimEvents(
        indexedClaimEvents.map((e) => ({
          ...e,
          state_changed_at: `${e.state_changed_at}Z`,
        }))
      )
    },
    {
      enabled: !disabled && !!config && !!environment.index,
      getNextPageParam: (_lastPage, pages) => pages.length,
    }
  )
}
