import React from 'react'
import { useState } from 'react'
import { Button } from 'rental-components/common/Button'
import { airdropNFT } from 'api/utils'
import { asWallet } from 'common/Wallets'
import { notify } from 'common/Notification'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

export const Airdrop = () => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const [loadingAirdrop, setLoadingAirdrop] = useState(false)

  return (
    <Button
      variant="primary"
      disabled={!wallet.connected}
      onClick={async () => {
        if (!wallet.connected) return
        try {
          setLoadingAirdrop(true)
          const txid = await airdropNFT(ctx.connection, asWallet(wallet))
          notify({ message: 'Airdrop successful', txid })
        } catch (e) {
          console.log(e)
          notify({ message: 'Airdrop failed', type: 'error' })
        } finally {
          setLoadingAirdrop(false)
        }
      }}
    >
      {loadingAirdrop ? <LoadingSpinner height="25px" /> : 'Airdrop'}
    </Button>
  )
}
