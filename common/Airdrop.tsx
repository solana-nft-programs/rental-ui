import React from 'react'
import { useState } from 'react'
import { AsyncButton, Button } from 'rental-components/common/Button'
import { airdropNFT } from 'api/utils'
import { asWallet } from 'common/Wallets'
import { notify } from 'common/Notification'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export const Airdrop = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const { refreshTokenAccounts } = useUserTokenData()
  const [loadingAirdrop, setLoadingAirdrop] = useState(false)
  const { config } = useProjectConfig()

  return (
    <AsyncButton
      bgColor={config.colors.secondary}
      variant="primary"
      disabled={!wallet.connected}
      handleClick={async () => {
        if (!wallet.connected) return
        try {
          setLoadingAirdrop(true)
          const txid = await airdropNFT(connection, asWallet(wallet))
          notify({ message: 'Airdrop successful', txid })
          refreshTokenAccounts()
        } catch (e) {
          console.log(e)
          notify({ message: 'Airdrop failed', type: 'error' })
        } finally {
          setLoadingAirdrop(false)
        }
      }}
    >
      Airdrop
    </AsyncButton>
  )
}
