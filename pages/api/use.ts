import { scan } from '@cardinal/scanner/dist/cjs/programs/cardinalScanner'
import { close } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/instruction'
import { incrementUsages } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/instruction'
import { utils } from '@project-serum/anchor'
import { Connection, Keypair, Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { getTokenAccountsWithData } from 'api/api'
import { tryPublicKey } from 'api/utils'
import { firstParam } from 'common/utils'
import { projectConfigs } from 'config/config'
import type { NextApiHandler } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

interface GetResponse {
  label: string
  icon: string
}

const get: NextApiHandler<GetResponse> = async (req, res) => {
  const { label: labelParam, collection: collectionParam } = req.query

  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  const icon = config.logoImage.includes('http')
    ? config.logoImage
    : `https://${req.headers.host}${config.logoImage}`
  res.status(200).send({
    label: firstParam(labelParam) || 'Unknown label',
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

  const connection = new Connection(foundEnvironment!.value)
  const config =
    projectConfigs[firstParam(collectionParam)] || projectConfigs['default']!

  let tokenDatas: TokenData[] = []
  try {
    tokenDatas = await getTokenAccountsWithData(
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
    const instruction = scan(
      connection,
      {
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
        publicKey: accountId,
      },
      accountId
    )
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  } else if (foundToken.timeInvalidator) {
    const instruction = close(
      connection,
      {
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
        publicKey: accountId,
      },
      foundToken.timeInvalidator!.pubkey,
      foundToken.tokenManager!.pubkey
    )
    transaction.instructions = [
      {
        ...instruction,
        keys: [
          ...instruction.keys,
          { pubkey: keypair.publicKey, isSigner: false, isWritable: false },
        ],
      },
    ]
  } else if (foundToken.useInvalidator) {
    const instruction = await incrementUsages(
      connection,
      {
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
        publicKey: accountId,
      },
      foundToken.tokenManager!.pubkey,
      foundToken.tokenAccount!.pubkey,
      1
    )
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
