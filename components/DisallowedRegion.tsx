import { FooterSlim } from 'common/FooterSlim'
import { useUserRegion } from 'hooks/useUserRegion'

export default function DisallowedRegion() {
  const userRegion = useUserRegion()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="max flex grow items-center justify-center">
        <div className="w-[600px] max-w-[95vw] rounded-xl bg-black bg-opacity-50 p-10 text-center">
          <div className="text-2xl font-bold">
            Users from Country ({userRegion.data?.countryName}) are not Eligible
            to Access This Page
          </div>
          <div className="mt-8 text-sm text-light-2">
            It is prohibited to use certain services offered by Cardinal if you
            are a resident of, or are located, incorporated, or have a
            registered agent in, {userRegion.data?.countryName} or any other
            jurisdiction where the Services are restricted.
          </div>
        </div>
      </div>
      <FooterSlim />
    </div>
  )
}
