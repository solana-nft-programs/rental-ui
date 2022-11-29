import { defaultDisallowedRegions } from 'config/config'
import { useQuery } from 'react-query'

export const useUserRegion = () => {
  return useQuery<{
    countryCode: string
    countryName: string
    isAllowed: boolean | undefined
  }>(
    ['useUserRegion', defaultDisallowedRegions.map((r) => `${r.code}}`)],
    async () => {
      // const response = await fetch(
      //   `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.NEXT_PUBLIC_GEO_LOCATION_API_KEY}`
      // )
      // const json = (await response.json()) as {
      //   country_code2: string
      //   country_name: string
      // }
      return {
        countryName: 'Unknown',
        countryCode: 'Unkown',
        isAllowed: true,
        // !!json.country_code2 &&
        // !defaultDisallowedRegions.some(
        //   (r: { code: string }) => r.code === json.country_code2
        // ),
      }
    }
  )
}
