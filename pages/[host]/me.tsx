import { Footer } from 'common/Footer'
import { Dashboard } from 'components/Dashboard'
import Head from 'next/head'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export default function Me() {
  const { config } = useProjectConfig()
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: config.colors.main }}
    >
      <Head>
        <title>Cardinal | Me</title>
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
      <div style={{ minHeight: 'calc(100vh - 337px)' }}>
        <Dashboard />
      </div>
      <Footer bgColor={config.colors.main} />
    </div>
  )
}
