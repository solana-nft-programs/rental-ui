import { contrastColorMode } from '@cardinal/common'

export const CONFIG = {
  colors: {
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
  },
}

type ColorValues = keyof typeof CONFIG.colors

export const Color = ({ name }: { name: ColorValues }) => {
  return (
    <div
      className={`flex h-36 w-36 items-end p-2`}
      style={{
        backgroundColor: CONFIG.colors[name],
      }}
    >
      <div style={{ color: contrastColorMode(CONFIG.colors[name])[0] }}>
        <div className="text-xs">{name}</div>
        <div className="text-xs">{CONFIG.colors[name]}</div>
      </div>
    </div>
  )
}
