import * as canvas from 'canvas'
import type { NextApiRequest, NextApiResponse } from 'next'

const generateTwitterImage = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // setup
  // overlay text
  const WIDTH = 1200
  const HEIGHT = 675
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT)

  const nftImageUri = req.query.nftImageUri as string
  const claimed = (req.query.claimed as string) === 'true'

  // draw base image
  const baseImgUri = claimed
    ? 'https://i.imgur.com/mACqW6L.png'
    : 'https://i.imgur.com/sbGHJpX.png'

  const backgroundCtx = imageCanvas.getContext('2d')
  backgroundCtx.fillStyle = 'rgba(26, 27, 32, 1)'
  backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT)

  const img = await canvas.loadImage(baseImgUri)
  const imgContext = imageCanvas.getContext('2d')
  if (img.height > img.width) {
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
  } else {
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
  }

  const nftWidth = claimed ? 385 : 450
  const nftHeight = claimed ? 385 : 450
  const xDiff = claimed ? 407 : 577
  const yDiff = claimed ? 177 : 112

  const nftImage = await canvas.loadImage(nftImageUri)
  const nftImageContext = imageCanvas.getContext('2d')
  nftImageContext.fillRect(xDiff, yDiff, nftWidth, nftHeight)
  if (nftImage.height > nftImage.width) {
    nftImageContext.drawImage(nftImage, xDiff, yDiff, nftWidth, nftHeight)
  } else {
    nftImageContext.drawImage(nftImage, xDiff, yDiff, nftWidth, nftHeight)
  }

  const buffer = imageCanvas.toBuffer('image/png')
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffer.length,
  })
  res.end(buffer, 'binary')
}

export default generateTwitterImage
