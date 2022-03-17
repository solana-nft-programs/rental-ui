import { GetServerSideProps } from 'next'
import { RentalCardConfig } from 'rental-components/components/RentalCard'

export const getProjectConfig: GetServerSideProps = async (context) => {
  const projectParams = context.query.project || context.req.headers.host
  const project =
    projectParams &&
    (typeof projectParams == 'string' ? projectParams : projectParams[0])
      ?.split('.')[0]
      ?.replace('dev-', '')

  const config = project ? projectConfigs[project] : projectConfigs['default']!
  return {
    props: {
      config: config,
    },
  }
}

export type Colors = {
  main: string
  secondary: string
}

export type ProjectConfig = {
  name: string
  websiteUrl: string
  logoImage: string
  colors: Colors
  filters: { type: string; value: string }[]
  rentalCard: RentalCardConfig
}

export const projectConfigs: { [key: string]: ProjectConfig } = {
  default: {
    name: 'cardinal',
    websiteUrl: 'https://cardinal.so',
    logoImage: 'https://main.cardinal.so/assets/cardinal-titled.png',
    colors: {
      main: 'rgba(0, 0, 0, 0.15)',
      secondary: 'rgb(29, 155, 240)',
    },
    filters: [],
    rentalCard: {
      invalidations: {
        showUsagesOption: true,
        showExpirationOption: true,
        showDurationOption: true,
        showManualOption: true,
      },
    },
  },
  portals: {
    name: 'portals',
    websiteUrl: 'https://theportal.to/',
    logoImage:
      'https://pbs.twimg.com/profile_images/1496665887041994755/GlWexgQC_400x400.jpg',
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
      invalidations: {
        showUsagesOption: false,
        showExpirationOption: true,
        showDurationOption: true,
        showManualOption: true,
      },
      invalidationOptions: {
        durationCategories: [
          'Minutes',
          'Hours',
          'Days',
          'Weeks',
          'Months',
          'Years',
        ],
        invalidationCategories: ['Return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: true,
      },
    },
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
      invalidations: {
        showUsagesOption: false,
        showExpirationOption: true,
        showDurationOption: true,
        showManualOption: true,
      },
      invalidationOptions: {
        durationCategories: ['Hours', 'Days', 'Weeks', 'Years'],
        invalidationCategories: ['Return'],
        paymentMints: ['So11111111111111111111111111111111111111112'],
        setClaimRentalReceipt: true,
        showClaimRentalReceipt: false,
      },
    },
  },
}
