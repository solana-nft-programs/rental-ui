import { firstParam, tryPublicKey } from '@cardinal/common'
import { useAddressName } from '@cardinal/namespaces-components'
import { Banner } from 'common/Banner'
import { FooterSlim } from 'common/FooterSlim'
import { Dashboard } from 'components/Dashboard'
import Error from 'components/Error'
import LoadingScreen from 'components/LoadingScreen'
import { useNameEntry } from 'hooks/useNameEntry'
import { useWalletId } from 'hooks/useWalletId'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

export default function Profile() {
  const walletId = useWalletId()
  const { query } = useRouter()
  const { connection } = useEnvironmentCtx()
  const nameEntry = useNameEntry(firstParam(query.wallet), true)
  const { data: displayName } = useAddressName(connection, walletId)

  if (!tryPublicKey(query.wallet) && !nameEntry.isFetched) {
    return <LoadingScreen />
  }

  if (
    tryPublicKey(query.wallet)
      ? walletId?.toString() !== query.wallet
      : !nameEntry.data?.parsed.name
  ) {
    return <Error />
  }

  return (
    <div className="relative z-0 min-h-screen bg-dark-5">
      <div className="blur-4xl absolute left-10 top-52 -z-10 h-[120px] w-[300px] -rotate-[60deg] bg-glow blur-[100px]"></div>
      <div className="blur-4xl absolute right-12 top-52 -z-10 h-[120px] w-[350px] -rotate-[60deg] bg-glow blur-[120px]"></div>
      <Head>
        <title>Cardinal | {displayName}</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@100&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:ital@0;1&family=Oswald:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Banner />
      <div style={{ minHeight: 'calc(100vh - 337px)' }}>
        <Dashboard />
      </div>
      <FooterSlim />
    </div>
  )
}
