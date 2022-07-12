import type { ComponentMeta, ComponentStory } from '@storybook/react'

import { ButtonSmall, Card } from '../src'
import { Stats } from '../src/common/Stats'

export default {
  title: 'Components/Card',
  component: Card,
} as ComponentMeta<typeof Card>

const Template: ComponentStory<typeof Card> = (args) => <Card {...args}></Card>

export const CardStats = Template.bind({})
CardStats.args = {
  hero: (
    <img
      className="w-full"
      src="https://img-cdn.magiceden.dev/rs:fill:170:170:0:0/plain/https://i.imgur.com/bMH6qNc.png"
      alt="text"
    />
  ),
  header: 'SolanaMonkeyBusiness',
}

export const CardStatsBadge = Template.bind({})
CardStatsBadge.args = {
  hero: (
    <img
      className="w-full"
      src="https://img-cdn.magiceden.dev/rs:fill:170:170:0:0/plain/https://i.imgur.com/bMH6qNc.png"
      alt="text"
    />
  ),
  badge: 'recent',
  header: 'SolanaMonkeyBusiness',
  content: (
    <Stats
      stats={[
        { header: 'Total listings', value: '1,320' },
        { header: 'Active listings', value: '180' },
      ]}
    />
  ),
}

export const NFTCard = Template.bind({})
NFTCard.args = {
  hero: (
    <img
      className="w-full"
      src="https://img-cdn.magiceden.dev/rs:fill:170:170:0:0/plain/https://i.imgur.com/bMH6qNc.png"
      alt="text"
    />
  ),
  badge: 'trending',
  header: 'SMB #123',
  subHeader: 'Max rate duration 3W 2D',
  content: <></>,
}

export const NFTCardRent = Template.bind({})
NFTCardRent.args = {
  hero: (
    <img
      className="w-full"
      src="https://img-cdn.magiceden.dev/rs:fill:170:170:0:0/plain/https://i.imgur.com/bMH6qNc.png"
      alt="text"
    />
  ),
  badge: 'trending',
  header: 'SMB #123',
  subHeader: 'Max rate duration 3W 2D',
  content: (
    <div className="flex w-full items-center justify-between">
      <ButtonSmall>Rent 0.1 ◎ / Day</ButtonSmall>
      <div className="text-xs text-gray-400">≈10 USDC</div>
    </div>
  ),
}
