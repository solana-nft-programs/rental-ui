import type { AirdropMetadata } from 'common/Airdrop'
import type {
  DurationOption,
  RentalCardConfig,
} from 'rental-components/components/RentalCard'

export type Colors = {
  main: string
  secondary: string
}

export type ProjectConfig = {
  type: 'Collection' | 'Guild'
  issuer?: {
    publicKeyString?: string
  }
  name: string
  websiteUrl: string
  logoImage: string
  colors: Colors
  disableListing?: boolean
  filters: {
    type: 'creators' | 'symbol' | 'issuer'
    value: string | string[]
  }[]
  rentalCard: RentalCardConfig
  airdrops?: AirdropMetadata[]
  browse?: {
    hideFilters?: boolean
  }
  marketplaceRate?: DurationOption
}

export const projectConfigs: { [key: string]: ProjectConfig } = {
  default: {
    name: 'default',
    type: 'Collection',
    websiteUrl: 'https://cardinal.so',
    logoImage: 'https://main.cardinal.so/assets/cardinal-titled.png',
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: 'rgb(29, 155, 240)',
    },
    filters: [],
    rentalCard: {
      invalidators: ['duration', 'usages', 'expiration', 'manual'],
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
  vault: {
    name: 'vault',
    type: 'Collection',
    websiteUrl: 'https://cardinal.so',
    logoImage: 'https://main.cardinal.so/assets/cardinal-titled.png',
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: 'rgb(29, 155, 240)',
    },
    filters: [],
    rentalCard: {
      invalidators: ['duration', 'usages', 'expiration', 'manual'],
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
    type: 'Collection',
    websiteUrl: 'https://cardinal.so',
    logoImage: './logos/all.svg',
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: 'rgb(29, 155, 240)',
    },
    filters: [],
    rentalCard: {
      invalidators: ['duration', 'usages', 'expiration', 'manual'],
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
  portals: {
    name: 'portals',
    type: 'Collection',
    websiteUrl: 'https://theportal.to/',
    logoImage: './logos/portals.svg',
    colors: {
      main: 'rgb(0,0,0)',
      secondary: 'rgb(128,221,239)',
    },
    filters: [
      {
        type: 'creators',
        value: ['5grvMeoBqv5ZdHq9JMy5RrxLPNAt1nzc9cpqYWFUwizz'],
      },
      {
        type: 'symbol',
        value: 'PRTL',
      },
    ],
    rentalCard: {
      invalidators: ['rate'],
      invalidationOptions: {
        freezeRentalDuration: {
          value: '1',
          durationOption: 'days',
        },
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['return'],
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
    marketplaceRate: 'weeks',
  },
  monke: {
    name: 'monke',
    type: 'Collection',
    websiteUrl: 'https://market.solanamonkey.business/',
    logoImage: 'https://market.solanamonkey.business/logo/smb-market.svg',
    colors: {
      main: '#202225',
      secondary: '#0ea5e9',
    },
    filters: [
      {
        type: 'creators',
        value: ['9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F'],
      },
      {
        type: 'symbol',
        value: 'SMB',
      },
    ],
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['return'],
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
  },
  br1: {
    name: 'br1',
    type: 'Collection',
    websiteUrl: 'https://www.br1game.com/',
    logoImage:
      'https://static.wixstatic.com/media/a5e645_ede493815397419cad3c618bd7cb4aa4~mv2.png/v1/fill/w_888,h_390,al_c,usm_0.66_1.00_0.01,enc_auto/Artboard%202%20copy%204-1.png',
    colors: {
      main: 'rgb(0,0,0)',
      secondary: 'rgb(169,60,239)',
    },
    filters: [
      {
        type: 'creators',
        value: [
          '9yz273zB6rQHyptbSpVvC75o4G17NwJrTk4u2ZiNV3tZ',
          'BTzGQ6yk1uFN9q9Po3LGSvmZ3dxq8nf8WPwr4D12APxo',
        ],
      },
      {
        type: 'symbol',
        value: 'BR1',
      },
    ],
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        invalidationTypes: ['return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
  },
  defiland: {
    name: 'defiland',
    type: 'Collection',
    websiteUrl: 'https://www.defiland.app/',
    logoImage: 'https://defiland.app/_nuxt/img/defiland.74b3850.svg',
    colors: {
      main: '#2d1923',
      secondary: '#ad4933',
    },
    filters: [
      {
        type: 'creators',
        value: [
          '4exgPiVhpromTi8duBsMnscoodAjU1as13s1AXZGsGHP', // harvester
          '3XE8DuYzqZLKr1XqXrvADRTxXWL91KuakqsKfD3cYoLP', // gun
          '5XTbjtKM1whecjXMMdDUz3BzWqEDRuJxTRPX3xTF1qmG',
          'Ajp7uzkyPUU35pGdkjZd9Gbe4zgDQXterWY8ZzvP4sCk', // boat
          '8m4TTZz3RsDVakDSwn7T89GyButxLiMqn2zq7DWfANu7', // cat, cow, dog
        ],
      },
    ],
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        invalidationTypes: ['return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
  },
  metaops: {
    name: 'metaops',
    type: 'Collection',
    websiteUrl: 'https://metaopsgaming.com/',
    logoImage: './logos/metaops.png',
    colors: {
      main: '#544046',
      secondary: '#e24040',
    },
    filters: [
      {
        type: 'creators',
        value: [
          'GU2nTh3aWQz4AA8Gaih5AmV8WmKt3Y8P6iwy5t9347h',
          '8CWFS9nzXtLd3LGE3GaSLYTAEUzkAoUPwmtq32nJFkSZ',
          'HMduKVo3A19U5EpQdEhPjo9hq9zfZXn8aGVYZp7Vc7fX',
        ],
      },
    ],
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        durationOptions: ['hours', 'days', 'weeks', 'years'],
        invalidationTypes: ['return'],
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
  },
  ['all-starz']: {
    name: 'all-starz',
    type: 'Guild',
    websiteUrl: 'https://all-starz.gitbook.io/all-starz/',
    logoImage:
      'https://pbs.twimg.com/profile_images/1514813811571630085/18p6C0YJ_400x400.jpg',
    colors: {
      main: '#000',
      secondary: '#f71202',
    },
    filters: [
      { type: 'issuer', value: 'Cx2FDbdfqezYiN8teLFdFAzdv9mwG48uYbe218Az4EMP' },
    ],
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
  },
  ['3dgamersguild']: {
    name: '3dgamersguild',
    type: 'Guild',
    websiteUrl: 'https://www.3dgamersguild.com/',
    logoImage:
      'https://images.squarespace-cdn.com/content/v1/618b2aec73c8ed19abf2fd2f/c4a759b4-91d5-462a-bd6d-ce3766ffda2f/3D+Gamers+Logo+with+white+letters+white+text.png?format=1500w',
    colors: {
      main: 'rgb(26, 27, 32)',
      secondary: '#34659b',
    },
    filters: [
      { type: 'issuer', value: '9qoRqZmrAf6bqtmTAPA1UkgCRvKuaugF17xBdympy1vd' },
    ],
    rentalCard: {
      invalidators: ['duration'],
      invalidationOptions: {
        visibilities: ['public'],
        durationOptions: ['minutes', 'hours', 'days', 'weeks'],
        invalidationTypes: ['return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        showClaimRentalReceipt: false,
        setClaimRentalReceipt: false,
        maxDurationAllowed: {
          displayText: '12 weeks',
          value: 7258000,
        },
      },
    },
  },
}
