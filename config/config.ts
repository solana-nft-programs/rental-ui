import type { TokenData } from 'api/api'
import type { AirdropMetadata } from 'common/Airdrop'
import type { IconKey } from 'common/Socials'
import type {
  DurationOption,
  RentalCardConfig,
} from 'rental-components/components/RentalCard'

import type { UserTokenData } from '../hooks/useUserTokenData'

export const COLORS = {
  primary: '#907EFF',
  secondary: '#7EFFE8',
  accent: '#CE81F4',
  'light-0': '#FFFFFF',
  'light-1': '#F5E2FF',
  'light-2': '#B1AFBB',
  'medium-3': '#8D8B9B',
  'medium-4': '#6D6C7C',
  'dark-5': '#0B0B0B',
  'dark-6': '#000000',
}

export type Colors = {
  main: string
  secondary: string
  accent?: string
}

export type TokenFilter = {
  type: 'creators' | 'symbol' | 'issuer' | 'state' | 'claimer' | 'owner'
  value: string[]
}

export type TokenSection = {
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
  issuer?: {
    publicKeyString?: string
  }
  hidden?: boolean
  indexDisabled?: boolean
  issuedOnly?: boolean
  name: string
  displayName: string
  websiteUrl: string
  hero?: string
  description?: string
  socialLinks?: {
    icon: IconKey
    link: string
  }[]
  logoImage: string
  colors: Colors
  badges?: Badge[]
  disableListing?: boolean
  filter?: TokenFilter
  sections?: TokenSection[]
  rentalCard: RentalCardConfig
  airdrops?: AirdropMetadata[]
  browse?: {
    hideFilters?: boolean
  }
  showUnknownInvalidate?: boolean
  marketplaceRate?: DurationOption
  allowOneByCreators?: {
    address: string
    enforceTwitter: boolean
    preventMultipleClaims: boolean
    disableReturn: boolean
  }[]
}

export const projectConfigs: { [key: string]: ProjectConfig } = {
  default: {
    name: 'default',
    displayName: 'Default',
    hidden: true,
    type: 'Collection',
    websiteUrl: 'https://cardinal.so',
    logoImage: 'https://main.cardinal.so/assets/cardinal-titled.png',
    colors: {
      main: '#0B0B0B',
      secondary: '#7560FF',
    },
    rentalCard: {
      invalidators: ['duration', 'usages', 'expiration', 'manual', 'rate'],
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
  all: {
    name: 'all',
    displayName: 'All',
    type: 'Collection',
    websiteUrl: 'https://cardinal.so',
    logoImage: '/logos/all.svg',
    issuedOnly: true,
    hidden: true,
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: 'rgb(29, 155, 240)',
    },
    rentalCard: {
      invalidators: ['duration', 'usages', 'expiration', 'manual', 'rate'],
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
    marketplaceRate: 'days',
  },
  parcl: {
    name: 'parcl',
    displayName: 'Homeowner Association (Parcl)',
    type: 'Collection',
    websiteUrl: 'https://www.hoa.house/',
    hero: '/logos/parcl-hero.png',
    description:
      'Homeowners Association (HOA) is an NFT project by Parcl, consisting of 7,777 unique combinations of iconic homes from four unique cities.',
    logoImage: '/logos/parcl.gif',
    colors: {
      main: '#001242',
      secondary: '#5529B7',
    },
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.gg/parcl',
      },
      {
        icon: 'web',
        link: 'https://www.hoa.house/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/parcl',
      },
    ],
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'creators',
      value: ['Cp3Fn6azbwtSG9LV1BWtQcAkQQiaQWDkc2LcqwaEuLuq'],
    },
    rentalCard: {
      paymentManager: 'mainnet-cardinal-mini-royale',
      invalidators: ['rate'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '3 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
    airdrops: [],
  },
  miniroyale: {
    name: 'miniroyale',
    displayName: 'Mini Royale',
    type: 'Collection',
    websiteUrl: 'https://miniroyale.io/',
    hero: '/logos/miniroyale-hero.png',
    description:
      'MiniRoyale is a web browser game with battle royale game mode. The game comes with 3D graphics and unique style.',
    logoImage: '/logos/miniroyale.png',
    colors: {
      main: '#192836',
      secondary: '#FFB60C',
    },
    socialLinks: [
      {
        icon: 'discord',
        link: 'https://discord.com/invite/miniroyale',
      },
      {
        icon: 'web',
        link: 'https://miniroyale.io/',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/MiniNations',
      },
    ],
    badges: [{ badgeType: 'trending' }],
    filter: {
      type: 'creators',
      value: [
        'CbPuZtVMAWwPySvsUAEbZhe8y9rkeAZ5qLhsGBVvtau9',
        'EpgYkzyAXPDq11G5ngctWcjq7pKSfUtEnjVcYPs2jhGY',
        'EoYTpE5HuTaXkN2AWDAgGA3JbhtPdeqnUiY9rdG7hMf',
        '3TVyY5Tw9CuKj7EJwaawacDqBM5jnbeL1kRUvhDPvxH4',
        'GgT69RnQwQhE8cmnTivRHSPfvXwd3HirdbnHQBaHgqwt',
        '4hgG6XRBwGNsFpuCnBJMGi9iQteWmULM4nX6zSsgDKgz',
      ],
    },
    rentalCard: {
      paymentManager: 'mainnet-cardinal-mini-royale',
      invalidators: ['rate'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '3 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
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
  portals: {
    name: 'portals',
    displayName: 'Portals',
    type: 'Collection',
    websiteUrl: 'https://theportal.to/',
    logoImage: '/logos/portals.svg',
    colors: {
      main: '#000',
      secondary: '#80ddef',
    },
    // sections: [
    // {
    //   header: 'Featured',
    //   description: 'Cardinal Room Design Competition',
    //   icon: 'featured',
    //   filter: {
    //     type: 'issuer',
    //     value: ['5grvMeoBqv5ZdHq9JMy5RrxLPNAt1nzc9cpqYWFUwizz'],
    //   },
    // },
    // {
    //   header: 'Listed',
    //   icon: 'listed',
    //   filter: {
    //     type: 'state',
    //     value: [TokenManagerState.Issued.toString()],
    //   },
    // },
    // {
    //   header: 'Claimed',
    //   icon: 'time',
    //   filter: {
    //     type: 'state',
    //     value: [TokenManagerState.Claimed.toString()],
    //   },
    // },
    // ],
    filter: {
      type: 'creators',
      value: ['5grvMeoBqv5ZdHq9JMy5RrxLPNAt1nzc9cpqYWFUwizz'],
    },
    rentalCard: {
      invalidators: ['rate', 'expiration', 'duration', 'manual'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'return'],
        customInvalidationTypes: {
          '41qJ9dJemw8mrry2BD1wU6B2aHXN4RoNY79bS7xwDPhM': ['return'],
        },
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
      paymentManager: 'cprtEVpR3uPs38USVq1MYrPMW7exZTnq2kRNSuvjvYM',
    },
    airdrops: [
      {
        name: 'Portals',
        symbol: 'PRTL',
        uri: 'https://arweave.net/-QsrbBfmFy4Fxp-BtSnSFiajm_KECo5ctRXR6uSBS5k',
      },
      {
        name: 'Portals',
        symbol: 'PRTL',
        uri: 'https://arweave.net/RewRYM3lf-1Ry1hitgsiXuqsuERSujlTAChgl9S483c',
      },
      {
        name: 'Portals',
        symbol: 'PRTL',
        uri: 'https://arweave.net/6ZcTxyREtg0WsOSGSBq-CSyQ3DPlU1k4R_A7mrgehRE',
      },
    ],
    marketplaceRate: 'days',
    // allowOneByCreators: [
    //   {
    //     address: '41qJ9dJemw8mrry2BD1wU6B2aHXN4RoNY79bS7xwDPhM',
    //     enforceTwitter: true,
    //     preventMultipleClaims: true,
    //     disableReturn: false,
    //   },
    // ],
  },
  monke: {
    name: 'monke',
    displayName: 'Monke',
    type: 'Collection',
    websiteUrl: 'https://market.solanamonkey.business/',
    logoImage: '/logos/smb-large.png',
    colors: {
      main: '#202225',
      secondary: '#CCCDFF',
    },
    filter: {
      type: 'creators',
      value: ['9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F'],
    },
    showUnknownInvalidate: true,
    rentalCard: {
      invalidators: ['rate', 'duration', 'manual'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'SMB #1148',
        symbol: 'SMB',
        uri: 'https://arweave.net/c2i2nLtanzMcWqLwFOE9yiwHoJ1WdvJcpdS54drBD9g',
      },
      {
        name: 'SMB #2712',
        symbol: 'SMB',
        uri: 'https://arweave.net/xhUWFiFbhEz6EjzE05XNvYvpP5U43bNRXvtSKku12oA',
      },
      {
        name: 'SMB #931',
        symbol: 'SMB',
        uri: 'https://arweave.net/d8IpVzCnR5sqkmimkbpxUKj4CLiOQl89ASvt6dTTyWA',
      },
      {
        name: 'SMB #1785',
        symbol: 'SMB',
        uri: 'https://arweave.net/JR_l_iOJVvVSiuySnFKsMbDtZ61deFwkr4-wch_TJzc',
      },
    ],
    marketplaceRate: 'days',
  },
  br1: {
    name: 'br1',
    displayName: 'BR1',
    type: 'Collection',
    websiteUrl: 'https://www.br1game.com/',
    logoImage:
      'https://static.wixstatic.com/media/a5e645_ede493815397419cad3c618bd7cb4aa4~mv2.png/v1/fill/w_888,h_390,al_c,usm_0.66_1.00_0.01,enc_auto/Artboard%202%20copy%204-1.png',
    colors: {
      main: 'rgb(0,0,0)',
      secondary: 'rgb(169,60,239)',
    },
    filter: {
      type: 'creators',
      value: [
        '9yz273zB6rQHyptbSpVvC75o4G17NwJrTk4u2ZiNV3tZ',
        'BTzGQ6yk1uFN9q9Po3LGSvmZ3dxq8nf8WPwr4D12APxo',
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  defiland: {
    name: 'defiland',
    displayName: 'Defi Land',
    type: 'Collection',
    websiteUrl: 'https://www.defiland.app/',
    logoImage: 'https://defiland.app/_nuxt/img/defiland.74b3850.svg',
    colors: {
      main: '#2d1923',
      secondary: '#ad4933',
    },
    filter: {
      type: 'creators',
      value: [
        '4exgPiVhpromTi8duBsMnscoodAjU1as13s1AXZGsGHP', // harvester
        '3XE8DuYzqZLKr1XqXrvADRTxXWL91KuakqsKfD3cYoLP', // gun
        '5XTbjtKM1whecjXMMdDUz3BzWqEDRuJxTRPX3xTF1qmG',
        'Ajp7uzkyPUU35pGdkjZd9Gbe4zgDQXterWY8ZzvP4sCk', // boat
        '8m4TTZz3RsDVakDSwn7T89GyButxLiMqn2zq7DWfANu7', // cat, cow, dog
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  metaops: {
    name: 'metaops',
    displayName: 'Meta Ops',
    type: 'Collection',
    websiteUrl: 'https://metaopsgaming.com/',
    logoImage: '/logos/metaops.png',
    colors: {
      main: '#544046',
      secondary: '#e24040',
    },
    filter: {
      type: 'creators',
      value: [
        'HZSQf9Qvdmmn1B5e7YBxWnyoafTUFtqjrw8SqvSRwace',
        'GU2nTh3aWQz4AA8Gaih5AmV8WmKt3Y8P6iwy5t9347h',
        '8CWFS9nzXtLd3LGE3GaSLYTAEUzkAoUPwmtq32nJFkSZ',
        'HMduKVo3A19U5EpQdEhPjo9hq9zfZXn8aGVYZp7Vc7fX',
      ],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'MetaOps PFP #4340',
        symbol: 'MOPFP',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/metaops-assets/jsons/2789.json',
      },
      {
        name: 'MetaOps PFP #5553',
        symbol: 'MOPFP',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/metaops-assets/jsons/3160.json',
      },
      {
        name: 'MetaOps PFP #4699',
        symbol: 'MOPFP',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/metaops-assets/jsons/3102.json',
      },
      {
        name: 'MetaOps PFP #692',
        symbol: 'MOPFP',
        uri: 'https://www.magiceden.io/item-details/4r9jMVm5rXdiCLa2oMLkV2ecL3wmmcoFtsMUJJoum38r',
      },
    ],
    marketplaceRate: 'days',
  },
  psyker: {
    name: 'psyker',
    displayName: 'Psyker',
    type: 'Collection',
    websiteUrl: 'https://psyker.game/',
    logoImage: '/logos/psyker.png',
    colors: {
      main: '#00101b',
      secondary: '#ff0034',
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
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    airdrops: [
      {
        name: 'Keycard #1823',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/1823.json',
      },
      {
        name: 'Keycard #2157',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/2157.json',
      },
      {
        name: 'Keycard #4449',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/4449.json',
      },
      {
        name: 'Keycard #1823',
        symbol: 'PSYKC',
        uri: 'https://storage.googleapis.com/fractal-launchpad-public-assets/psyker-assets/jsons/1823.json',
      },
    ],
    marketplaceRate: 'days',
  },
  thugbirdz: {
    name: 'thugbirdz',
    displayName: 'Thugbirdz',
    type: 'Collection',
    websiteUrl: 'https://www.thugbirdz.com/#/',
    logoImage: 'https://www.thugbirdz.com/icon.png',
    hidden: true,
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: '#9c74fc',
    },
    filter: {
      type: 'creators',
      value: ['CzrE3LhijwcmvsXZa8YavqgR9EzW3UGqoSWZKwGpZVqM'],
    },
    rentalCard: {
      invalidators: ['rate'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
    airdrops: [
      {
        name: 'Thugbirdz',
        symbol: 'THUG',
        uri: 'https://arweave.net/l9VXqVWCsiKW-R8ShX8jknFPgBibrhQI1JRgUI9uvbw',
      },
    ],
  },
  empiredao: {
    name: 'empiredao',
    displayName: 'Empire DAO',
    type: 'Collection',
    websiteUrl: 'https://empiredao.xyz/',
    logoImage: '/logos/empiredao.png',
    colors: {
      main: '#202225',
      secondary: '#CCCDFF',
    },
    indexDisabled: true,
    filter: {
      type: 'issuer',
      value: ['edaoJQRZZ3hfNottaxe9z5o2owJDJgL1bUChiPk15KN'],
    },
    rentalCard: {
      invalidators: ['expiration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '3 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
    airdrops: [],
  },
  degods: {
    name: 'degods',
    displayName: 'DeGods',
    type: 'Collection',
    websiteUrl: 'https://www.degods.com/',
    logoImage: '/logos/degods.svg',
    hidden: true,
    colors: {
      main: '#0F0F0F',
      secondary: '#6001FF',
    },
    filter: {
      type: 'creators',
      value: ['AxFuniPo7RaDgPH6Gizf4GZmLQFc4M5ipckeeZfkrPNn'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        visibilities: ['public'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  monkenftnyc: {
    name: 'monkenftnyc',
    displayName: 'Monke NFT NYC',
    type: 'Collection',
    websiteUrl: 'https://www.empiredao.xyz',
    logoImage: '/logos/monkenftnyc.png',
    hidden: true,
    indexDisabled: true,
    colors: {
      main: '#202225',
      secondary: '#CCCDFF',
    },
    filter: {
      type: 'issuer',
      value: ['mdaoH4C9SBQu2CQqudPbbct4uyo6PRrid1NNZsbSxef'],
    },
    rentalCard: {
      invalidators: ['expiration'],
      invalidationOptions: {
        visibilities: ['public', 'private'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue', 'release'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '3 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
    airdrops: [
      {
        name: 'MonkeDAO NFT NYC Ticket',
        symbol: 'SMBNFT',
        uri: '/metadata/monkenftnyc.json',
      },
    ],
  },
  ['all-starz']: {
    name: 'all-starz',
    displayName: 'All Starz',
    type: 'Guild',
    websiteUrl: 'https://all-starz.gitbook.io/all-starz/',
    logoImage: '/logos/all-starz.jpg',
    colors: {
      main: '#000',
      secondary: '#f71202',
    },
    filter: {
      type: 'issuer',
      value: ['Cx2FDbdfqezYiN8teLFdFAzdv9mwG48uYbe218Az4EMP'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  ['3dgamersguild']: {
    name: '3dgamersguild',
    displayName: '3D Gamers Guild',
    type: 'Guild',
    websiteUrl: 'https://www.3dgamersguild.com/',
    logoImage:
      'https://images.squarespace-cdn.com/content/v1/618b2aec73c8ed19abf2fd2f/c4a759b4-91d5-462a-bd6d-ce3766ffda2f/3D+Gamers+Logo+with+white+letters+white+text.png?format=1500w',
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: '#34659b',
    },
    filter: {
      type: 'issuer',
      value: ['9qoRqZmrAf6bqtmTAPA1UkgCRvKuaugF17xBdympy1vd'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        freezeRentalRateDuration: {
          value: '1',
          durationOption: 'days',
        },
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
  ['udderchaos']: {
    name: 'udderchaos',
    displayName: 'Udder Chaos',
    type: 'Guild',
    websiteUrl: 'https://www.udderchaos.io/',
    logoImage: 'logos/udderchaos-logo.png',
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: '#a5b6f6',
    },
    badges: [{ badgeType: 'recent' }],
    filter: {
      type: 'issuer',
      value: ['F65oeXXQaDQYnmQKTmmMpZ5XaLBzoUC16pMTg59RfpK6'],
    },
    rentalCard: {
      invalidators: ['rate', 'duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['reissue'],
        paymentMints: [
          'MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj',
          'So11111111111111111111111111111111111111112',
        ],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
    marketplaceRate: 'days',
  },
}
