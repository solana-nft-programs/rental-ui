import { shortPubKey, tryPublicKey } from '@cardinal/common'
import { DisplayAddress } from '@cardinal/namespaces-components'
import type { PublicKey } from '@solana/web3.js'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { ButtonSmall } from 'common/ButtonSmall'
import { getRentalRateDisplayText } from 'common/NFTIssuerInfo'
import { Tooltip } from 'common/Tooltip'
import type { IndexedClaimEvent } from 'hooks/useClaimEventsForConfig'
import {
  claimApproverFromIndexedClaimEvent,
  timeInvalidatorFromIndexedClaimEvent,
  useClaimEventsForConfig,
} from 'hooks/useClaimEventsForConfig'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useTokenAccountInfo } from 'hooks/useTokenAccountInfo'
import { useTxidForEvent } from 'hooks/useTxidForEvent'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'

export const Activity = ({ user }: { user?: PublicKey }) => {
  const { config } = useProjectConfig()
  const claimEvents = useClaimEventsForConfig(false, user)
  return (
    <div className="mx-auto mt-12 px-10">
      <div className="w-full overflow-x-scroll rounded-xl border border-border p-4">
        <div className="flex w-full min-w-fit flex-col">
          <div className="flex w-full gap-4 rounded-xl bg-dark-4 px-8 py-2">
            <div className="flex-[1.5]">NFT</div>
            <div className="flex-1">Rate</div>
            <div className="flex-1">From</div>
            <div className="flex-1">To</div>
            <div className="flex-1">Transaction</div>
            <div className="flex-1">Date</div>
          </div>
          {!claimEvents.isFetched ? (
            <div className="flex flex-col gap-6 px-8 py-4">
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
              <div className="h-14 w-full animate-pulse rounded-lg bg-border"></div>
            </div>
          ) : claimEvents.data && claimEvents.data.pages.flat().length > 0 ? (
            <div className="flex flex-col px-8">
              {claimEvents.data.pages.flat().map((claimEvent) => {
                return (
                  <ActivityRow
                    key={claimEvent.state_changed_at}
                    claimEvent={claimEvent}
                  />
                )
              })}
              <div className="mt-4">
                <ButtonSmall
                  loading={claimEvents.isFetchingNextPage}
                  onClick={() => claimEvents.fetchNextPage()}
                >
                  Load more
                </ButtonSmall>
              </div>
            </div>
          ) : (
            <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
              <GlyphLargeClose />
              <div className="mt-4 text-medium-4">
                No transactions have been recorded for{' '}
                {user ? shortPubKey(user) : config.displayName}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ActivityRow = ({
  claimEvent,
}: {
  claimEvent: IndexedClaimEvent
}) => {
  const { config } = useProjectConfig()
  const { secondaryConnection } = useEnvironmentCtx()
  const [lookupTx, setLookupTx] = useState(false)
  const txSignature = useTxidForEvent(
    claimEvent.token_manager_address,
    claimEvent.state_changed_at,
    lookupTx
  )
  const paymentMints = usePaymentMints()

  return (
    <div
      className="flex w-full gap-4 border-b border-border py-4 md:flex-row"
      key={`${claimEvent.token_manager_address}-${claimEvent.state_changed_at}`}
    >
      <div className="min-w-fit flex-[1.5]">
        <div className="flex items-center gap-5 md:flex-row">
          <img
            loading="lazy"
            src={claimEvent.mint_address_nfts?.metadata_json?.image}
            alt="nft-pic"
            className={`h-[50px] rounded-xl`}
          />
          <div className="min-w-[100px]">
            {claimEvent.mint_address_nfts?.name}
          </div>
        </div>
      </div>
      <div className="my-auto min-w-[100px] flex-1">
        {getRentalRateDisplayText(
          config,
          {
            timeInvalidator: timeInvalidatorFromIndexedClaimEvent(claimEvent),
            claimApprover: claimApproverFromIndexedClaimEvent(claimEvent),
          },
          paymentMints.data
        )}
      </div>
      <div className="my-auto flex-1">
        <DisplayAddress
          dark
          address={tryPublicKey(claimEvent.issuer) ?? undefined}
          connection={secondaryConnection}
        />
      </div>
      <div className="my-auto flex-1">
        <ActivityRecipient
          recipientTokenAccount={claimEvent.recipient_token_account}
        />
      </div>
      <div className="my-auto flex-1">
        {txSignature.isLoading ? (
          <div className="h-6 w-32 animate-pulse rounded-md bg-border" />
        ) : txSignature.data ? (
          <span>{formatShortSignature(txSignature.data)}</span>
        ) : !txSignature.isFetched ? (
          <div
            className={`w-32 cursor-pointer rounded-lg border-[1px] border-border bg-dark-4 p-1 text-center transition-colors hover:bg-border`}
            onClick={async () => {
              if (
                claimEvent.token_manager_address &&
                claimEvent.state_changed_at
              ) {
                setLookupTx(true)
              }
            }}
          >
            View Transaction
          </div>
        ) : (
          <div>Not found</div>
        )}
      </div>
      <div className="my-auto flex-1">
        {new Date(claimEvent.state_changed_at ?? '').toLocaleString('en-US', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  )
}

export const ActivityRecipient = ({
  recipientTokenAccount,
}: {
  recipientTokenAccount?: string
}) => {
  const { secondaryConnection } = useEnvironmentCtx()
  const tokenAccount = useTokenAccountInfo(
    tryPublicKey(recipientTokenAccount) ?? undefined
  )
  const notFound = tokenAccount.isFetched && !tokenAccount.data?.parsed?.owner
  return (
    <Tooltip
      title={
        !!notFound
          ? 'Owner not found, showing their token account address here'
          : ''
      }
    >
      <div className="flex">
        <DisplayAddress
          dark
          address={
            tryPublicKey(
              tokenAccount.isFetched
                ? tokenAccount.data?.parsed?.owner ?? recipientTokenAccount
                : undefined
            ) ?? undefined
          }
          connection={secondaryConnection}
        />
        {notFound && <>*</>}
      </div>
    </Tooltip>
  )
}

export const formatShortSignature = (tx: string | undefined) => {
  if (!tx) return <></>
  return (
    <a
      href={`https://explorer.solana.com/tx/${tx}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {shortenAddress(tx.toString())}
    </a>
  )
}

export function shortenAddress(address: string, chars = 5): string {
  return `${address.substring(0, chars)}...${address.substring(
    address.length - chars
  )}`
}
