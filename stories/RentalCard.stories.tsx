import 'antd/dist/antd.css'
import '../styles/globals.css'

import { BN } from '@project-serum/anchor'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import type { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'

import { RentalCard } from '../rental-components/components/RentalCard'

const connection = new Connection('https://api.devnet.solana.com')

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Rentals/RentalCard',
  component: RentalCard,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
    connection: {
      options: ['Dev', 'Main'],
      mapping: {
        Dev: new Connection('https://api.devnet.solana.com'),
        Main: new Connection('https://api.mainnet-beta.solana.com'),
      },
    },
  },
} as ComponentMeta<typeof RentalCard>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof RentalCard> = (args) => (
  <RentalCard {...args} />
)

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  connection: new Connection('https://api.devnet.solana.com'),
  wallet: {
    publicKey: new PublicKey('3c5mtZ9PpGu3hj1W1a13Hie1CAXKnRyj2xruNxwWcWTz'),
    signTransaction: async () => new Transaction(),
    signAllTransactions: async () => [new Transaction()],
  },
  tokenDatas: [
    {
      tokenAccount: {
        account: {
          data: {
            parsed: {
              info: {
                delegate: 'FHT7qWkuZLZms8dKGvwb6MFaNdGC1j9uXMqqD9eMvq2j',
                delegatedAmount: {
                  amount: '1',
                  decimals: 0,
                  uiAmount: 1,
                  uiAmountString: '1',
                },
                isNative: false,
                mint: '81YfQDbo17N77bt4JRokLVvGUJBVRRWDpRKWTcxF6XCN',
                owner: '3c5mtZ9PpGu3hj1W1a13Hie1CAXKnRyj2xruNxwWcWTz',
                state: 'initialized',
                tokenAmount: {
                  amount: '1',
                  decimals: 0,
                  uiAmount: 1,
                  uiAmountString: '1',
                },
              },
              type: 'account',
            },
            program: 'spl-token',
            space: 165,
          },
          executable: false,
          lamports: 2039280,
          owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          rentEpoch: 280,
        },
        pubkey: new PublicKey('2k7SNizKzqPUvkiq1ZbC7bxqu8mcVBMnxCbsAn7RtWFc'),
      },
      metaplexData: {
        pubkey: new PublicKey('3QRRWdddUvHDL6rxub1qw8AKyJ512HpHB2BUGyi2z1kK'),
        data: {
          key: 4,
          updateAuthority: '82UgoX3dGwPLSeEEM4wxZxqNWu1f4cp5qAi48FPaqACX',
          mint: '81YfQDbo17N77bt4JRokLVvGUJBVRRWDpRKWTcxF6XCN',
          data: {
            name: 'Portals',
            symbol: 'PRTL',
            uri: 'https://arweave.net/RewRYM3lf-1Ry1hitgsiXuqsuERSujlTAChgl9S483c',
            sellerFeeBasisPoints: 10,
            creators: [],
          },
          primarySaleHappened: false,
          isMutable: true,
          editionNonce: 255,
          tokenStandard: 0,
          collection: null,
          uses: null,
        },
      },
      editionData: {
        pubkey: new PublicKey('5rYEz8UEtmsCs3wVR6odh8v6wbK2XWrKDeY9jGu7v78P'),
        parsed: {
          key: 6,
          supply: new BN('00'),
          maxSupply: new BN('01'),
        },
      },
      metadata: {
        pubkey: new PublicKey('3QRRWdddUvHDL6rxub1qw8AKyJ512HpHB2BUGyi2z1kK'),
        data: {
          name: 'Portals | Onyx #104',
          symbol: 'PRTL',
          description:
            'This expansive space strikes the perfect balance of splendor and functionality.',
          seller_fee_basis_points: 500,
          image:
            'https://arweave.net/Kpi85acYI9i9HZVnnhRuO3Vi_1XDpshHx80eGA3mhD4?ext=jpg',
          animation_url:
            'https://arweave.net/SuRJK0fVU2Mg1L0qIJggeNQsWhHz7HUOboS9-gGhPAg?ext=mp4',
          attributes: [
            {
              trait_type: 'Unit Type',
              value: 'Onyx',
            },
            {
              trait_type: 'Unit Number',
              value: 104,
            },
          ],
          collection: {
            name: 'Portals',
            family: 'Portals',
          },
          properties: {
            files: [
              {
                uri: 'https://arweave.net/Kpi85acYI9i9HZVnnhRuO3Vi_1XDpshHx80eGA3mhD4?ext=jpg',
                type: 'image/jpeg',
              },
              {
                uri: 'https://arweave.net/SuRJK0fVU2Mg1L0qIJggeNQsWhHz7HUOboS9-gGhPAg?ext=mp4',
                type: 'video/mp4',
              },
            ],
            category: 'video',
            creators: [
              {
                address: 'EmdsWm9dJ1d6BgQzHDcMJkDvB5SVvpfrAtpiGMVW1gxx',
                share: 0,
              },
              {
                address: 'GdtkQajEADGbfSUEBS5zctYrhemXYQkqnrMiGY7n7vAw',
                share: 100,
              },
            ],
          },
        },
      },
    },
  ],
}
