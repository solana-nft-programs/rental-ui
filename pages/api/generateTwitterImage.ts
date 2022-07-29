import * as canvas from 'canvas'
import type { NextApiRequest, NextApiResponse } from 'next'

const generateTwitterImage = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // setup
  // overlay text
  const WIDTH = 1000
  const HEIGHT = 562.5
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT)

  const nftImageUri = req.query.nftImageUri as string

  // draw base image
  const baseImgUri = 'https://i.imgur.com/Kd1e27L.png'

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

  const nftWidth = 242
  const nftHeight = 242

  const nftImage = await canvas.loadImage(nftImageUri)
  const nftImageContext = imageCanvas.getContext('2d')
  nftImageContext.fillRect(550, 178, nftWidth, nftHeight)
  if (nftImage.height > nftImage.width) {
    nftImageContext.drawImage(nftImage, 550, 178, nftWidth, nftHeight)
  } else {
    nftImageContext.drawImage(nftImage, 550, 178, nftWidth, nftHeight)
  }

  const buffer = imageCanvas.toBuffer('image/png')
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffer.length,
  })
  res.end(buffer, 'binary')
}

export default generateTwitterImage
