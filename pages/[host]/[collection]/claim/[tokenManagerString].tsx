import { tryPublicKey } from '@cardinal/common'
import { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { getTokenData } from 'api/api'
import * as canvas from 'canvas'
import Claim from 'components/Claim'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

function ClaimHome(props: any) {
  return <Claim {...props} />
}

const generateImage = async (tokenData: TokenData) => {
  // setup
  // overlay text
  const WIDTH = 1200
  const HEIGHT = 675
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT)

  // draw base image
  const baseImgUri = 'http://localhost:3000/assets/twitter-claim.png'
  const nftImageUri = tokenData.metadata?.data?.image

  const backgroundCtx = imageCanvas.getContext('2d')
  backgroundCtx.fillStyle = 'rgba(26, 27, 32, 1)'
  backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT)

  const img = await canvas.loadImage(baseImgUri)
  const imgContext = imageCanvas.getContext('2d')
  if (img.height > img.width) {
    const imgHeightMultiplier = WIDTH / img.height
    imgContext.drawImage(
      img,
      (WIDTH - img.width * imgHeightMultiplier) / 2,
      0,
      img.width * imgHeightMultiplier,
      HEIGHT
    )
  } else {
    const imgWidthMultiplier = HEIGHT / img.width
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
    console.log(0, 0, WIDTH, HEIGHT)
  }

  const nftWidth = 290
  const nftHeight = 290

  const nftImage = await canvas.loadImage(nftImageUri)
  const nftImageContext = imageCanvas.getContext('2d')
  nftImageContext.fillRect(660, 214, nftWidth, nftHeight)
  if (nftImage.height > nftImage.width) {
    nftImageContext.drawImage(nftImage, 660, 214, 290, 290)
  } else {
    nftImageContext.drawImage(nftImage, 660, 214, 290, 290)
  }

  return imageCanvas.toBuffer('image/png')
}

export async function getServerSideProps(context: any) {
  const query = context.query
  const tokenManagerString = query.tokenManagerString
  const cluster = (query.project || query.host)?.includes('dev')
    ? 'devnet'
    : query.host?.includes('test')
    ? 'testnet'
    : query.cluster || process.env.BASE_CLUSTER
  const foundEnvironment = ENVIRONMENTS.find((e) => e.label === cluster)
  const environment = foundEnvironment ?? ENVIRONMENTS[0]!
  const connection = new Connection(environment.primary, {
    commitment: 'recent',
  })

  const tokenManagerId = tryPublicKey(tokenManagerString)
  if (!tokenManagerId) {
    return {}
  }

  const tokenData = await getTokenData(connection, tokenManagerString)
  const imageData = await generateImage(tokenData)

  return {
    props: {
      tokenData: JSON.stringify(tokenData),
      imageData: imageData.toString('base64'),
    },
  }
}

export default ClaimHome
