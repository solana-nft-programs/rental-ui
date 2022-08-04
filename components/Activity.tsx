import { tryPublicKey } from '@cardinal/common'
import { DisplayAddress } from '@cardinal/namespaces-components'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { getRentalRateDisplayText } from 'common/NFTIssuerInfo'
import type { IndexedClaimEvent } from 'hooks/useClaimEventsForConfig'
import { useClaimEventsForConfig } from 'hooks/useClaimEventsForConfig'
import { useTransactionSignature } from 'hooks/useTransactionSignature'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'

export const Activity = () => {
  const { config } = useProjectConfig()
  const claimEvents = useClaimEventsForConfig()
  return (
    <div className="mx-auto mt-12 px-10">
      <div className="rounded-xl border border-border p-4">
        <div className="flex w-full rounded-xl bg-dark-4 px-8 py-2">
          <div className="flex-[1.5]">NFT</div>
          <div className="flex-1">Rate</div>
          <div className="flex-1">From</div>
          <div className="flex-1">To</div>
          <div className="flex-1">Transaction</div>
          <div className="flex-1">Date</div>
        </div>
        {!claimEvents.isFetched ? (
          <div className="flex flex-col gap-4 px-8 py-4">
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
            <div className="h-8 w-full animate-pulse rounded-lg bg-border"></div>
          </div>
        ) : claimEvents.data && claimEvents.data.length > 0 ? (
          <div className="flex flex-col px-8">
            {claimEvents.data.map((claimEvent) => {
              return (
                <ActivityRow
                  key={claimEvent.state_changed_at}
                  claimEvent={claimEvent}
                />
              )
            })}
          </div>
        ) : (
          <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
            <GlyphLargeClose />
            <div className="mt-4 text-medium-4">
              No transactions have been recorded for {config.displayName}
            </div>
          </div>
        )}
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
  const txSignature = useTransactionSignature(
    claimEvent.token_manager_address,
    claimEvent.state_changed_at,
    lookupTx
  )

  return (
    <div
      className="flex w-full border-b border-border py-4"
      key={`${claimEvent.token_manager_address}-${claimEvent.state_changed_at}`}
    >
      <div className="flex-[1.5]">
        <div className="flex flex-row gap-5">
          <img
            loading="lazy"
            src={claimEvent.mint_address_nfts?.metadata_json?.image}
            alt="nft-pic"
            className={`h-[50px] rounded-xl object-contain`}
          />
          <div className="my-auto">{claimEvent.mint_address_nfts?.name}</div>
        </div>
      </div>
      <div className="my-auto flex-1">
        {getRentalRateDisplayText(config, {})}
      </div>
      <div className="my-auto flex-1">
        <DisplayAddress
          dark
          address={tryPublicKey(claimEvent.issuer) ?? undefined}
          connection={secondaryConnection}
        />
      </div>
      <div className="my-auto flex-1">
        <DisplayAddress
          dark
          address={
            tryPublicKey(claimEvent.recipient_token_account) ?? undefined
          }
          connection={secondaryConnection}
        />
      </div>
      <div className="my-auto flex-1">
        {txSignature.data ? (
          <span>{formatShortSignature(txSignature.data)}</span>
        ) : (
          <div
            className={`w-32 cursor-pointer rounded-lg border-[1px] border-border bg-dark-4 p-1 text-center`}
            onClick={async () => {
              if (
                claimEvent.token_manager_address &&
                claimEvent.state_changed_at
              ) {
                setLookupTx(true)
              }
            }}
          >
            {txSignature.isLoading ? (
              <div className="h-6 animate-pulse rounded-md bg-border" />
            ) : (
              'View Transaction'
            )}
          </div>
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
