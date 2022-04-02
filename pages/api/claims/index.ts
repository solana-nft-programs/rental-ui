import type { NextApiRequest, NextApiResponse } from 'next'

import db from '../../../prisma/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { tokenManagerIds } = req.query

    const found = await db.claim.findMany({
      where: {
        tokenManagerId: {
          in: (tokenManagerIds as string).split(',') as string[],
        },
      },
    })

    res.status(200).json({ claims: found })
  } catch (error) {
    console.log(
      'Error ocurred trying to find claims within db:',
      (error as any).message
    )
    res.status(500).json({
      message: (error as any).message,
    })
  }
}
