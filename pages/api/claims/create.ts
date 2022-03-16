import type { NextApiRequest, NextApiResponse } from 'next'
import db from '../../../prisma/prisma'
import { sendEmailWithTemplate } from '../../../api/sendEmail'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { tokenManagerId, email, nftMintId, link } = req.body
    const created = await db.claim.create({
      data: {
        tokenManagerId: tokenManagerId as string,
        email: email as string,
        nftMintId: nftMintId as string,
        link: link as string,
      },
    })
    await sendEmailWithTemplate({
      to: email,
      templateAlias: 'welcome',
      payload: {
        actionUrl: link,
      },
    })
    res.status(201).json({ ...created })
  } catch (error) {
    console.log(
      'Error ocurred trying to create claim within db:',
      (error as any).message
    )
    res.status(500).json({
      message: (error as any).message,
    })
  }
}
