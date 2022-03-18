import { useWallet } from '@solana/wallet-adapter-react'
import { airdropNFT } from 'api/utils'
import { notify } from 'common/Notification'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { AsyncButton } from 'rental-components/common/Button'

export const Airdrop = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const { refreshTokenAccounts } = useUserTokenData()
  const { config } = useProjectConfig()

  return (
    <AsyncButton
      bgColor={config.colors.secondary}
      variant="primary"
      disabled={!wallet.connected}
      handleClick={async () => {
        if (!wallet.connected) return
        try {
          const txid = await airdropNFT(connection, asWallet(wallet))
          notify({ message: 'Airdrop successful', txid })
          refreshTokenAccounts()
        } catch (e) {
          console.log(e)
          notify({ message: 'Airdrop failed', type: 'error' })
        }
      }}
    >
      Airdrop
    </AsyncButton>
  )
}
