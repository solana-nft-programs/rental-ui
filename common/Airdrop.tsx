import { createMint } from '@cardinal/common'
import {
  CreateMasterEditionV3,
  CreateMetadataV2,
  DataV2,
  MasterEdition,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { BN } from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import { SignerWallet } from '@saberhq/solana-contrib'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Connection } from '@solana/web3.js'
import { Keypair, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js'
import { notify } from 'common/Notification'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { AsyncButton } from 'rental-components/common/Button'

import { executeTransaction } from './Transactions'

export type AirdropMetadata = { name: string; symbol: string; uri: string }

export async function airdropNFT(
  connection: Connection,
  wallet: Wallet,
  airdropMetadatas: AirdropMetadata[]
): Promise<string> {
  const randInt = Math.round(Math.random() * (airdropMetadatas.length - 1))
  const metadata: AirdropMetadata | undefined = airdropMetadatas[randInt]
  if (!metadata) throw new Error('No configured airdrops found')
  const tokenCreator = Keypair.generate()
  const fromAirdropSignature = await connection.requestAirdrop(
    tokenCreator.publicKey,
    LAMPORTS_PER_SOL
  )
  await connection.confirmTransaction(fromAirdropSignature)

  const [_masterEditionTokenAccountId, masterEditionMint] = await createMint(
    connection,
    tokenCreator,
    wallet.publicKey,
    1,
    tokenCreator.publicKey
  )

  const masterEditionMetadataId = await Metadata.getPDA(
    masterEditionMint.publicKey
  )
  const metadataTx = new CreateMetadataV2(
    { feePayer: tokenCreator.publicKey },
    {
      metadata: masterEditionMetadataId,
      metadataData: new DataV2({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: 10,
        creators: null,
        collection: null,
        uses: null,
      }),
      updateAuthority: tokenCreator.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: tokenCreator.publicKey,
    }
  )

  const masterEditionId = await MasterEdition.getPDA(
    masterEditionMint.publicKey
  )
  const masterEditionTx = new CreateMasterEditionV3(
    {
      feePayer: tokenCreator.publicKey,
      recentBlockhash: (await connection.getRecentBlockhash('max')).blockhash,
    },
    {
      edition: masterEditionId,
      metadata: masterEditionMetadataId,
      updateAuthority: tokenCreator.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: tokenCreator.publicKey,
      maxSupply: new BN(1),
    }
  )
  const transaction = new Transaction()
  transaction.instructions = [
    ...metadataTx.instructions,
    ...masterEditionTx.instructions,
  ]

  const txid = await executeTransaction(
    connection,
    new SignerWallet(tokenCreator),
    transaction,
    {
      confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
      notificationConfig: { message: 'Airdrop succesful' },
    }
  )
  console.log(
    `Master edition (${masterEditionId.toString()}) created with metadata (${masterEditionMetadataId.toString()})`
  )
  return txid
}

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
          await airdropNFT(connection, asWallet(wallet), config.airdrops || [])
          await refreshTokenAccounts()
        } catch (e) {
          notify({ message: `Airdrop failed: ${e}`, type: 'error' })
        }
      }}
    >
      Airdrop
    </AsyncButton>
  )
}
