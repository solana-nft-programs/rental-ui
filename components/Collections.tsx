import { css } from '@emotion/react'
import { CollectionsView } from 'common/CollectionsView'
import { FooterSlim } from 'common/FooterSlim'
import { HeaderSlim } from 'common/HeaderSlim'
import { HowItWorks } from 'common/HowItWorks'
import { RentalHero } from 'common/RentalHero'
import type { ProjectConfig } from 'config/config'
import { projectConfigs } from 'config/config'

const categories = Object.entries(projectConfigs).reduce((acc, [, config]) => {
  if (config.hidden) return acc
  return {
    ...acc,
    [config.type]: [...(acc[config.type] || []), config],
  }
}, {} as { [type: string]: ProjectConfig[] })

export const Collections = () => {
  return (
    <div className="bg-dark-5">
      <div
        className="relative z-0"
        css={css`
          background: linear-gradient(180deg, #140a51 0%, #0b0b0b 100%);
        `}
      >
        <div className="blur-4xl absolute left-8 top-52 -z-10 h-[120px] w-[400px] -rotate-[60deg] bg-glow blur-[100px]" />
        <div className="blur-4xl absolute -right-20 top-72 -z-10 h-[100px] w-[550px] -rotate-[60deg] bg-glow blur-[120px]" />
        <HeaderSlim />
        <RentalHero />
      </div>
      <div className="mx-auto px-8 md:px-16">
        {Object.entries(categories).map(([type, configs], i) => (
          <CollectionsView
            key={type}
            configs={configs}
            header={
              i > 0
                ? {
                    title: 'Featured Profiles',
                    description:
                      'Treasuries or guilds listing assets across multiple collections.',
                  }
                : undefined
            }
          />
        ))}
      </div>
      <HowItWorks />
      <FooterSlim />
    </div>
  )
}
