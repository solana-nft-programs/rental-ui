import type { TokenData } from 'apis/api'
import type { AirdropMetadata } from 'common/Airdrop'
import type { IconKey } from 'common/Socials'
import { WRAPPED_SOL_MINT } from 'hooks/usePaymentMints'
import type {
  DurationOption,
  RentalCardConfig,
} from 'rental-components/components/RentalIssueCard'

import type { UserTokenData } from '../hooks/useUserTokenData'

export const COLORS = {
  primary: '#907EFF',
  accent: '#7EFFE8',
  glow: '#CE81F4',
  'light-0': '#FFFFFF',
  'light-1': '#F5E2FF',
  'light-2': '#B1AFBB',
  'medium-3': '#8D8B9B',
  'medium-4': '#6D6C7C',
  'dark-5': '#0B0B0B',
  'dark-6': '#000000',
}

export type Colors = {
  accent: string
  glow: string
}

export type TokenFilter = {
  type: 'creators' | 'issuer' | 'state' | 'claimer' | 'owner'
  value: string[]
}

export interface TokenSection {
  id: string
  header?: string
  description?: string
  icon?:
    | 'time'
    | 'featured'
    | 'listed'
    | 'rented'
    | 'available'
    | 'info'
    | 'performance'
  filter?: TokenFilter
  tokens?: TokenData[] | UserTokenData[]
  showEmpty?: boolean
}

export type Badge = {
  badgeType: 'recent' | 'trending' | 'expiration'
  position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right'
  content?: JSX.Element | string
}

export type ProjectConfig = {
  type: 'Collection' | 'Guild'
  hidden?: boolean
  indexDisabled?: boolean
  indexMetadataDisabled?: boolean
  issuedOnly?: boolean
  name: string
  displayName: string
  websiteUrl: string
  hero?: string
  description?: string
  hostname?: string
  twitterHandle?: string
  socialLinks?: {
    icon: IconKey
    link: string
  }[]
  disallowedMints?: string[]
  logoImage: string
  logoPadding?: boolean
  colors: Colors
  badges?: Badge[]
  disableListing?: boolean
  filter?: TokenFilter
  subFilters?: { label: string; filter: TokenFilter }[]
  attributeDisplay?: { displayName?: string; attributeName: string }[]
  sections?: TokenSection[]
  rentalCard: RentalCardConfig
  airdrops?: AirdropMetadata[]
  showUnknownInvalidators?: boolean
  marketplaceRate?: DurationOption
  allowOneByCreators?: {
    address: string
    enforceTwitter: boolean
    preventMultipleClaims: boolean
    disableReturn: boolean
  }[]
}

const defaultRentalCardConfig: RentalCardConfig = {
  invalidators: ['rate', 'duration', 'expiration', 'manual'],
  invalidationOptions: {
    visibilities: ['public', 'private'],
    durationOptions: ['hours', 'days', 'weeks'],
    invalidationTypes: ['reissue', 'return'],
    paymentMints: [WRAPPED_SOL_MINT],
    showClaimRentalReceipt: false,
    setClaimRentalReceipt: false,
    maxDurationAllowed: {
      displayText: '12 weeks',
      value: 7258000,
    },
  },
}

export const projectConfigs: { [key: string]: ProjectConfig } = {
  miniroyale: {
    name: 'miniroyale',
    displayName: 'Mini Royale',
    type: 'Collection',
    websiteUrl: 'https://miniroyale.io/',
    hero: '/logos/miniroyale-hero.png',
    description:
      'Mini Royale: Nations is a browser-based first-person-shooter set on top of a land strategy game. Players can earn mintable items through Battle Pass and Quests, join or create Clans to participate in Clan Wars, fuse weapons and characters for ultra rare skins, and more.',
    logoImage: '/logos/miniroyale.png',
    twitterHandle: '@MiniNations',
    colors: {
      accent: '#2584df',
      glow: '#2584df',
    },
    indexMetadataDisabled: true,
    socialLinks: [
      {
        icon: 'web',
        link: 'https://miniroyale.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/MiniNations',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/miniroyale',
      },
    ],
    badges: [{ badgeType: 'trending' }],
    filter: {
      type: 'creators',
      value: [
        'CbPuZtVMAWwPySvsUAEbZhe8y9rkeAZ5qLhsGBVvtau9', // S1
        'EoYTpE5HuTaXkN2AWDAgGA3JbhtPdeqnUiY9rdG7hMf', // S1
        'EpgYkzyAXPDq11G5ngctWcjq7pKSfUtEnjVcYPs2jhGY', // S2
        '3TVyY5Tw9CuKj7EJwaawacDqBM5jnbeL1kRUvhDPvxH4', // S2
        'GgT69RnQwQhE8cmnTivRHSPfvXwd3HirdbnHQBaHgqwt', // Sank
        '4hgG6XRBwGNsFpuCnBJMGi9iQteWmULM4nX6zSsgDKgz', // Sank
        '2faPGFSk2wCusw9cesExgU4ccWGUV9r9FmaS4enUEUq3', // S3 loot
        'CArLVRRcumM2QV2zVyhEFVK8w1hFVftPK94rRrGN2wMC', // S3 premium
      ],
    },
    subFilters: [
      {
        label: 'Season 3',
        filter: {
          type: 'creators',
          value: [
            '2faPGFSk2wCusw9cesExgU4ccWGUV9r9FmaS4enUEUq3',
            'CArLVRRcumM2QV2zVyhEFVK8w1hFVftPK94rRrGN2wMC',
          ],
        },
      },
      {
        label: 'Season 2',
        filter: {
          type: 'creators',
          value: [
            'EpgYkzyAXPDq11G5ngctWcjq7pKSfUtEnjVcYPs2jhGY',
            '3TVyY5Tw9CuKj7EJwaawacDqBM5jnbeL1kRUvhDPvxH4',
          ],
        },
      },
      {
        label: 'Season 1',
        filter: {
          type: 'creators',
          value: [
            'CbPuZtVMAWwPySvsUAEbZhe8y9rkeAZ5qLhsGBVvtau9',
            'EoYTpE5HuTaXkN2AWDAgGA3JbhtPdeqnUiY9rdG7hMf',
          ],
        },
      },
      {
        label: 'Sank season',
        filter: {
          type: 'creators',
          value: [
            'GgT69RnQwQhE8cmnTivRHSPfvXwd3HirdbnHQBaHgqwt',
            '4hgG6XRBwGNsFpuCnBJMGi9iQteWmULM4nX6zSsgDKgz',
          ],
        },
      },
    ],
    rentalCard: defaultRentalCardConfig,
    airdrops: [
      {
        name: 'Miniverse Hero #03016',
        symbol: 'MINIROYALE',
        uri: 'https://arweave.net/QfhzPB4a2txBl1Myumyq4431klq6HjDUwacPfS07W4Y',
      },
      {
        name: 'Miniverse Weapon #184776',
        symbol: 'MINIROYALE',
        uri: 'https://arweave.net/amSCKytNSZy5cxuoJx-PSY0qMQK6ZAZzD4QnzyMzvBk',
      },
      {
        name: 'Miniverse Hero #0720',
        symbol: 'MINIROYALE',
        uri: 'https://bafybeiat55vtqutsbtyz5u3ufjru7iiv6giete4bdu3mbgqhaxjvnelc7u.ipfs.nftstorage.link/89.json',
      },
      {
        name: 'Miniverse Weapon #27339',
        symbol: 'MINIROYALE',
        uri: 'https://tokens.miniroyale.io/token-data?expires=4806495451&id=904c950a-309b-4fee-9bd4-504771ed2df9&token=BhknUWE6vXAElVhxWKE-YX6_4_acumpPP8q3ZQnsvR8',
      },
    ],
  },
  solrarity: {
    name: 'solrarity',
    displayName: 'SolRarity Rarikeys',
    type: 'Collection',
    websiteUrl: 'https://solrarity.app/',
    logoImage: '/logos/solrarity.png',
    logoPadding: true,
    hero: '/logos/solrarity-hero.png',
    description:
      '2,600 unique Rarikeys allowing you to be part of SolRarity journey in the Solana ecosystem. Hold these precious keys to unlock access to premium tools and more...',
    colors: {
      accent: '#d40e99',
      glow: '#d40e99',
    },
    badges: [{ badgeType: 'trending' }],
    twitterHandle: '@NFTNerdsAI',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://solrarity.app/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SolRarity_',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/solrarity',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        '53EmnGdMxnmNcaPUE6wJ2NHz6iUVpge4a7RViTdfb8Dq', // rarikeys 1
        'GfuaX8U67NBYHv133cvTDekqWy6EmYUrdH7UxPqKRgCL', // rarikeys 2
        'BF2rThtdXMSbFBHbHjTVKXndQnJ1k8HALsX2HCL1QvSc', // snipies
      ],
    },
    subFilters: [
      {
        label: 'Rarikeys',
        filter: {
          type: 'creators',
          value: [
            '53EmnGdMxnmNcaPUE6wJ2NHz6iUVpge4a7RViTdfb8Dq',
            'GfuaX8U67NBYHv133cvTDekqWy6EmYUrdH7UxPqKRgCL',
          ],
        },
      },
      {
        label: 'Snipies',
        filter: {
          type: 'creators',
          value: ['BF2rThtdXMSbFBHbHjTVKXndQnJ1k8HALsX2HCL1QvSc'],
        },
      },
    ],
    rentalCard: defaultRentalCardConfig,
  },
  portals: {
    name: 'portals',
    displayName: 'Portals',
    type: 'Collection',
    websiteUrl: 'https://theportal.to/',
    logoImage: '/logos/portals.svg',
    logoPadding: true,
    colors: {
      accent: '#80ddef',
      glow: '#80ddef',
    },
    hero: '/logos/portals-hero.png',
    twitterHandle: '@_portals_',
    description:
      'The Metaverse on Solana. Explore downtown, invite friends, chat, build, show off your NFTs — right in the browser.',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://theportal.to/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/_portals_',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/9uMBaCPW3f',
      },
    ],
    filter: {
      type: 'creators',
      value: ['5grvMeoBqv5ZdHq9JMy5RrxLPNAt1nzc9cpqYWFUwizz'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  smb: {
    name: 'smb',
    displayName: 'Solana Monkey Business',
    type: 'Collection',
    websiteUrl: 'https://market.solanamonkey.business/',
    logoImage: '/logos/smb-large.png',
    hero: '/logos/smb-hero.png',
    description: '5000 inspired generative NFTs.',
    twitterHandle: '@SolanaMBS',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://solanamonkey.business/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SolanaMBS',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/solanamonkeybusiness',
      },
    ],
    colors: {
      accent: '#cccdff',
      glow: '#cccdff',
    },
    filter: {
      type: 'creators',
      value: ['9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F'],
    },
    showUnknownInvalidators: true,
    rentalCard: defaultRentalCardConfig,
  },
  degenape: {
    name: 'degenape',
    displayName: 'Degenerate Ape Academy',
    type: 'Collection',
    websiteUrl: 'https://degenape.academy/',
    logoImage: '/logos/degenape.png',
    logoPadding: true,
    hero: '/logos/degenape-hero.png',
    description:
      'Our mission here at the academy is simple: Take 10,000 of the smoothest brained apes, put them all in one location and let the mayhem ensue. The academy was founded on the principles of friendship making, crayon eating and absolute, unregulated, deplorable, degenerate behaviour. Welcome fellow apes, to the Degenerate Ape Academy.',
    twitterHandle: '@DegenApeAcademy',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://degenape.academy/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/DegenApeAcademy',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/degendaoo',
      },
    ],
    colors: {
      accent: '#e0b23d',
      glow: '#e0b23d',
    },
    filter: {
      type: 'creators',
      value: ['DC2mkgwhy56w3viNtHDjJQmc7SGu2QX785bS4aexojwX'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  scalpempire: {
    name: 'scalpempire',
    displayName: 'Scalp Empire',
    type: 'Collection',
    websiteUrl: 'https://www.scalp-empire.com/',
    logoImage: '/logos/scalpempire.png',
    hero: '/logos/scalpempire-hero.png',
    colors: {
      accent: '#93c34d',
      glow: '#93c34d',
    },
    description:
      "Scalp Empire Nestor Collection is all about Nestor's journey in-between realms. From Midgar to Asgard, you will see him evolve in different shapes, colors, and universes. This NFT will give you access to a collection of tools made by Scalp Empire. We have everything that will help you trade NFTs.",
    twitterHandle: '@ScalpEmpireNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.scalp-empire.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/ScalpEmpireNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/scalpempire',
      },
    ],
    filter: {
      type: 'creators',
      value: ['5g3T8224Ha5as4Ho7tcRxsHQFr4pzeEa1wEtnir93m3t'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  hoa: {
    name: 'hoa',
    displayName: 'Homeowners Association (Parcl)',
    type: 'Collection',
    websiteUrl: 'https://www.hoa.house/',
    hero: '/logos/parcl-hero.png',
    description:
      'Homeowners Association (HOA) is an NFT project by Parcl, consisting of 7,777 unique combinations of iconic homes from four unique cities.',
    logoImage: '/logos/parcl.gif',
    colors: {
      accent: '#10abf0',
      glow: '#005eff',
    },
    twitterHandle: '@parcl',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.hoa.house/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/parcl',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/parcl',
      },
    ],
    filter: {
      type: 'creators',
      value: ['Cp3Fn6azbwtSG9LV1BWtQcAkQQiaQWDkc2LcqwaEuLuq'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  defiland: {
    name: 'defiland',
    displayName: 'DeFi Land',
    type: 'Collection',
    websiteUrl: 'https://www.defiland.app/',
    logoImage: 'https://defiland.app/_nuxt/img/defiland.74b3850.svg',
    logoPadding: true,
    colors: {
      accent: '#CD9373',
      glow: '#CD9373',
    },
    socialLinks: [
      {
        icon: 'web',
        link: 'https://defiland.app/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/DeFi_Land',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/defiland',
      },
    ],
    twitterHandle: '@DeFi_Land',
    filter: {
      type: 'creators',
      value: [
        '4exgPiVhpromTi8duBsMnscoodAjU1as13s1AXZGsGHP', // harvester
        'FF1uGW7AUvUBskvWNqda1ehFX1jCkvaUk6FRcbWUEaBw', // harvester
        '3XE8DuYzqZLKr1XqXrvADRTxXWL91KuakqsKfD3cYoLP', // gun
        '5XTbjtKM1whecjXMMdDUz3BzWqEDRuJxTRPX3xTF1qmG',
        'Ajp7uzkyPUU35pGdkjZd9Gbe4zgDQXterWY8ZzvP4sCk', // boat
        '8m4TTZz3RsDVakDSwn7T89GyButxLiMqn2zq7DWfANu7', // cat, cow, dog
        '5B9AwfGpR5GRYTipUrFuvishUmPA86R5E1JcGodEsPq1', // fishing rod
        '3eYyhpeZD2V8iGAdAM8qDPVAgvy7LqbdQBbybnpKgvCu', // fishing rod 2
        'CDNsHymcJadDkoXxzhpDe2i6723ezm15QZqkEP91uXij', // harverster 2
        'DhHpYwT9oy75BB8XXb8Fz6HBLxktwqc1yhUPvcCg5GPB', // gun 2
        'CXDvGCdJjr7pT6hPuouT1aQBYw7soWWCRoV7h3YvAYjW', // animals
        '8UCcoezxS7sWxZL71H1aobhTsoWbyzKeFibykcEjnree', // animals
        'Gk8mH3mPqZuEiQRLqzEcGRVqWVeZ7cjKnbGbpb5z9x1H', // animals
      ],
    },
    attributeDisplay: [{ attributeName: 'Health' }],
    indexMetadataDisabled: true,
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks'],
        visibilities: ['public'],
        invalidationTypes: ['reissue', 'return'],
        paymentMints: [WRAPPED_SOL_MINT],
        // paymentMints: [
        //   'DFL1zNkaGPWm1BqAVqRjCZvHmwTFrEaJtbzJWgseoNJh', // defiland
        //   'GoLDYyyiVeXnVf9qgoK712N5esm1cCbHEK9aNJFx47Sx', // goldy
        // ],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
  },
  'serum-surfers': {
    name: 'serum-surfers',
    displayName: 'Serum Surfers',
    type: 'Collection',
    websiteUrl: 'https://www.projectserum.com/',
    logoImage: '/logos/serum-surfers.png',
    hero: '/logos/serum-surfers-hero.png',
    description:
      'The Serum Surfers are a collection of 5,000 generative NFTs minted and launched on Solana through Burnt Finance’s Ignition Launchpad. They are a special homage to the Solana network’s inception, where founders Raj Gokal and Anatoly Yakovenko surfed alongside many of the early employees at Solana Beach, California. The Serum Surfers are the centerpiece of the quickly growing Serum NFT Ecosystem, and a key access ticket to everything it has in store!',
    twitterHandle: '@SurfersDAO',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.projectserum.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SurfersDAO',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/projectserum',
      },
    ],
    colors: {
      accent: '#49cbde',
      glow: '#49cbde',
    },
    filter: {
      type: 'creators',
      value: ['5v3tpTWZmn8JCzTFVE3eZLLQhhqSLLmTcRR2DZ8Gx2JX'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  soultools: {
    name: 'soultools',
    displayName: 'SOuLTools',
    type: 'Collection',
    websiteUrl: 'https://soultools.io/',
    logoImage: '/logos/soultools.png',
    hero: '/logos/soultools-hero.png',
    colors: {
      accent: '#3fb0e8',
      glow: '#3fb0e8',
    },
    description:
      "The NFT animals living in the spirit world never sleep and are hard-working. SOuLTools offers an all-in-one Solana's toolkit. We are the first and only hybrid-CLI sniper and minter solution in Solana.",
    twitterHandle: '@SOuLTools_',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://soultools.io/',
      },
      {
        icon: 'twitter',
        link: 'https://www.twitter.com/SOuLTools_',
      },
      {
        icon: 'discord',
        link: 'https://www.discord.gg/VVpHCSR4Vs',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        'AtsVWP3hh1MdF2Zz8XWNWwNxbZzt7AtjJBxxPAajnMsY',
        'Eu1kGtLdb8hjdbhkvH16q76E66gUgVvw8Uw2xrsVqCSE',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  nftsoloist: {
    name: 'nftsoloist',
    displayName: 'NFTSoloist Genesis Pass',
    type: 'Collection',
    websiteUrl: 'https://nftnerds.ai/',
    logoImage: '/logos/nftsoloist.png',
    hero: '/logos/nftsoloist-hero.png',
    description:
      '250 Genesis Passes for early supporters of NFTSoloist. Grants full access to https://nftsoloist.ai',
    colors: {
      accent: '#8863d4',
      glow: '#8863d4',
    },
    twitterHandle: '@NFTNerdsAI',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.hoa.house/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/NFTNerdsAI',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/nftnerds',
      },
    ],
    filter: {
      type: 'creators',
      value: ['FpJ3h2dzuvmdedmuV4ECz8S31RacnCxiw2ykXNhMntVt'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  smartseasociety: {
    name: 'smartseasociety',
    displayName: 'Smart Sea Society',
    type: 'Collection',
    websiteUrl: 'https://www.smartseasociety.com/',
    logoImage: '/logos/smartseasociety.png',
    hero: '/logos/smartseasociety-hero.png',
    colors: {
      accent: '#63a7d4',
      glow: '#63a7d4',
    },
    description:
      'Smart Sea Society uses AI to build tools that give their holders unprecedented alpha about the NFT market. By holding an NFT you get exclusive access to our current and future tools.',
    twitterHandle: '@SmartSeaSociety',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.smartseasociety.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SmartSeaSociety',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/SmartSeaSociety',
      },
    ],
    filter: {
      type: 'creators',
      value: ['D1UkjD34JBSynjUs8QDuhfntqkN7rqamj5ds1o2hQFNq'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  myceliumpass: {
    name: 'myceliumpass',
    displayName: 'Mycelium Pass',
    type: 'Collection',
    websiteUrl: 'https://myceliumlabs.io/',
    logoImage: '/logos/myceliumpass.png',
    hero: '/logos/myceliumpass-hero.png',
    colors: {
      accent: '#c5abd8',
      glow: '#c5abd8',
    },
    description:
      'Mycelium Pass grants you access to the Mycelium Tool Suite, the next generation of NFT analysis and automation software. OG Pass holders get exclusive rewards, royalties & premium features access.',
    twitterHandle: '@MyceliumLabsNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://myceliumlabs.io/',
      },
      {
        icon: 'twitter',
        link: 'https://www.twitter.com/MyceliumLabsNFT',
      },
      {
        icon: 'discord',
        link: 'https://www.discord.gg/myceliumnft',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        'PMEnb53GA9xNuC2hfhKLtNh9sUduqHU3TxW55TF8WWu',
        '7BpqmFDeUt38cXM8wdxBALJEgnJwHjJa9MjmK63PpFdn',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  rakkudos: {
    name: 'rakkudos',
    displayName: 'Rakkudos',
    type: 'Collection',
    websiteUrl: 'https://www.rakkudos.com/',
    logoImage: '/logos/rakkudos.png',
    hero: '/logos/rakkudos-hero.png',
    colors: {
      accent: '#444444',
      glow: '#888888',
    },
    description:
      "10,000 Raccoons empowering web3 builders brought to you by Shakudo - the platform that unites all of the data tools and services you'll ever need.",
    twitterHandle: '@rakkudos',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.rakkudos.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/rakkudos',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/shakudo',
      },
    ],
    filter: {
      type: 'creators',
      value: ['HAvvubBRmiKECTCBBtYzhUx53SyZn3GZ2fcvw79MQqtY'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  notifish: {
    name: 'notifish',
    displayName: 'Notifish',
    type: 'Collection',
    websiteUrl: 'https://notifi.network/',
    logoImage: '/logos/notifish.png',
    hero: '/logos/notifish-hero.png',
    description:
      'We are the only messaging infrastructure for dapps to engage with their users in the Web3 world.',
    twitterHandle: '@NotifiNetwork',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://notifi.network/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/NotifiNetwork',
      },
      {
        icon: 'discord',
        link: 'https://t.co/xNA0ATndwL',
      },
    ],
    colors: {
      accent: '#fcc698',
      glow: '#fcc698',
    },
    filter: {
      type: 'creators',
      value: ['4DyoBc7mp8AjGUy5Ux8EWkp4g9SZw2znvyzsZ6GGBFUi'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  hydrascripts: {
    name: 'hydrascripts',
    displayName: 'HydraScripts',
    type: 'Collection',
    websiteUrl: 'https://twitter.com/HydraScripts',
    logoImage: '/logos/hydrascripts.png',
    hero: '/logos/hydrascripts-hero.png',
    colors: {
      accent: '#dd1fda',
      glow: '#dd1fda',
    },
    description:
      'Owning a Hydra Pass will grant you access to HydraScripts: an NFT minting and sniping CLI bot living on the Solana Blockchain.',
    twitterHandle: '@HydraScripts',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/HydraScripts',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/HydraScripts',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/Wrv6NKeyFX',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        'F5H94UB5TVyPBvHC8sZhRUK8j47EPm426M6qx9EgreD',
        'EQSoRhbN9fEEYXKEE5Lg63Mqf17P3JydcWTvDhdMJW1N',
        '3RvhT5J2ffn4UAFCh3dqgMRvqoPKUWaNbPoD6rhuQ6SV',
        '75CPiM9ywLgxhii9SQsNoA1SH3h66o5EhrYsazHR5Tqk',
        '6kMe4oQWEK1zfaXTUUAv7amgbCLqkuzeg8NxTXdmcxXf',
        '4VM2pJQWN1W8ELyrPFwxFFY5cqzmYJdRJpMUuYQPhpkK',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  rooniverse: {
    name: 'rooniverse',
    displayName: 'Rooniverse',
    type: 'Collection',
    websiteUrl: 'https://www.playrooniverse.com/',
    logoImage: '/logos/rooniverse.png',
    hero: '/logos/rooniverse-hero.png',
    colors: {
      accent: '#b338ef',
      // #1abfdd alternative
      glow: '#b338ef',
    },
    description:
      'Enter the world of savage, tribal Roos who fight to the death for sport and glory! Collect resources across lands, battle with friends, and build your own corner of Rooniverse! Adopt a Roo to access our Mini-Rooyale pre-alpha demo sessions!',
    twitterHandle: '@playrooniverse',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.playrooniverse.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/playrooniverse',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/rooniverse',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        '3v6SQ2s8w5TYYzXeS5QLn2AD3sfwQLsg9HM3W2t2QDqE',
        'FzeXx41UqWRqYxic3ftehHSTeq5bmaruYbsMrBn4b9qv',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  br1: {
    name: 'br1',
    displayName: 'BR1',
    type: 'Collection',
    websiteUrl: 'https://www.br1game.com/',
    logoImage: '/logos/br1.png',
    hero: '/logos/br1-hero.png',
    description:
      'BR1: Infinite is the leading third person, risk-based shooter where gamers pay-to-spawn and earn $USDC for every player they eliminate. Rent one of the 2500 Ape or 7500 Droid Operatives to shoot and loot your way to victory.',
    hostname: 'rent.br1game.com',
    colors: {
      accent: 'rgb(169,60,239)',
      glow: 'rgb(169,60,239)',
    },
    twitterHandle: '@BR1INFINITE',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.br1game.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/BR1INFINITE',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/br1metaverse',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        '9yz273zB6rQHyptbSpVvC75o4G17NwJrTk4u2ZiNV3tZ',
        'BTzGQ6yk1uFN9q9Po3LGSvmZ3dxq8nf8WPwr4D12APxo',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  metaops: {
    name: 'metaops',
    displayName: 'Meta Ops',
    type: 'Collection',
    websiteUrl: 'https://metaopsgaming.com/',
    logoImage: '/logos/metaops.png',
    logoPadding: true,
    colors: {
      accent: '#b55b5e',
      glow: '#b55b5e',
    },
    twitterHandle: '@MetaOpsGaming',
    description:
      'Team up with friends and put your skills to the test with MetaOps, a tactical 6v6 first-person shooter built on Unity. Discover how to play, earn, and own by renting a MetaOps NFT today.',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://metaopsgaming.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/MetaOpsGaming',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/metaops',
      },
      {
        icon: 'twitch',
        link: 'https://www.twitch.tv/metaopsgaming',
      },
    ],

    filter: {
      type: 'creators',
      value: [
        'HZSQf9Qvdmmn1B5e7YBxWnyoafTUFtqjrw8SqvSRwace',
        'GU2nTh3aWQz4AA8Gaih5AmV8WmKt3Y8P6iwy5t9347h',
        '8CWFS9nzXtLd3LGE3GaSLYTAEUzkAoUPwmtq32nJFkSZ',
        'HMduKVo3A19U5EpQdEhPjo9hq9zfZXn8aGVYZp7Vc7fX',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ratzclub: {
    name: 'ratzclub',
    displayName: 'Ratz Club',
    type: 'Collection',
    websiteUrl: 'https://www.ratzclub.com/',
    logoImage: '/logos/ratzclub.gif',
    hero: '/logos/ratzclub-hero.png',
    colors: {
      accent: '#000',
      glow: '#000',
    },
    description:
      'Ratz are more than just an avatar. They are a collection of 2,000 PFPs endowed with unique abilities. Each Ratz unlocks Vtuber Zilverk private club membership. Ratz are ready to conquer the underground world.',
    twitterHandle: '@ratz_club',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.ratzclub.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/ratz_club',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/ratzclub',
      },
    ],
    filter: {
      type: 'creators',
      value: ['9L8nh1VxgyNP86XgCfuuUrZxB5UP4hD4JF27kkb6tFXR'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  suitcats: {
    name: 'suitcats',
    displayName: 'Suitcats',
    type: 'Collection',
    websiteUrl: 'https://suitcats.com',
    logoImage: '/logos/suitcats.png',
    hero: '/logos/suitcats-hero.png',
    colors: {
      accent: '#497060',
      glow: '#497060',
    },
    description:
      'Suitcats will monitor, track and be notified of mint activity according to your presets to stay ahead of your competition and discover potential opportunities.\nDeals/Snipes, Portfolio Tracking, FFF Token Market Charts, STEPN Tracking are also included and cloud minting automations are currently in development',
    twitterHandle: '@SuitcatsNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://suitcats.com',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SuitcatsNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/suitcat',
      },
    ],
    filter: {
      type: 'creators',
      value: ['8LGV2YeEGXnnBA7owtEdtMR3rM69CX1jaA1oSsb33vD7'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        paymentMints: [WRAPPED_SOL_MINT],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '3 days',
          value: 86400 * 3,
        },
      },
    },
  },
  theremnants: {
    name: 'theremnants',
    displayName: 'The Remnants',
    type: 'Collection',
    websiteUrl: 'theremnants.app',
    logoImage: '/logos/theremnants.png',
    hero: '/logos/theremnants-hero.png',
    colors: {
      accent: '#6B2FB3',
      glow: '#6B2FB3',
    },
    description:
      'The Remnants is a collection of 8000 survivors living in Longwood Valley. Send your Remnants on Loot Trips through the Valley in search of loot. Upgrade your Camp to generate tokens and increase your power within Longwood.',
    twitterHandle: '@RemnantsNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'theremnants.app',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/RemnantsNFT',
      },
      {
        icon: 'discord',
        link: 'discord.gg/remnantsnft',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        'CBaS8mRViYezLL6RKvnnjWe3psUHjSQZbMcD2ardgNyR',
        'ChwagUKd6nRS6H2VnvuwDHsAkfzUhBuG5XJVaPVJNmgq',
        'FPce5x7kdKnzpLa7bPRxQq7CoZce2LU21vxsMgCzqVhs',
      ],
    },
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        visibilities: ['private'],
        durationOptions: ['hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        paymentMints: [WRAPPED_SOL_MINT],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '2 weeks',
          value: 1209600,
        },
      },
    },
  },
  shiguardians: {
    name: 'shiguardians',
    displayName: 'Shi Guardians',
    type: 'Collection',
    websiteUrl: 'https://solanafloor.com/',
    logoImage: '/logos/shiguardians.png',
    hero: '/logos/shiguardians-hero.png',
    colors: {
      accent: '#9e71da',
      glow: '#9e71da',
    },
    description:
      'Shi Guardians give you access to SolanaFloor PRO (by @cryptowazza) with extra features. There are 4 types of lions. Pick your favorite one!',
    twitterHandle: '@SolanaFloor',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://solanafloor.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SolanaFloor',
      },
      {
        icon: 'discord',
        link: 'http://discord.gg/kDhPZqA2mS',
      },
    ],
    filter: {
      type: 'creators',
      value: [
        '2UR2afaRgE5THeqJi7jGWMRMxRS8knbPVQEYekBG8bNd', // stone
        'AwZFMVBBKf8VvLnXLQc9dMn8TWvAADRY4a3Ev6NPSq47', // griffin
        '5X8jX6WK61wfq3wDCT2iRacvJ2Do3kUT3X7SqowDYET6', // mech
        '478v2sRtdYrd4H4HEzHV4LaoyHoRc2Dd4xyq82XbsiZh', // dance
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  okaybears: {
    name: 'okaybears',
    displayName: 'Okay Bears',
    type: 'Collection',
    websiteUrl: 'https://www.okaybears.com/',
    logoImage: '/logos/okaybears.png',
    hero: '/logos/okaybears-hero.png',
    colors: {
      accent: '#2E8B57',
      glow: '#2E8B57',
    },
    description: 'Okay Bears is a culture shift.',
    twitterHandle: '@okaybears',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.okaybears.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/okaybears',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/okaybears',
      },
    ],
    filter: {
      type: 'creators',
      value: ['3xVDoLaecZwXXtN59o6T3Gfxwjcgf8Hc9RfoqBn995P9'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  rifters: {
    name: 'rifters',
    displayName: 'Rifters',
    type: 'Collection',
    websiteUrl: 'https://rifters.io/',
    logoImage: '/logos/rifters.png',
    hero: '/logos/rifters-hero.png',
    disableListing: true,
    colors: {
      accent: '#ff4f5a',
      glow: '#ff4f5a',
    },
    badges: [{ badgeType: 'recent' }],
    description:
      'Rifters is the first ever MOCERPG - Massive Online Community Event Role Playing Game. $1,000,000 cash prize pool for the winning player / DAO for season 1.',
    twitterHandle: '@riftersio',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://rifters.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/riftersio',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/c1g',
      },
    ],
    filter: {
      type: 'creators',
      value: ['22Fkgw3TqKEZGd6zmGcQPb4srWr3YtwKMts57H2RKmH3'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  pixelpilotzNode: {
    name: 'pixelpilotzNode',
    displayName: 'PixelPilotz Node',
    type: 'Collection',
    websiteUrl: 'https://pixelpilotz.com',
    logoImage: '/logos/pixelpilotz-node.png',
    hero: '/logos/pixelpilotz-node-hero.png',
    colors: {
      accent: '#00a2ff',
      glow: '#00a2ff',
    },
    description:
      '500 Pilots that grant their owner access to the Pixel Pilotz RPC/Validator Network.',
    twitterHandle: '@PixelPilotzNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://pixelpilotz.com',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/PixelPilotzNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/pixelpilotz',
      },
    ],
    filter: {
      type: 'creators',
      value: ['62KHBtXLF8DbxCETzQrnFGv2A3VJWoRtofmKKHyNhgcm'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  psyker: {
    name: 'psyker',
    displayName: 'Psyker',
    type: 'Collection',
    websiteUrl: 'https://psyker.game/',
    logoImage: '/logos/psyker.png',
    colors: {
      accent: '#a4051d',
      glow: '#a4051d',
    },
    filter: {
      type: 'creators',
      value: [
        '8AkWaZh92FwkdPmqbR58FpTkpZjrCrRK648UWu6Kuz8',
        '3aKY2TVrHV7XnjcuYhP2gdUWqF8ra8TA4AL5qWQQz5gr',
        'Gvp1RDYLpbBQg35k3x1zpBxWhXNEPuS1jbLALDH8XCaA',
        // '2e8DoDgFZR3By185CDPJAwNE3h1QsaS1NtndM8NQi3Q5',
        // 'HMduKVo3A19U5EpQdEhPjo9hq9zfZXn8aGVYZp7Vc7fX',
      ],
    },
    socialLinks: [
      {
        icon: 'web',
        link: 'https://psyker.game/',
      },
      {
        icon: 'twitter',
        link: 'https://mobile.twitter.com/psykergame',
      },
      {
        icon: 'discord',
        link: 'http://discord.gg/psykergame',
      },
    ],
    rentalCard: defaultRentalCardConfig,
  },
  thesuites: {
    name: 'thesuites',
    displayName: 'The Suites',
    type: 'Collection',
    websiteUrl: 'https://thesuites.app/',
    logoImage: '/logos/thesuites.png',
    hero: '/logos/thesuites-hero.png',
    colors: {
      accent: '#af9467',
      glow: '#fff',
    },
    description: `Introducing "The Suites", an exclusive collection of virtual hangouts on the Solana blockchain! Built by a veteran game development team from EA Sports and FanDuel with decades of experience, The Suites aim to recreate that feeling of going to your local pub dedicated to a single team. Stream live games and events on TV's in your space, audio and text chat, and make wagers in $SUITE tokens across sports, casino, and fun games inside your very own Luxury Suite!`,
    twitterHandle: '@TheSuitesNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/TheSuitesNFT',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/TheSuitesNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/zhzYGxtx9D',
      },
    ],
    filter: {
      type: 'creators',
      value: ['AQ98oUJQuTsX446cYJgEJJRTnQL4b2LiaFTp95nfa2qc'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  trogg: {
    name: 'trogg',
    displayName: 'Trogg',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://tro.gg/',
    logoImage: '/logos/trogg.png',
    hero: '/logos/trogg-hero.png',
    colors: {
      accent: '#90EE90',
      glow: '#90EE90',
    },
    description: `Building ENDAZE - the first on-chain Web3 learning platform, elevate your overall crypto & Solana knowledge with us! The Troggs welcome you in their newfound magical cave!  Join them to learn more about their surroundings and help them reach their final destination!`,
    twitterHandle: '@TroggNFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://tro.gg/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/TroggNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/trogg',
      },
    ],
    filter: {
      type: 'creators',
      value: ['GTNpG4iJfKC65EFVHZpgMViLFm8kTTJYtH3DmTsXZu6R'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  geomancer: {
    name: 'geomancer',
    displayName: 'Geomancer',
    type: 'Collection',
    websiteUrl: 'https://geomancer.store/',
    logoImage: '/logos/geomancer.png',
    hero: '/logos/geomancer-hero.png',
    colors: {
      accent: '#161929',
      glow: '#3858e9',
    },
    description: 'A collection of 2000 Geomancy on Solana Blockchain.',
    twitterHandle: '@GeomancerSol',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://geomancer.store/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/GeomancerSol',
      },
      {
        icon: 'discord',
        link: 'discord.gg/57SXEecNdB',
      },
    ],
    filter: {
      type: 'creators',
      value: ['ADBwZNsoicd81UiCrbQbACypZDtXhn17UphEVLkNdu9N'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  starbots: {
    name: 'starbots',
    displayName: 'Starbots',
    type: 'Collection',
    websiteUrl: 'https://starbots.net',
    logoImage: '/logos/starbots.jpeg',
    hero: '/logos/starbots-hero.jpeg',
    description:
      'Starbots is a BattleBots-inspired universe and the first-ever robot battle NFT game where players create fantasy robots to fight against other competitors, then collect NFT items and GEAR tokens.',
    twitterHandle: '@Starbots_game',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/Starbots_game',
      },
      {
        icon: 'web',
        link: 'https://starbots.net',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/starbots',
      },
    ],
    colors: {
      accent: '#5602de',
      glow: '#b202e9',
    },
    filter: {
      type: 'creators',
      value: [
        'AHzUsxj2Ey65UUwivgxyvYv669YYpiBuk98jvv51BFx7',
        '93NBFwRaNwKgyYRJJSfohjcYzRRQs5fdDiC5kLSdUfWk',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['voxel-monkes']: {
    name: 'voxel-monkes',
    displayName: 'Voxel Monkes',
    type: 'Collection',
    websiteUrl: 'https://voxelmonkes.com',
    logoImage: '/logos/voxel-monkes.gif',
    hero: '/logos/voxel-monkes-hero.png',
    description:
      '75 pieces of handcrafted 3D art, built on the classic monke silhouette, remixed with unique new traits, themes, and styles.',
    twitterHandle: '@VoxelMonkes',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/VoxelMonkes',
      },
      {
        icon: 'web',
        link: 'https://voxelmonkes.com',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/23WrCkyCCt',
      },
    ],
    colors: {
      accent: '#EEEEEE',
      glow: '#EEEEEE',
    },
    filter: {
      type: 'creators',
      value: ['31iYFbZjMnzZi2PDq7KGKV8DC4nJAptBp5tr7LbZUYUj'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  zionlabs: {
    name: 'zionlabs',
    displayName: 'Zion Labs',
    type: 'Collection',
    websiteUrl: 'https://zionlabs.xyz/',
    logoImage: '/logos/zionlabs.jpeg',
    hero: '/logos/zionlabs-hero.jpeg',
    description:
      'A Web 3 experiment studio. Built Cypher, an NFT trading engine with a fully automated trading bot. 777 keys.',
    twitterHandle: '@zion_labs',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://zionlabs.xyz/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/zion_labs',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/DJFafA5Aaz',
      },
    ],
    colors: {
      accent: '#d4fcfe',
      glow: '#cccdff',
    },
    filter: {
      type: 'creators',
      value: ['Ha8Q9MJij5sP84eegUY4Kj6jAFcRu3rHZ2vUeqKkVDUD'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  mintin: {
    name: 'mintin',
    displayName: 'Mintin',
    type: 'Collection',
    websiteUrl: 'https://mintin.app',
    logoImage: '/logos/mintin.png',
    hero: '/logos/mintin-hero.png',
    description:
      'Explore, analyze, and mint NFTs in the Solana world. This is a collection of 1500 Mintins on the blockchain that unlock the best market tools for NFT enthusiasts!',
    twitterHandle: '@mintinnft',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://mintin.app',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/mintinnft',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/hfvPRd8aRX',
      },
    ],
    colors: {
      accent: '#205C7F',
      glow: '#205C7F',
    },
    filter: {
      type: 'creators',
      value: ['mintXVuzRRWjTPfuCXJhSCiQRXHnk3q33ssPPYneJbs'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  blockfriend: {
    name: 'blockfriend',
    displayName: 'BlockFriend NFT',
    type: 'Collection',
    websiteUrl: 'https://blockfriend.net',
    logoImage: '/logos/blockfriend.gif',
    hero: '/logos/blockfriend-hero.png',
    description: `BlockFriend is an exclusive collection of 132 NFTs granting access to top tier automation tools for multi-chain minting and purchasing. Login to the BlockFriend dashboard and connect your discord account after purchasing, to get access to the holder discord: https://blockfriend.net"`,
    twitterHandle: '@BlockFriendNFT',
    indexMetadataDisabled: true,
    socialLinks: [
      {
        icon: 'web',
        link: 'https://blockfriend.net',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/BlockFriendNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/2xHWsxGAdH',
      },
    ],
    colors: {
      accent: '#DCC7FE',
      glow: '#DCC7FE',
    },
    filter: {
      type: 'creators',
      value: ['Fu7g7cgUCkG6qFsASwhV65sEhRjDJfH9H8XdmPtKyKKr'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['alpha-pharaohs']: {
    name: 'alpha-pharaohs',
    displayName: 'Alpha Pharaohs',
    type: 'Collection',
    websiteUrl: 'https://twitter.com/alphapharaohs',
    logoImage: '/logos/alpha-pharaohs.png',
    hero: '/logos/alpha-pharaohs-hero.png',
    description: `4444 Pharaohs tasked with resurrecting the Egyptian Gods; Ra and Anubis. Enter the Sacred DAO & possess the key to unlocking the full power of the ultimate Ra v Anubis collection.`,
    twitterHandle: '@alphapharaohs',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/alphapharaohs',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/alphapharaohs',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/alphapharaohs',
      },
    ],
    colors: {
      accent: '#EEE',
      glow: '#DCC7FE',
    },
    filter: {
      type: 'creators',
      value: ['4tZaYkFCtsbRLJDD9LVHi22ZMhTWCCxQHeQQbtuhSr34'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['node-doctor']: {
    name: 'node-doctor',
    displayName: 'Node Doctor',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://twitter.com/alphapharaohs',
    logoImage: '/logos/node-doctor.jpeg',
    hero: '/logos/node-doctor-hero.jpeg',
    description: `Access to Node Doctor Solana RPC services with multiple IP whitelisting.`,
    twitterHandle: '@node_doctor',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/node_doctor',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/node_doctor',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/nodedoctor',
      },
    ],
    colors: {
      accent: '#b345ea',
      glow: '#b345ea',
    },
    filter: {
      type: 'creators',
      value: ['5saQ3HZ6SYuFvz4rnc2788FWitGHdF6ETUj5hGvojyHv'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['harrddydao']: {
    name: 'harrddydao',
    displayName: 'HarrddyDAO',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://harrddymerch.square.site/',
    logoImage: '/logos/harrddydao.png',
    hero: '/logos/harrddydao-hero.jpeg',
    description: `The premier decentralized community of Web3, providing unparalleled value to our members. Reject humanity, return to Harrddy.`,
    twitterHandle: '@69harrddys',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://harrddymerch.square.site/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/69harrddys',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/GKjXzKjsCB',
      },
    ],
    colors: {
      accent: '#EEE',
      glow: '#DCC7FE',
    },
    filter: {
      type: 'creators',
      value: ['DEgb96Xdh6tuW1mbz1KEHa6TQapRuwc4Q3nL6wER6vvW'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['akeo-labs']: {
    name: 'akeo-labs',
    displayName: 'Akeo Labs',
    type: 'Collection',
    hostname: 'rentals.akeolabs.com',
    websiteUrl: 'https://twitter.com/akeolabs',
    logoImage: '/logos/akeo-labs.jpeg',
    hero: '/logos/akeo-labs-hero.png',
    description: `Akeo Labs develops tools that use artificial intelligence to provide unique information about the NFT market to their holders. We are providing an all in one suite which includes: On-chain sniper, portfolio management, Rug-Wallet Alert + more.`,
    twitterHandle: '@akeolabs',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://hawkeye.akeolabs/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/akeolabs',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/akeolabs',
      },
    ],
    colors: {
      accent: '#000',
      glow: '#000',
    },
    filter: {
      type: 'creators',
      value: ['3bSUU24SBfcG5K8219gaKmW9da1BEZWSL255567CFRwN'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['royal-kong-club']: {
    name: 'royal-kong-club',
    displayName: 'Royal Kong Club',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://twitter.com/RoyalKongClub',
    logoImage: '/logos/royal-kong-club.webp',
    hero: '/logos/royal-kong-club-hero.jpeg',
    description: `Royal Kong Club is a collection on Solana of 5k NFTs, The first NFT that pays royalties to holders Forever!`,
    twitterHandle: '@RoyalKongClub',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.royalkongclub.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/RoyalKongClub',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/royalkongclub',
      },
    ],
    colors: {
      accent: '#B900FF',
      glow: '#B900FF',
    },
    filter: {
      type: 'creators',
      value: ['7p5aRaSyLSLQivA5dyvE3rURSMdhhrzwcayGVq1xnitE'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['doge-track']: {
    name: 'doge-track',
    displayName: 'Doge Track',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://twitter.com/RoyalKongClub',
    logoImage: '/logos/doge-track.jpeg',
    hero: '/logos/doge-track-hero.png',
    description: `The easiest and most fun race-to-earn game on ANY chain. Start racing in seconds - $SOL, $DUST, $DTRK, & more.`,
    twitterHandle: '@theDogeTrack',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://dogetrack.io',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/theDogeTrack',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/dogetrack',
      },
    ],
    colors: {
      accent: '#ac00df',
      glow: '#ac00df',
    },
    filter: {
      type: 'creators',
      value: ['SCL4YPcMCXbWHGPvYxR1e2c7UMFJEZNz88Wr3U8Etj6'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['vula-labs']: {
    name: 'vula-labs',
    displayName: 'Vula Labs',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://vulalabs.com',
    logoImage: '/logos/vula-labs.jpeg',
    hero: '/logos/vula-labs-hero.jpeg',
    description: `The Vula Society provides a shield enabling our holders to keep their information private and leveraging the Vula Labs platform to provide access to curated content without need for subscription, profile, or email address registration.`,
    twitterHandle: '@vulalabs',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://vulalabs.com',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/vulalabs',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/vulalabs',
      },
    ],
    colors: {
      accent: '#000',
      glow: '#000',
    },
    filter: {
      type: 'creators',
      value: [
        'H425bPhHh9gX5ag6Y17JtvN6mUMpaFwDDsD48UBZck4Y',
        '4dAnYRct3HRfDmxjsadFkQxqxadQfM7jXXaxKBh91SB2',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['tfff']: {
    name: 'tfff',
    displayName: 'The Famous Fox Federation',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://famousfoxes.com/',
    logoImage: '/logos/fff.jpeg',
    hero: '/logos/fff-hero.jpeg',
    description: `The Famous Fox Federation, an independent organization of the most fabulously famous foxes on the Blockchain.`,
    twitterHandle: '@famousfoxfed',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://famousfoxes.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/famousfoxfed',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/h2x37M7J',
      },
    ],
    colors: {
      accent: '#fb933c',
      glow: '#fb933c',
    },
    filter: {
      type: 'creators',
      value: [
        'D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3',
        '3pMvTLUA9NzZQd4gi725p89mvND1wRNQM3C8XEv1hTdA',
      ],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['solnauts']: {
    name: 'solnauts',
    displayName: 'Solnauts DAO',
    badges: [{ badgeType: 'recent' }],
    type: 'Collection',
    websiteUrl: 'https://twitter.com/SolnautsDAO',
    logoImage: '/logos/solnauts.png',
    hero: '/logos/solnauts-hero.png',
    description: `A DAO specialized in NFT Loans investing using strategies to grow our dao funds and share benefits to our holders every month.`,
    twitterHandle: '@SolnautsDAO',
    socialLinks: [
      {
        icon: 'twitter',
        link: 'https://twitter.com/SolnautsDAO',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/h2x37M7J',
      },
    ],
    colors: {
      accent: '#FFE027',
      glow: '#FFE027',
    },
    filter: {
      type: 'creators',
      value: ['7M9Qfh4VEEoKdVxdahGTwRJG51snE5kmAmf9YDp6esPn'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['the-nxde']: {
    name: 'the-nxde',
    displayName: 'The NXDE',
    hidden: true,
    type: 'Collection',
    websiteUrl: 'https://docs.blxckout.xyz',
    logoImage: '/logos/blxckout.png',
    hero: '/logos/blxckout-hero.png',
    colors: {
      accent: '#3D2546',
      glow: '#3D2546',
    },
    description: `Rent access to 3 x top spec RPC nodes in a highly redundant setting for 1 year. No monthly subscription. Can be used for building Solana products, sniping and botting. A product from BLXCKOUT.`,
    twitterHandle: '@TheNxde',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://docs.blxckout.xyz',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/TheNxde',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/6CvQNSU3hq',
      },
    ],
    filter: {
      type: 'creators',
      value: ['DfoV7zpFj9sK66ntRzxbTreHmJSR1W6EWgKpL1gGmGWR'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  default: {
    name: 'default',
    displayName: 'Unverified',
    description:
      'This is an unverified collection. Feel free to use at your own risk, these NFTs may or may not be the real verified versions. Visit https://rent.cardinal.so and request to add a verified collection.',
    hidden: true,
    type: 'Collection',
    logoImage: 'logos/default.png',
    hero: 'logos/default-hero.png',
    websiteUrl: 'https://cardinal.so',
    colors: {
      accent: '#7560FF',
      glow: '#7560FF',
    },
    indexMetadataDisabled: true,
    rentalCard: {
      invalidators: ['rate', 'duration', 'expiration', 'manual'],
      extensionOptions: { showDisablePartialExtension: true },
      invalidationOptions: {
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'Origin Jambo',
        symbol: 'JAMB',
        uri: 'https://arweave.net/XBoDa9TqiOZeXW_6bV8wvieD8fMQS6IHxKipwdvduCo',
      },
      {
        name: 'Solana Monkey Business',
        symbol: 'SMB',
        uri: 'https://arweave.net/VjfB54_BbELJ5bc1kH-kddrXfq5noloSjkcvK2Odhh0',
      },
      {
        name: 'Degen Ape',
        symbol: 'DAPE',
        uri: 'https://arweave.net/mWra8rTxavmbCnqxs6KoWwa0gC9uM8NMeOsyVhDy0-E',
      },
      {
        name: 'Thugbirdz',
        symbol: 'THUG',
        uri: 'https://arweave.net/l9VXqVWCsiKW-R8ShX8jknFPgBibrhQI1JRgUI9uvbw',
      },
      {
        name: 'Turtles',
        symbol: 'TRTL',
        uri: 'https://arweave.net/KKbhlHaPMOB9yMm9yG_i7PxzK0y24I5C7gNTaRDI9OE',
      },
      {
        name: 'Almost Famous Pandas',
        symbol: 'AFP',
        uri: '8cs7hpBcuiRbzcdUY5BHpCFCgv1m8JhpZEVHUkYTmhnA',
      },
      {
        name: 'Shi Guardians',
        symbol: 'SHI',
        uri: 'https://arweave.net/hSI4WIsX10yRWnzgXP8oqwSCaSgPfGU5nSN-Pxjslao',
      },
      {
        name: 'Hacker House',
        symbol: 'HH',
        uri: 'https://arweave.net/DLDhnabWSXzAYktEhEKyukt3GIfagj2rPpWncw-KDQo',
      },
      {
        name: '21 Club',
        symbol: '21',
        uri: 'https://bafkreicv3jj6oc53kid76mkk7hqsr6edrnhsydkw4do4vonq777sgfz3le.ipfs.dweb.link?ext=json',
      },
    ],
  },
  ['udderchaos']: {
    name: 'udderchaos',
    displayName: 'Udder Chaos',
    type: 'Guild',
    websiteUrl: 'https://www.udderchaos.io/',
    logoImage: 'logos/udderchaos-logo.png',
    colors: {
      accent: '#f9e7c9',
      glow: '#f9e7c9',
    },
    description:
      'Udder Chaos is a project built on a sustainable business model. Operating a Solana Validator drives consistent income for the project on top of accent sales, while also being supported by their RPC rentals and NFT rental treasury. They are also developing Alpha Audits, an NFT reviewing platform with a review-to-earn mechanism.',
    hero: 'logos/udderchaos-hero.png',
    twitterHandle: 'UdderChaosSOL',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.udderchaos.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/UdderChaosSOL',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/udderchaos',
      },
    ],
    badges: [{ badgeType: 'trending' }],
    filter: {
      type: 'issuer',
      value: ['F65oeXXQaDQYnmQKTmmMpZ5XaLBzoUC16pMTg59RfpK6'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj',
          WRAPPED_SOL_MINT,
        ],
      },
    },
  },
  ['the-unveiled']: {
    name: 'the-unveiled',
    displayName: 'The Unveiled',
    type: 'Guild',
    websiteUrl: 'https://theunveiled.xyz/',
    logoImage: 'logos/the-unveiled.png',
    colors: {
      accent: '#FFF',
      glow: '#FFF',
    },
    description:
      'Manifest your dreams - join the Unveiled!\nWhere brand meets utility! Building BraveIncubator, streetwear brand, and more. Rent your favorite utility based NFTs with $VEIL now!',
    hero: 'logos/the-unveiled-hero.png',
    twitterHandle: '@theunveiled222',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://theunveiled.xyz/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/theunveiled222',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/udderchaos',
      },
    ],
    filter: {
      type: 'issuer',
      value: [
        'EVnkZ9PEZ4wnriFVyN5ET7cakaeffPn5xFXggxAWCgyf',
        '7H5MibNxDDqMx1ZtfcbpZjj8Vi62cXmreY2T6NTwNZx9',
      ],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'vE1LVWTLu1zJf5gyoG8c39cgJCWCXgx5hARY7fms5Dp',
          WRAPPED_SOL_MINT,
        ],
      },
    },
  },
  ['fatcats']: {
    name: 'fatcats',
    displayName: 'Fatcats',
    type: 'Guild',
    websiteUrl: 'https://fatcatscapital.com/',
    logoImage: 'logos/fatcats.png',
    colors: {
      accent: '#397fd6',
      glow: '#397fd6',
    },
    description:
      'The FatCats Capital Club (FCC) is a community focused on the development of projects looking to advance the Solana ecosystem as a whole. Through the FatCats Accelerator program, both holders and project creators can benefit from services the FCC provides.',
    hero: 'logos/fatcats-hero.png',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://fatcatscapital.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/fatcatscapital',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/9FnX58FWVB',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['Dx2svFqyhm1eFQTvKrETehLmrNHpNXhioqSHpXGzp5Xe'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo'],
      },
    },
  },
  ['3dgamersguild']: {
    name: '3dgamersguild',
    displayName: '3D Gamers Guild',
    type: 'Guild',
    websiteUrl: 'https://www.3dgamersguild.com/',
    logoImage:
      'https://images.squarespace-cdn.com/content/v1/618b2aec73c8ed19abf2fd2f/c4a759b4-91d5-462a-bd6d-ce3766ffda2f/3D+Gamers+Logo+with+white+letters+white+text.png?format=1500w',
    logoPadding: true,
    colors: {
      accent: '#34659b',
      glow: '#34659b',
    },
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.3dgamersguild.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/3DGamersGuild',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/ads4wj6Z8z',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['9qoRqZmrAf6bqtmTAPA1UkgCRvKuaugF17xBdympy1vd'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['solanapuppypound']: {
    name: 'solanapuppypound',
    displayName: 'Solana Puppy Pound',
    type: 'Guild',
    websiteUrl: 'https://www.puppypound.io/',
    logoImage: 'logos/solanapuppypound.png',
    logoPadding: true,
    hero: 'logos/solanapuppypound-hero.png',
    colors: {
      accent: '#a14613',
      glow: '#a14613',
    },
    description:
      'Solana Puppy Pound is the Solana Blockchains first gamified staking algorithms. Different breeds of puppies fight for $TREATS dominance. SPP contains a Gen1 & Gen2 puppy collection along with a DAO research pass for future collections made by Solana Puppy Pound.',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.puppypound.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/puppypoundnft',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/m9Xru2RY4d',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['CVnJiJJCTtQWDmgDpLXe4bAKehLsE7oxHyTmygw566QB'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['14r8dWfzmUUBpw59w5swNRb5F1YWqmUnSPgD6djUs1Jj'],
      },
    },
  },
  ['monkettes']: {
    name: 'monkettes',
    displayName: 'The Monkettes',
    type: 'Guild',
    websiteUrl: 'https://monkettes.io/',
    logoImage: 'logos/monkettes.png',
    hero: 'logos/monkettes-hero.png',
    colors: {
      accent: '#fe5d9f',
      glow: '#fe5d9f',
    },
    description:
      'Be part of one of the most knowledgeable communities on Solana by holding a Monkette. Rent one out today!',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://monkettes.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/MonkettesNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/monkettes',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['22aCNyykzcpX6r1ThuZLoqgMHSzsByBBz5bbNkqpMP4q'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['8o66EVAf4u2Hr21m2tuRrPtEXFPLr8G8aL1ETStP8fDu'],
      },
    },
  },
  ['thedegenerates']: {
    name: 'thedegenerates',
    displayName: 'The Degenerates',
    type: 'Guild',
    websiteUrl: 'https://thedegen.app/',
    logoImage: 'logos/thedegenerates.png',
    colors: {
      accent: '#ff7921',
      glow: '#ff7921',
    },
    description:
      'For degenerates by degenerates and home for all degenerates. Slowly taking over the Solana blockchain and beyond with tool help and info such as Mint Bot and sniper features, RPC locations, Degen Alerts, Wallet Manager, RPC Tester and Listing manager. Tool reviews and ratings by your fellow degenerates. Come get your degen on!',
    hero: 'logos/thedegenerates-hero.png',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://thedegen.app/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/_DegeneratesNFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/thedegenerates',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['E6m3sYbjbzCVqtMpDuWjMBnJneJu5a4VnTorz8hpCDB5'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  ['syndicate-initiative']: {
    name: 'syndicate-initiative',
    displayName: 'SyNdicate Initiative',
    type: 'Guild',
    websiteUrl: 'https://www.twitch.tv/syndicateinitiative',
    logoImage: 'logos/syndicate-initiative.png',
    colors: {
      accent: '#A45EE5',
      glow: '#A45EE5',
    },
    description:
      'Syndicate Initiative is a community of gamers focused on good vibes and competitive gaming in the developing web3 space. We coach eSports players and stream content on Twitch. Let’s build SyNi together and make a name in the web3 gaming space! #SyNi',
    hero: 'logos/syndicate-initiative-hero.png',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.twitch.tv/syndicateinitiative',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/ItzSyNi',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/E2E6eFWV5T',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['7Rinf5mQGHccRnxE6J2p2xNFjpNCh4sgVdpsiyQ9NRHc'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  // tag: {
  //   name: 'tag',
  //   displayName: 'Trading Apes Gang',
  //   type: 'Guild',
  //   websiteUrl: 'https://tradingapesgang.com/',
  //   logoImage: '/logos/tag.png',
  //   hero: '/logos/tag-hero.png',
  //   colors: {
  //     accent: '#FF080B',
  //     glow: '#FF080B',
  //   },
  //   description:
  //     'Trading Apes Gang is a Revenue Sharing project. 500 Miscreant Trading Apes competing in NFT trading competitions, All TAG NFTs with Scalp Empire access, Create Your Own Raffle Site, CoinFlip game live! Weekly competitions for SOL!',
  //   twitterHandle: '@tradingapesgang',
  //   socialLinks: [
  //     {
  //       icon: 'web',
  //       link: 'https://tradingapesgang.com/',
  //     },
  //     {
  //       icon: 'twitter',
  //       link: 'https://twitter.com/TradingApesGang',
  //     },
  //     {
  //       icon: 'discord',
  //       link: 'https://discord.gg/9QPKxnyKbq',
  //     },
  //   ],
  //   filter: {
  //     type: 'issuer',
  //     value: ['8FkMivDfqqFLH3eRBnJ8krkbQemUfDthLcTXjwSqkQee'],
  //   },
  //   rentalCard: {
  //     invalidators: ['rate'],
  //     invalidationOptions: {
  //       visibilities: ['public', 'private'],
  //       durationOptions: ['hours', 'days', 'weeks'],
  //       invalidationTypes: ['reissue', 'return'],
  //       paymentMints: [
  //         WRAPPED_SOL_MINT,
  //         'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
  //       ],
  //       showClaimRentalReceipt: false,
  //       setClaimRentalReceipt: false,
  //       maxDurationAllowed: {
  //         displayText: '4 weeks',
  //         value: 2419200,
  //       },
  //     },
  //   },
  // },
  droidcapital: {
    name: 'droidcapital',
    displayName: 'Droid Capital',
    type: 'Guild',
    websiteUrl: 'https://droidcapital.net/',
    logoImage: '/logos/droid.png',
    hero: '/logos/droid-hero.png',
    colors: {
      accent: '#981F2B',
      glow: '#981F2B',
    },
    description:
      'Droid Capital is a cross-chain hive, HQ, and home base for ALL entrepreneurial-degen-big-brains. We are an NFT based, 100% DAO managed "VC firm”',
    twitterHandle: '@droidcapital',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://droidcapital.net/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/droidcapital',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/droid',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['35qpvWNknAxGj5BEBjcUnNybYXdnNvGbuvWJS2rpaXMZ'],
    },
    rentalCard: {
      invalidators: ['rate'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        paymentMints: [
          WRAPPED_SOL_MINT,
          'GkywroLpkvYQc5dmFfd2RchVYycXZdaA5Uzix42iJdNo',
        ],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '2 weeks',
          value: 1209600,
        },
      },
    },
  },
  metakitchen: {
    name: 'metakitchen',
    displayName: 'MetaKitchen',
    type: 'Guild',
    websiteUrl: 'https://metakitchen.io/',
    logoImage: '/logos/metakitchen.png',
    hero: '/logos/metakitchen-hero.png',
    colors: {
      accent: '#E7001B',
      glow: '#E7001B',
    },
    description:
      'metaKitchen bridges the digital and physical world of food into a Game-Fi ecosystem built for chefs, home cooks, and gamers. Through our love of food we are uniting the industry in a fully integrated culinary web3 platform.',
    twitterHandle: '@meta_Kitchen',
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.gg/ayTcwAeQpW',
      },
      {
        icon: 'web',
        link: 'https://metakitchen.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/meta_Kitchen',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['EFNxcRU6eidLMaVj7ZL5ikA6BqaXWYpEhaGa2hQvFAV3'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          WRAPPED_SOL_MINT,
          '7BPCwgL97UMWcSuyUmDdNTzGnDvruyfGKTmUaSbLzohP',
        ],
      },
    },
  },
  soliendao: {
    name: 'soliendao',
    displayName: 'Solien DAO',
    type: 'Guild',
    websiteUrl: 'https://www.solien.io/',
    logoImage: '/logos/soliendao.png',
    hero: '/logos/soliendao-hero.png',
    colors: {
      accent: '#FCB316',
      glow: '#FCB316',
    },
    description:
      'NFT collection of Extraterrestrial mugshots which serve as entry key to a DAO focusing heavily on investment in metaverse assets and the broader Solana Ecosystem.',
    twitterHandle: '@SolienDAO',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.solien.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/SolienDAO',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/ZZSvwqr4Mb',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['Dp32k9fx6mDo7FnvGaqaPDHX9fPEQXyYKUevjrypGkF8'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'C5EefTmWXHJWFkN3Dh7QyFUnBG3UXSu8h6qVs6xtaLxy',
          WRAPPED_SOL_MINT,
        ],
        maxDurationAllowed: {
          displayText: '6 weeks',
          value: 3629000,
        },
      },
    },
  },
  degenclub15k: {
    name: 'degenclub15k',
    displayName: 'Degen Club 15K',
    type: 'Guild',
    websiteUrl: 'https://15k.io/',
    logoImage: '/logos/degenclub15k.jpg',
    hero: '/logos/degenclub15k-hero.jpg',
    colors: {
      accent: '#000000',
      glow: '#FCB316',
    },
    description:
      'Use your $DEGEN to rent all sorts of NFTs from utilities to DAO experiences.',
    twitterHandle: '@degenclub15k',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://15k.io',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/degenclub15k',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/hKpfQgqq55 ',
      },
    ],
    filter: {
      type: 'issuer',
      value: [
        '28tptyJPvYe2L7Vsa26TWHH9tMP7zggAhX9QZFFe1yNE',
        'BVqSXB3aTGx2GggpKdgrnrn9oJ8ZTTayRQ929M5BCVFv',
        'FzQYfytjijjig1Pgi2RSjJNiBPWj7GVZiMaQHdcYPAuC',
        'AbSuREsMWSgMMenrNvhi5bqqX2EsXMUxxfwb5KsoTSJd',
        '8kZyNhJK3sN5a6xA9WqYe6A84yo7hKpNKzFPSEo5H21S',
        '3TWM36M2SVG53Cw66vXr4zkfesi32cRPfeLTkufnTkJk',
        '6qasrabZgKbbtjkK4aH5adKTdcxoBxUfWLV2jeQuFUKE',
        '6e2mfLoSqs88ayPUcka3SY2dnmWVo2M4mVMwaMWaWcfi',
        'CB8auVbVBaaXjMdiDKobRAF8BfkKBLhYZb9jsQRS5kBJ',
        '5fF2tvUq3kSDGr44ZnDtjVnV6zn252oqsSfi7rn3xTxg',
        'B6az21BArGvkdyfCLnR5nNwKSYvk93uquw8zEKtvDGa6',
        '5EiH8hMjiiGHd1Sav1rWKipEPsk6ZVK3kENL8BH9Yo8S',
        'BusoGtFtrTWiKTvGE1rUs5FLGCNGwRtTAdP6SALS1Jad',
        '34R8ENDfgCfyRptevsrNRPu6V4nEYySSf2M89D9oXe5v',
        'DZ2thmD1VzBSRNW7khDSq6MU54fCXjKRWGjYvNsCQUqf',
        'JCD5sjv1AhZDAy9h55X3ydmeNyj6rY86GhD8QoNHyRgE',
        '4M6gvAVAe6v4MeoJ3es31WnJ2o7WwQz5KQNCzuAFWZyr',
        '6ofTiwx3RXjAhQMCHr3kJ9TJwYmetnftq5qvXvdKzZXs',
        '5DjHVTpxEv5WEDUNyRkXsYNW7YqaWCML51tHNkkPvJSv',
        '67DA3tdCja8k3jiNR5Pg1DHgjLzzWRAL3PcaYDrTwLBB',
        '1fPd2n7qginHH3kraJ6XTevL9Xz3fEqdNxX2AmVz1Qp',
        '52NGmDPxwFZiYWqGHAye33iFKNdpXLwACqmwtLGwbnMD',
      ],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'Gbi4F6tEUz7sucsUfyjS28W5Ssd8jiGgdw6hB8XZGJke',
          WRAPPED_SOL_MINT,
        ],
      },
    },
  },
  pixelguild: {
    name: 'pixelguild',
    displayName: 'Pixel Guild',
    type: 'Guild',
    websiteUrl: 'https://pixelguild.gg/',
    logoImage: '/logos/pixelguild.gif',
    hero: '/logos/pixelguild-hero.gif',
    colors: {
      accent: '#F5AF40',
      glow: '#8c7b7f',
    },
    description:
      "Solana's First P2E Action Platformer. Immerse yourself in a brand new Web 3 gaming experience with Heroes, Spells and Monsters accompanied by fantastic gameplay and a mystical soundtrack.",
    twitterHandle: '@PixelGuild_SOL',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://pixelguild.gg/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/PixelGuild_SOL',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/pixelguild',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['FwSbBiWbXBgVvRvZ4FqXQ6qAxmTZaWRNabuH9j6n1Jie'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'BsYZmmEXPVPA31aax5pawZtYppoGiowPckxTcituaUCY',
          WRAPPED_SOL_MINT,
        ],
      },
    },
  },
  ['goodapedao']: {
    name: 'goodapedao',
    displayName: 'Good Ape Dao',
    type: 'Guild',
    websiteUrl: 'https://discord.gg/goodapedao',
    logoImage: '/logos/good-ape-dao.png',
    hero: '/logos/good-ape-dao-hero.png',
    colors: {
      accent: '#FFD700',
      glow: '#FFD700',
    },
    description: 'GOOD APE DAO',
    twitterHandle: '@GAD_IH',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://discord.gg/goodapedao',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/GAD_IH',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/goodapedao',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['2kL7xAqUnimT1FDa5QqQHTKv6eHS7aAm2MsqCmB2NEhC'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['2x21ucCAxvWCVHVnGd71DNmZsWJ2yp3bETNF3Uty7Evh'],
        maxDurationAllowed: {
          displayText: '4 weeks',
          value: 86400 * 7 * 4,
        },
      },
    },
  },
  bigduckmedia: {
    name: 'bigduckmedia',
    displayName: 'Big Duck Media',
    type: 'Guild',
    websiteUrl: 'https://bigduckmedia.store',
    logoImage: '/logos/bigduckmedia.png',
    hero: '/logos/bigduckmedia-hero.png',
    colors: {
      accent: '#1f1f21',
      glow: '#e3fc01',
    },
    description:
      "Solana's First P2E Action Platformer. Immerse yourself in a brand new Web 3 gaming experience with Heroes, Spells and Monsters accompanied by fantastic gameplay and a mystical soundtrack.",
    twitterHandle: '@BigDuckMedia',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://bigduckmedia.store',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/BigDuckMedia',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/cDXqHbcwP7',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['8wF44TUzf4VENHghJoyy9w4Dv4sFE84kfBDCqUshU27U'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          '2YJH1Y5NbdwJGEUAMY6hoTycKWrRCP6kLKs62xiSKWHM',
          WRAPPED_SOL_MINT,
        ],
        maxDurationAllowed: {
          displayText: '2 weeks',
          value: 1296000,
        },
      },
    },
  },
  degenvampires: {
    name: 'degenvampires',
    displayName: 'Degen Vampies',
    type: 'Guild',
    websiteUrl: 'https://twitter.com/DegenVampires',
    logoImage: '/logos/degenvampires.png',
    hero: '/logos/degenvampires-hero.png',
    colors: {
      accent: '#aa2f49',
      glow: '#aa2f49',
    },
    description:
      'Degen Vampires is a collection of 3333 vamps & bringing new values to tokenomics with $Blood. Strong community building from nothing & only getting stronger.',
    twitterHandle: '@DegenVampires',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/DegenVampires',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/DegenVampires',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/yaSusknMND',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['3TGQmQrRr6yEgPR2BmSvaHubLyfXjyPXsKgGgVF8cp9Z'],
    },
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        paymentMints: ['HMUcxWNfogJ6m5ogFryyiuqrQDXf1nSgV9wZgtnbtcwJ'],
        maxDurationAllowed: {
          displayText: '3 days',
          value: 259200,
        },
      },
    },
  },
  ['ghost-kid-dao']: {
    name: 'ghost-kid-dao',
    displayName: 'Ghost Kid DAO',
    type: 'Guild',
    websiteUrl: 'https://ghostkid.io',
    logoImage: '/logos/ghost-kid-dao.png',
    hero: '/logos/ghost-kid-dao-hero.png',
    colors: {
      accent: '#9b51ff',
      glow: '#9b51ff',
    },
    description: 'We are coming from the shadows',
    twitterHandle: '@GhostKidDAO',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://ghostkid.io',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/GhostKidDAO',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/ghostkiddao',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['GkDKTomikDzJMLupsWCuSFqb6A5sap3jHhYuPXFBXsmR'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['boooCKXQn9YTK2aqN5pWftQeb9TH7cj7iUKuVCShWQx'],
      },
    },
  },
  ['unfrgtn-orbit']: {
    name: 'unfrgtn-orbit',
    displayName: 'Unfrgtn Orbit',
    type: 'Guild',
    websiteUrl: 'https://unfrgtn.space/',
    logoImage: '/logos/unfrgtn-orbit.png',
    hero: '/logos/unfrgtn-orbit-hero.png',
    colors: {
      accent: '#57009a',
      glow: '#57009a',
    },
    description:
      '2121 high rewarding UFOs on a mission to abduct the #Solana blockchain!🛸',
    twitterHandle: '@UnfrgtnOrbit',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://unfrgtn.space/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/UnfrgtnOrbit',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/U2RQ8tZvV9',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['FAik6Utptqgd6skopVBt6ZLRULPwXCCJ2JTVQ8NWccfT'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['3TMxuBEMAV3BQunMBrFtKf8UQT2LmJchVbnV2o2ddkZU'],
      },
    },
  },
  solset: {
    name: 'solset',
    displayName: 'Solset',
    type: 'Guild',
    websiteUrl: 'https://solset.io',
    logoImage: '/logos/solset.png',
    hero: '/logos/solset-hero.png',
    colors: {
      accent: '#FCB316',
      glow: '#FCB316',
    },
    description:
      'Solset.io is a plug and play experience that works out of the box and offers sniping speed and precision with a simple and effective user interface. Set your snipes and forget about them until you get notified about your purchases through telegram. Welcome to the new breed of on chain snipers on Solana, welcome to Solset.io.',
    twitterHandle: '@solset_io',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://solset.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/solset_io',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/solset ',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['SLSETzAUois5Wfy1jAxEDPkWiwmLgRcsDSUV6GRGoR2'],
    },
    rentalCard: defaultRentalCardConfig,
  },
  zalez: {
    name: 'zalez',
    displayName: 'Zalez',
    type: 'Guild',
    websiteUrl: 'https://zalezlabs.com/',
    logoImage: '/logos/zalez.png',
    hero: '/logos/zalez-hero.png',
    colors: {
      accent: '#594a7d',
      glow: '#594a7d',
    },
    description: `We are surfer on internet, brand for community!. built by @zalezlabs. Join the beach! Surf on #Solana`,
    twitterHandle: '@zalez_ale',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://zalezlabs.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/zalez_ale',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/2WXNRpR6tC',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['A9Tcy6BHrqu5WhuDAcDN8Rhj9vpQtEG5EkyBiHr4vyiX'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          '8qyhuqWvBKYn2FT19G41rwK6WAC6PMsAvQpXUihEwLAa',
          WRAPPED_SOL_MINT,
        ],
      },
    },
  },
  radrugs: {
    name: 'radrugs',
    displayName: 'RadRugs',
    type: 'Guild',
    websiteUrl: 'https://radrugs.io/',
    logoImage: '/logos/radrugs.png',
    hero: '/logos/radrugs-hero.png',
    colors: {
      accent: '#A755D9',
      glow: '#A755D9',
    },
    description: `5,555 uniquely generated rad rugs that decided to right some wrongs! Our collection gives you access to an exclusive NFT security platform and unlocks premium features in our ecosystem.`,
    twitterHandle: '@radrugs_io',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://radrugs.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/radrugs_io',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/Q9SU49mD8Q',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['BF7JkqSsujLRjxAWG2qkqe5UThNcQ4B4fhPdX3SFPNg7'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['E4DRAz5D9iMND9PJ7tq1HQbZPxavDWHxmeizUtk68o8S'],
      },
    },
  },
  ['goblin-games']: {
    name: 'goblin-games',
    displayName: 'Goblin Games',
    badges: [{ badgeType: 'recent' }],
    type: 'Guild',
    websiteUrl: 'play.goblingames.io',
    logoImage: '/logos/goblin-games.gif',
    hero: '/logos/goblin-games-hero.png',
    colors: {
      accent: '#72d325',
      glow: '#72d325',
    },
    description: `Kingpins own everything.`,
    twitterHandle: '@goblingamesio',
    socialLinks: [
      {
        icon: 'web',
        link: 'play.goblingames.io',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/goblingamesio',
      },
      {
        icon: 'discord',
        link: 'https://discord.com/invite/VAPFyjv7PY',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['7hvDowJ52oc7qe9oXVFKhFWRonyURt6AWZrDY7Tvgt33'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'HGWt5FhgBXTHwNgMK4Zuj8gBaJS3om77Te3CpUDiY4cZ',
          'So11111111111111111111111111111111111111112',
        ],
      },
    },
  },
  caveworld: {
    name: 'caveworld',
    displayName: 'CaveWorld',
    type: 'Guild',
    badges: [{ badgeType: 'recent' }],
    websiteUrl: 'https://radrugs.io/',
    logoImage: '/logos/caveworld.png',
    hero: '/logos/caveworld-hero.png',
    colors: {
      accent: '#F7D159',
      glow: '#F7D159',
    },
    description: `Caveworld is an immersive turn based battle game where players can fight one another, strategically using an assortment of abilities and items. As players level-up, they get increasingly stronger and more valuable rewards which can be used to defeat their opponent or traded on the marketplace.`,
    twitterHandle: '@TheCavemenClub',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://www.caveworld.com/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/TheCavemenClub',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/caveworld',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['7gbxCxJkWcop1FCoaHnB6JJaRjpnkMxJFNbqtTS8KJbD'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          '4SZjjNABoqhbd4hnapbvoEPEqT8mnNkfbEoAwALf1V8t',
          'So11111111111111111111111111111111111111112',
        ],
      },
    },
  },
  ['degen-district']: {
    name: 'degen-district',
    displayName: 'Degen District',
    type: 'Guild',
    badges: [{ badgeType: 'recent' }],
    websiteUrl: 'https://twitter.com/Degen_District',
    logoImage: '/logos/degen-district.png',
    hero: '/logos/degen-district-hero.jpeg',
    colors: {
      accent: '#e28743',
      glow: '#e28743',
    },
    description: `From Districts to POOLs now Degens learn how to swim with big sharks and whales.`,
    twitterHandle: '@Degen_District',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://twitter.com/Degen_District',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/Degen_District',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/TS7UtEhP',
      },
    ],
    filter: {
      type: 'issuer',
      value: [
        '5PX4iGqffGLNV6S9XPeqgSPCdGKKu53WhbHV7rxVFhsi',
        '9JVT2QsoDA9cDgBu2VPSuKA8LtRmXorZ7t6LpouUxkPo',
      ],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: [
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
          WRAPPED_SOL_MINT,
        ],
      },
    },
  },
  astrals: {
    name: 'astrals',
    displayName: 'Astrals',
    badges: [{ badgeType: 'recent' }],
    type: 'Guild',
    websiteUrl: 'https://astralsnft.io/',
    logoImage: '/logos/astrals.png',
    hero: '/logos/astrals-hero.png',
    colors: {
      accent: '#01215E',
      glow: '#01215E',
    },
    description: `Astrals has evolved beyond just one collection of the original 10,000. Ours is an ever growing Galaxy. New content and new additions are being added as we expand from 10,000 Astrals and embark on a journey to the far outer reaches of our universe.`,
    twitterHandle: '@Astrals_NFT',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://astralsnft.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/Astrals_NFT',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/astralsnft',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['B9REbEXGse3JD2EtypAt2rDwPniA57AtPMCQ8n4WfYnK'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
        paymentMints: ['CJ5U6wPmjxFUyTJpUTS7Rt1UqhTmSVRMvmJ8WD4nndXW'],
      },
    },
  },
  // sorcery: {
  //   name: 'sorcery',
  //   displayName: 'Sorcery Inc.',
  //   badges: [{ badgeType: 'recent' }],
  //   type: 'Guild',
  //   websiteUrl: 'https://sorcery.inc',
  //   logoImage: '/logos/sorcery.png',
  //   hero: '/logos/sorcery-hero.png',
  //   colors: {
  //     accent: '#973872',
  //     glow: '#973872',
  //   },
  //   description: `Sorcery is a wizard academy with magical spells and tools powered by $LUV.`,
  //   twitterHandle: '@sorcery_inc',
  //   socialLinks: [
  //     {
  //       icon: 'web',
  //       link: 'https://sorcery.inc',
  //     },
  //     {
  //       icon: 'twitter',
  //       link: 'https://twitter.com/sorcery_inc',
  //     },
  //     {
  //       icon: 'discord',
  //       link: 'https://discord.gg/sorcery',
  //     },
  //   ],
  //   filter: {
  //     type: 'issuer',
  //     value: [''],
  //   },
  //   rentalCard: {
  //     ...defaultRentalCardConfig,
  //     invalidationOptions: {
  //       ...defaultRentalCardConfig.invalidationOptions,
  //       paymentMints: ['J8taaG2MEBQruGWE4Hhzkrahb1nMAeSZUYBs5cmzST9k'],
  //     },
  //   },
  // },
  blxckout: {
    name: 'blxckout',
    displayName: 'BLXCKOUT: NXDE RENTAL',
    badges: [{ badgeType: 'recent' }],
    type: 'Guild',
    websiteUrl: 'https://docs.blxckout.xyz',
    logoImage: '/logos/blxckout.png',
    hero: '/logos/blxckout-hero.png',
    colors: {
      accent: '#3D2546',
      glow: '#3D2546',
    },
    description: `Rent access to 3 x top spec RPC nodes in a highly redundant setting for 1 year. No monthly subscription. Can be used for building Solana products, sniping and botting. A product from BLXCKOUT.`,
    twitterHandle: '@TheNxde',
    socialLinks: [
      {
        icon: 'web',
        link: 'https://docs.blxckout.xyz',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/TheNxde',
      },
      {
        icon: 'discord',
        link: 'https://discord.gg/6CvQNSU3hq',
      },
    ],
    filter: {
      type: 'issuer',
      value: ['H6uhkNstMRG38VsTjUNRJEZbVHxHqh4cVoM38UuSh9Hn'],
    },
    rentalCard: {
      ...defaultRentalCardConfig,
      invalidationOptions: {
        ...defaultRentalCardConfig.invalidationOptions,
      },
    },
  },
}
