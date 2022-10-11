import { FooterSlim } from 'common/FooterSlim'
import { HeaderSlim } from 'common/HeaderSlim'
import { LoadingSpinner } from 'common/LoadingSpinner'

export default function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col">
      <HeaderSlim />
      <div className="flex h-full flex-col items-center justify-center gap-12 text-light-0">
        <div className="text-4xl">Loading</div>
        <div className="scale-[2]">
          <LoadingSpinner />
        </div>
        <div className="text-lg text-medium-4">
          Click{' '}
          <a className="text-blue-500" href="/">
            here
          </a>{' '}
          to return home
        </div>
      </div>
      <FooterSlim />
    </div>
  )
}
