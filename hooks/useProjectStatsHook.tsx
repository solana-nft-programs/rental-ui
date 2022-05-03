import { gql } from '@apollo/client'
import { BN } from '@project-serum/anchor'
import { fmtMintAmount } from 'common/units'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { usePaymentMints } from 'providers/PaymentMintsProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useDataHook } from './useDataHook'

export type ProjectStats = {
  totalRentalCount?: number
  totalRentalVolume?: number
  totalRentalDuration?: number
}

export type ClaimEvent = {
  state_changed_at: string
  issuer: string
  mint: string
  time_invalidator_duration_seconds: number
  time_invalidator_expiration: string
  time_invalidator_extension_payment_mint: string
  time_invalidator_extension_payment_amount: number
  time_invalidator_extension_duration_seconds: number
  token_manager_address: string
  paid_claim_approver_payment_amount: number
  paid_claim_approver_payment_mint: string
}

export const useProjectStats = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { paymentMintInfos } = usePaymentMints()

  return useDataHook<ProjectStats | undefined>(
    async () => {
      if (
        environment.index &&
        config.rentalCard &&
        config.rentalCard.paymentManager
      ) {
        const collectionClaimEvents = await environment.index.query({
          query: gql`
            query GetCardinalClaimEvents($payment_manager: String!) {
              cardinal_claim_events(
                where: {
                  time_invalidator_payment_manager: { _eq: $payment_manager }
                }
              ) {
                state_changed_at
                issuer
                mint
                time_invalidator_duration_seconds
                time_invalidator_expiration
                time_invalidator_extension_payment_mint
                time_invalidator_extension_payment_amount
                time_invalidator_extension_duration_seconds
                token_manager_address
                paid_claim_approver_payment_amount
                paid_claim_approver_payment_mint
              }
            }
          `,
          variables: {
            payment_manager: config.rentalCard.paymentManager,
          },
        })
        const claimEvents = collectionClaimEvents.data['cardinal_claim_events']

        if (claimEvents.length === 0) {
          return {}
        }

        const getTotalRentalVolume = () => {
          return claimEvents
            .map((claimEvent: ClaimEvent) => {
              claimEvent.time_invalidator_duration_seconds === 0
                ? (claimEvent.time_invalidator_extension_payment_amount *
                    ((new Date(
                      claimEvent.time_invalidator_expiration
                    ).getTime() -
                      new Date(claimEvent.state_changed_at).getTime()) /
                      1000)) /
                  claimEvent.time_invalidator_extension_duration_seconds
                : fmtMintAmount(
                    paymentMintInfos[
                      claimEvent.paid_claim_approver_payment_mint
                    ],
                    new BN(claimEvent.paid_claim_approver_payment_amount)
                  )
            })
            .reduce((prev: number, curr: number) => prev + curr, 0)
        }

        const getTotalRentalDuration = () => {
          return claimEvents
            .map(
              (claimEvent: ClaimEvent) =>
                (new Date(claimEvent.time_invalidator_expiration).getTime() -
                  new Date(claimEvent.state_changed_at).getTime()) /
                1000
            )
            .reduce((prev: number, curr: number) => prev + curr, 0)
        }

        const stats = {
          totalRentalCount: claimEvents.length,
          totalRentalVolume: getTotalRentalVolume(),
          totalRentalDuration: getTotalRentalDuration(),
        }
        return stats
      } else {
        return {}
      }
    },
    [environment.index, config.paymentManager],
    { name: 'useProjectStats', refreshInterval: 10000 }
  )
}
