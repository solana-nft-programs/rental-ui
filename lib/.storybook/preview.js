import '../styles.css'
import * as NextImage from 'next/image'
import { themes } from '@storybook/theming'
import { DocsContainer } from './components/DocContainer'

const OriginalNextImage = NextImage.default

Object.defineProperty(NextImage, 'default', {
  configurable: true,
  value: (props) => <OriginalNextImage {...props} unoptimized />,
})

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewMode: 'docs',
  docs: {
    container: DocsContainer,
  },
  previewTabs: {
    'storybook/docs/panel': { index: -1 },
  },
  darkMode: {
    dark: {
      ...themes.dark, // copy existing values
      appContentBg: '#202020', // override main story view frame
      barBg: '#202020', // override top toolbar
    },
  },
}
