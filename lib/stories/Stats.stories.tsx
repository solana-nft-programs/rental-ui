import type { ComponentMeta, ComponentStory } from '@storybook/react'

import { Stats } from '../src'

export default {
  title: 'Components/Stats',
  component: Stats,
} as ComponentMeta<typeof Stats>

const Template: ComponentStory<typeof Stats> = (args) => (
  <Stats {...args}></Stats>
)

export const StatsStats = Template.bind({})
StatsStats.args = {
  stats: [
    { header: 'Total listings', value: '1,320' },
    { header: 'Active listings', value: '180' },
  ],
}
