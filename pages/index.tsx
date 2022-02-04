import Head from 'next/head'
import styled from '@emotion/styled'
import { WalletConnectButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const StyledSplash = styled.div`
  margin-top: 30vh;
  width: 70%;
  max-width: 400px;
  position: relative;
  color: rgba(255, 255, 255, 0.8);

  .title {
    text-align: center;
    position: relative;
  }

  .subscript {
    font-size: 10px;
    font-style: italic;
    position: absolute;
    right: -35px;
    bottom: 5px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 3px 5px;
  }
`

export default function Home() {
  const wallet = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (wallet && wallet.connected && wallet.publicKey) {
      router.push(
        `/${wallet.publicKey.toBase58()}${
          new URLSearchParams(window.location.search).get('cluster')
            ? `?cluster=${new URLSearchParams(window.location.search).get(
                'cluster'
              )}`
            : ''
        }`
      )
    }
  }, [wallet.connected])

  return (
    <div className="flex min-h-screen flex-col items-center">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
        <link href="/globals.css" rel="stylesheet" />

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
      <StyledSplash>
        <div className="title">
          <img src="/assets/cardinal-titled.png" />
          {/* <div className="subscript">alpha</div> */}
        </div>
        <div className="mt-5 flex items-center justify-center">
          <WalletConnectButton />
        </div>
      </StyledSplash>
    </div>
  )
}
