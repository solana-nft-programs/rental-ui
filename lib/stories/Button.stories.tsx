import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { AiOutlinePlus } from 'react-icons/ai'

import { Button } from '../src'

export default {
  title: 'Components/Button',
  component: Button,
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (args) => (
  <Button {...args}></Button>
)

export const Primary = Template.bind({})
Primary.args = {
  variant: 'primary',
  text: 'Rent NFT',
  onClick: async () => await new Promise((r) => setTimeout(r, 2000)),
}

export const PrimaryDisabled = Template.bind({})
PrimaryDisabled.args = {
  variant: 'primary',
  text: 'Rent NFT',
  onClick: async () => await new Promise((r) => setTimeout(r, 2000)),
  disabled: true,
}

export const PrimaryIcon = Template.bind({})
PrimaryIcon.args = {
  variant: 'primary',
  text: 'Rent NFT',
  icon: <AiOutlinePlus />,
}

export const PrimaryCount = Template.bind({})
PrimaryCount.args = { variant: 'primary', text: 'Rent NFT', count: 1 }

export const PrimaryCountDisabled = Template.bind({})
PrimaryCountDisabled.args = {
  variant: 'primary',
  text: 'Rent NFT',
  count: 1,
  disabled: true,
}

export const PrimaryIconOnly = Template.bind({})
PrimaryIconOnly.args = {
  variant: 'primary',
  square: true,
  icon: <AiOutlinePlus />,
}

export const Secondary = Template.bind({})
Secondary.args = { variant: 'secondary', text: 'Rent NFT' }

export const SecondaryDisabled = Template.bind({})
SecondaryDisabled.args = {
  variant: 'secondary',
  text: 'Rent NFT',
  disabled: true,
}

export const SecondaryIcon = Template.bind({})
SecondaryIcon.args = {
  variant: 'secondary',
  text: 'Rent NFT',
  icon: <AiOutlinePlus />,
}
