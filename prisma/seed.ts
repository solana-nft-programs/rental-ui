const { PrismaClient, DiscountType } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // await Promise.all(
  //   nfts.map((n) =>
  //     prisma.nft.create({
  //       data: {
  //         ...n,
  //         updateAuthority: 'DJcr9d6mq8eFYkDF8EhLc6CXTY43sBcHkzrou7AM64PX',
  //       },
  //     })
  //   )
  // )

  // await Promise.all(
  //   discounts.map((n) =>
  //     prisma.discount.create({
  //       data: {
  //         type: DiscountType.PERCENTAGE,
  //         productExternalId: n.id,
  //         amount: 100,
  //       },
  //     })
  //   )
  // )
}

export {}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
