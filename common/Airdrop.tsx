import {
  createMintTx,
  findMintEditionId,
  findMintMetadataId,
} from '@cardinal/common'
import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV3Instruction,
} from '@metaplex-foundation/mpl-token-metadata'
import { BN } from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import { SignerWallet } from '@saberhq/solana-contrib'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Connection } from '@solana/web3.js'
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { notify } from 'common/Notification'
import { asWallet } from 'common/Wallets'
import type { ProjectConfig } from 'config/config'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { ButtonSmall } from './ButtonSmall'
import { executeTransaction } from './Transactions'

export type AirdropMetadata = { name: string; symbol: string; uri: string }

export async function airdropNFT(
  connection: Connection,
  wallet: Wallet,
  config: ProjectConfig
): Promise<string> {
  const airdropMetadatas = config.airdrops || []
  const randInt = Math.round(Math.random() * (airdropMetadatas.length - 1))
  const metadata: AirdropMetadata | undefined = airdropMetadatas[randInt]
  if (!metadata) throw new Error('No configured airdrops found')
  const tokenCreator = Keypair.generate()
  const fromAirdropSignature = await connection.requestAirdrop(
    tokenCreator.publicKey,
    LAMPORTS_PER_SOL
  )
  await connection.confirmTransaction(fromAirdropSignature)

  const mintKeypair = Keypair.generate()
  const [transaction] = await createMintTx(
    connection,
    mintKeypair.publicKey,
    wallet.publicKey
  )
  const mintMetadataId = findMintMetadataId(mintKeypair.publicKey)
  const metadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: mintMetadataId,
      updateAuthority: wallet.publicKey,
      mint: mintKeypair.publicKey,
      mintAuthority: wallet.publicKey,
      payer: wallet.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          sellerFeeBasisPoints: 10,
          collection: null,
          uses: null,
          creators:
            config.filter?.value && config.filter?.type === 'creators'
              ? config.filter.value
                  .map((c) => ({
                    address: new PublicKey(c),
                    verified: false,
                    share: Math.floor(
                      (1 /
                        ((config.filter ?? { value: [] }).value.length + 1)) *
                        100
                    ),
                  }))
                  .concat({
                    address: wallet.publicKey,
                    verified: true,
                    share: Math.floor(
                      (1 / (config.filter.value.length + 1)) * 100
                    ),
                  })
              : null,
        },
        collectionDetails: null,
        isMutable: true,
      },
    }
  )

  const mintEditionId = findMintEditionId(mintKeypair.publicKey)
  const masterEditionIX = createCreateMasterEditionV3Instruction(
    {
      edition: mintEditionId,
      mint: mintKeypair.publicKey,
      updateAuthority: wallet.publicKey,
      mintAuthority: wallet.publicKey,
      payer: wallet.publicKey,
      metadata: mintMetadataId,
    },
    {
      createMasterEditionArgs: {
        maxSupply: new BN(0),
      },
    }
  )
  transaction.instructions = [metadataIx, masterEditionIX]
  return executeTransaction(
    connection,
    new SignerWallet(tokenCreator),
    transaction,
    {
      confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
      notificationConfig: { message: 'Airdrop succesful' },
    }
  )
}

export const Airdrop = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const userTokenData = useUserTokenData()
  const { config } = useProjectConfig()

  return (
    <ButtonSmall
      disabled={!wallet.connected}
      onClick={async () => {
        if (!wallet.connected) return
        try {
          await airdropNFT(connection, asWallet(wallet), config)
          await userTokenData.refetch()
        } catch (e) {
          notify({ message: `Airdrop failed: ${e}`, type: 'error' })
        }
      }}
    >
      Airdrop
    </ButtonSmall>
  )
}

export const AirdropSol = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const userTokenData = useUserTokenData()
  return (
    <ButtonSmall
      disabled={!wallet.connected}
      onClick={async () => {
        if (!wallet.publicKey) return
        try {
          await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
          notify({ message: 'Airdropped 1 sol successfully' })
          await userTokenData.refetch()
        } catch (e) {
          notify({ message: `Airdrop failed: ${e}`, type: 'error' })
        }
      }}
    >
      Faucet
    </ButtonSmall>
  )
}
