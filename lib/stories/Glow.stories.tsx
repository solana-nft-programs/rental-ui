import type { ComponentMeta, ComponentStory } from '@storybook/react'

import { Card, Glow, Stats } from '../src'

export default {
  title: 'Components/Glow',
  component: Glow,
} as ComponentMeta<typeof Glow>

const Template: ComponentStory<typeof Glow> = (args) => <Glow {...args}></Glow>

export const CardWithGlow = Template.bind({})
CardWithGlow.args = {
  children: (
    <Card
      hero={
        <img
          className="w-full"
          src="https://img-cdn.magiceden.dev/rs:fill:170:170:0:0/plain/https://i.imgur.com/bMH6qNc.png"
          alt="text"
        />
      }
      badge="recent"
      header="SolanaMonkeyBusiness"
      content={
        <Stats
          stats={[
            { header: 'Total listings', value: '1,320' },
            { header: 'Active listings', value: '180' },
          ]}
        />
      }
    />
  ),
}
