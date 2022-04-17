import type { AirdropMetadata } from 'common/Airdrop'
import type { RentalCardConfig } from 'rental-components/components/RentalCard'

export type Colors = {
  main: string
  secondary: string
}

export type ProjectConfig = {
  issuer?: {
    publicKeyString?: string
  }
  name: string
  websiteUrl: string
  logoImage: string
  colors: Colors
  disableListing?: boolean
  filters: { type: string; value: string }[]
  rentalCard: RentalCardConfig
  airdrops?: AirdropMetadata[]
  browse?: {
    hideFilters?: boolean
  }
}

export const projectConfigs: { [key: string]: ProjectConfig } = {
  default: {
    name: 'default',
    websiteUrl: 'https://cardinal.so',
    logoImage: 'https://main.cardinal.so/assets/cardinal-titled.png',
    colors: {
      main: 'rgba(0, 0, 0, 0)',
      secondary: 'rgb(29, 155, 240)',
    },
    filters: [],
    rentalCard: {
      invalidators: ['duration', 'usages', 'expiration', 'manual'],
      extensionOptions: { showDisablePartialExtension: true },
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
    websiteUrl: 'https://theportal.to/',
    logoImage: './logos/portals.svg',
    colors: {
      main: 'rgb(0,0,0)',
      secondary: 'rgb(128,221,239)',
    },
    filters: [
      {
        type: 'creators',
        value: 'GdtkQajEADGbfSUEBS5zctYrhemXYQkqnrMiGY7n7vAw',
      },
      {
        type: 'symbol',
        value: 'PRTL',
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
  },
  monke: {
    name: 'monke',
    websiteUrl: 'https://market.solanamonkey.business/',
    logoImage: 'https://market.solanamonkey.business/logo/smb-market.svg',
    colors: {
      main: '#202225',
      secondary: '#0ea5e9',
    },
    filters: [
      {
        type: 'creators',
        value: '9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F',
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
        value: '9yz273zB6rQHyptbSpVvC75o4G17NwJrTk4u2ZiNV3tZ',
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
      },
    },
  },
}
