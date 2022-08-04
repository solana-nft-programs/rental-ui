import { tryPublicKey } from '@cardinal/common'
import type { AccountData } from '@cardinal/token-manager'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { Connection } from '@solana/web3.js'
import Claim from 'components/Claim'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

function ClaimHome(props: {
  isClaimed: boolean
  nftName: string
  nftImageUrl: string
}) {
  return <Claim {...props} />
}

export async function getServerSideProps(context: any) {
  const query = context.query
  const tokenManagerString = query.tokenManagerString
  const cluster = (query.project || query.host)?.includes('dev')
    ? 'devnet'
    : query.host?.includes('test')
    ? 'testnet'
    : query.cluster || process.env.BASE_CLUSTER || 'mainnet'
  console.log(process.env.BASE_CLUSTER)
  const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
  const environment = foundEnvironment ?? ENVIRONMENTS[0]!
  const connection = new Connection(environment.primary, {
    commitment: 'recent',
  })

  const tokenManagerId = tryPublicKey(tokenManagerString)
  if (!tokenManagerId) {
    return {}
  }
  const tokenManagerData = await tokenManager.accounts.getTokenManager(
    connection,
    tokenManagerId
  )

  const [metaplexId] = await metaplex.MetadataProgram.findMetadataAccount(
    tokenManagerData.parsed.mint
  )
  const metaplexDataRaw = await metaplex.Metadata.load(
    connection,
    metaplexId
  ).catch((e) => {
    console.log('Failed to get metaplex data', e)
    return null
  })
  const metaplexData = metaplexDataRaw
    ? {
        pubkey: metaplexDataRaw?.pubkey,
        parsed: metaplexDataRaw?.data,
      }
    : undefined

  let metadata: AccountData<any> | null = null
  if (metaplexData) {
    try {
      const json = await fetch(metaplexData.parsed.data.uri).then((r) =>
        r.json()
      )
      metadata = { pubkey: metaplexData.pubkey, parsed: json }
    } catch (e) {
      console.log('Failed to get metadata data', e)
    }
  }

  const isClaimed = tokenManagerData.parsed.state === TokenManagerState.Claimed
  const nftImageUrl = metadata?.parsed?.image as string
  const nftName = metadata?.parsed?.name as string

  return {
    props: {
      isClaimed,
      nftImageUrl,
      nftName,
    },
  }
}

export default ClaimHome
