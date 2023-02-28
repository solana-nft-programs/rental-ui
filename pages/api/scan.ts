import type { AccountData } from '@cardinal/common'
import {
  findMintEditionId,
  findMintMetadataId,
  firstParam,
  getBatchedMultipleAccounts,
  tryPublicKey,
} from '@cardinal/common'
import { CRANK_KEY } from '@cardinal/payment-manager'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { timeInvalidatorProgram } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { useInvalidatorProgram } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { BN, utils } from '@project-serum/anchor'
import * as splToken from '@solana/spl-token'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import type { TokenFilter } from 'config/config'
import { projectConfigs } from 'config/config'
import type { NextApiHandler } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'
import { fetchAccountDataById } from 'providers/SolanaAccountsProvider'

export type ScanTokenData = {
  tokenAccount?: AccountData<splToken.Account>
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: AccountData<metaplex.Metadata>
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
}

export async function getScanTokenAccounts(
  connection: Connection,
  addressId: string,
  filter?: TokenFilter,
  cluster?: string
): Promise<ScanTokenData[]> {
  const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(addressId),
    { programId: splToken.TOKEN_PROGRAM_ID }
  )
  let tokenAccounts = allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

  // lookup metaplex data
  const metaplexIds = tokenAccounts.map((tokenAccount) =>
    findMintMetadataId(
      new PublicKey(tokenAccount.account.data.parsed.info.mint)
    )
  )
  // const metaplexMetadatas = await accountDataById(connection, metaplexIds)
  // TODO use accountDataById?
  const metaplexAccountInfos = await getBatchedMultipleAccounts(
    connection,
    metaplexIds
  )
  const metaplexData = metaplexAccountInfos.reduce((acc, accountInfo, i) => {
    try {
      if (accountInfo?.data) {
        acc[tokenAccounts[i]!.pubkey.toString()] = {
          pubkey: metaplexIds[i]!,
          ...accountInfo,
          parsed: metaplex.Metadata.deserialize(accountInfo?.data as Buffer)[0],
        }
      }
    } catch (e) {}
    return acc
  }, {} as { [tokenAccountId: string]: { pubkey: PublicKey; parsed: metaplex.Metadata } })

  // filter by creators
  if (filter?.type === 'creators') {
    tokenAccounts = tokenAccounts.filter((tokenAccount) =>
      metaplexData[
        tokenAccount.pubkey.toString()
      ]?.parsed?.data?.creators?.some(
        (creator) =>
          filter.value.includes(creator.address.toString()) &&
          (cluster === 'devnet' || creator.verified)
      )
    )
  }

  // lookup delegates and
  const delegateIds = tokenAccounts.map((tokenAccount) =>
    tryPublicKey(tokenAccount.account.data.parsed.info.delegate)
  )
  const tokenAccountDelegateData = await fetchAccountDataById(
    connection,
    delegateIds
  )
  const editionIds = tokenAccounts.map((tokenAccount) =>
    findMintEditionId(tokenAccount.account.data.parsed.info.mint)
  )
  const idsToFetch = Object.values(tokenAccountDelegateData).reduce(
    (acc, accountData) => [
      ...acc,
      ...(accountData.type === 'tokenManager'
        ? [
            (accountData as AccountData<TokenManagerData>).parsed.claimApprover,
            (accountData as AccountData<TokenManagerData>).parsed
              .recipientTokenAccount,
            ...(accountData as AccountData<TokenManagerData>).parsed
              .invalidators,
          ]
        : []),
    ],
    [...editionIds] as (PublicKey | null)[]
  )

  const accountsById = {
    ...tokenAccountDelegateData,
    ...(await fetchAccountDataById(connection, idsToFetch)),
  }

  return tokenAccounts.reduce((acc, tokenAccount) => {
    const delegateData =
      accountsById[tokenAccount.account.data.parsed.info.delegate]

    let tokenManagerData: AccountData<TokenManagerData> | undefined
    let claimApproverId: PublicKey | undefined
    let timeInvalidatorId: PublicKey | undefined
    let useInvalidatorId: PublicKey | undefined
    if (delegateData?.type === 'tokenManager') {
      tokenManagerData = delegateData as AccountData<TokenManagerData>
      claimApproverId = tokenManagerData.parsed.claimApprover ?? undefined
      timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
        (invalidator) =>
          accountsById[invalidator.toString()]?.type === 'timeInvalidator'
      )[0]
      useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
        (invalidator) =>
          accountsById[invalidator.toString()]?.type === 'useInvalidator'
      )[0]
    }
    if (
      filter?.type === 'issuer' &&
      !filter.value.includes(tokenManagerData?.parsed?.issuer?.toString() ?? '')
    ) {
      return acc
    }
    return [
      ...acc,
      {
        tokenAccount: {
          pubkey: tokenAccount.pubkey,
          parsed: tokenAccount.account.data.parsed,
        },
        metaplexData: metaplexData[tokenAccount.pubkey.toString()],
        tokenManager: tokenManagerData,
        claimApprover: claimApproverId
          ? (accountsById[
              claimApproverId.toString()
            ] as AccountData<PaidClaimApproverData>)
          : undefined,
        useInvalidator: useInvalidatorId
          ? (accountsById[
              useInvalidatorId.toString()
            ] as AccountData<UseInvalidatorData>)
          : undefined,
        timeInvalidator: timeInvalidatorId
          ? (accountsById[
              timeInvalidatorId.toString()
            ] as AccountData<TimeInvalidatorData>)
          : undefined,
      },
    ]
  }, [] as ScanTokenData[])
}
interface GetResponse {
  label: string
  icon: string
}

const get: NextApiHandler<GetResponse> = async (req, res) => {
  const { collection: collectionParam } = req.query
  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  const icon = config.logoImage.includes('http')
    ? config.logoImage
    : `https://${req.headers.host}${config.logoImage}`
  res.status(200).send({
    label: config.displayName || config.name || 'Unknown project',
    icon,
  })
}

interface PostResponse {
  transaction?: string
  message?: string
  error?: string
}

const post: NextApiHandler<PostResponse> = async (req, res) => {
  const {
    cluster: clusterParam,
    collection: collectionParam,
    keypair: keypairParam,
  } = req.query
  const { account } = req.body
  const foundEnvironment = ENVIRONMENTS.find(
    (e) => e.label === (firstParam(clusterParam) || 'mainnet')
  )
  if (!foundEnvironment)
    return res.status(400).json({ error: 'Invalid cluster' })

  const keypair = Keypair.fromSecretKey(
    utils.bytes.bs58.decode(firstParam(keypairParam))
  )
  const accountId = tryPublicKey(account)
  if (!accountId) return res.status(400).json({ error: 'Invalid account' })

  const connection = new Connection(foundEnvironment!.primary)
  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  let tokenDatas: ScanTokenData[] = []
  try {
    tokenDatas = await getScanTokenAccounts(
      connection,
      accountId.toString(),
      config.filter,
      foundEnvironment.label
    )
  } catch (e) {
    console.log('Failed to get toke accounts: ', e)
    return res.status(500).json({ error: 'Failed to get token accounts' })
  }

  const foundToken =
    tokenDatas.find((tk) => !tk.timeInvalidator && !tk.useInvalidator) ||
    tokenDatas.find((tk) => tk.timeInvalidator) ||
    tokenDatas.find((tk) => tk.useInvalidator)

  if (!foundToken) {
    return res.status(404).json({
      error: `No valid tokens found in wallet for config ${config.name}`,
    })
  }

  let transaction = new Transaction()
  if (!foundToken.timeInvalidator && !foundToken.useInvalidator) {
    const instruction = new TransactionInstruction({
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      keys: [],
      data: Buffer.from('', 'utf8'),
    })
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  } else if (foundToken.tokenManager && foundToken.timeInvalidator) {
    const instruction = await timeInvalidatorProgram(connection)
      .methods.close()
      .accountsStrict({
        tokenManager: foundToken.tokenManager.pubkey,
        collector: CRANK_KEY,
        timeInvalidator: foundToken.timeInvalidator.pubkey,
        closer: accountId,
      })
      .instruction()
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  } else if (foundToken.tokenManager && foundToken.useInvalidator) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const instruction = await useInvalidatorProgram(connection)
      .methods.incrementUsages(new BN(1))
      .accountsStrict({
        tokenManager: foundToken.tokenManager.pubkey,
        recipientTokenAccount:
          foundToken.tokenManager.parsed.recipientTokenAccount,
        useInvalidator: foundToken.useInvalidator.pubkey,
        user: accountId,
      })
      .instruction()
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  }

  transaction.feePayer = accountId
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash
  transaction = Transaction.from(
    transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    })
  )
  // Serialize and return the unsigned transaction.
  const serialized = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  })
  const base64 = serialized.toString('base64')
  res.status(200).send({
    transaction: base64,
    message: `Verifying ownership of a ${config.name} NFT`,
  })
}

const index: NextApiHandler<GetResponse | PostResponse> = async (
  request,
  response
) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', '*')
  response.setHeader('Access-Control-Allow-Headers', '*')
  response.setHeader('Access-Control-Allow-Credentials', 'true')
  if (request.method === 'OPTIONS') {
    return response.status(200).json({})
  }
  if (request.method === 'GET') return get(request, response)
  if (request.method === 'POST') return post(request, response)
  throw new Error(`Unexpected method ${request.method}`)
}

export default index
