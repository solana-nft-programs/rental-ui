import React from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { LoadingPulseWrapped } from 'common/LoadingPulse'
import { StyledBackground } from 'common/StyledBackground'
import { Header } from 'common/Header'
import { useRouter } from 'next/router'
import { Transaction, sendAndConfirmRawTransaction } from '@solana/web3.js'
import { FaCheckCircle, FaQuestionCircle } from 'react-icons/fa'
import { PublicKey } from '@solana/web3.js'
import { firstParam } from 'common/utils'

type Hideable = {
  visible?: boolean
}

const VerificationStepsOuter = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: calc(50vh - 250px);
  padding-bottom: calc(50vh - 250px);
  width: 90%;
  margin: 0px auto;
  font-weight: 200;
  text-transform: uppercase;
  font-family: Oswald, sans-serif;
`

enum VerificationStatus {
  WARNING,
  ERROR,
  SUCCESS,
}

type VerficationResult = {
  status: VerificationStatus
  data?: any
}

interface Verifiable extends Hideable {
  status?: VerificationStatus
}

const VerificationStep = styled.div<Verifiable>`
  text-align: center;
  // background-color: rgba(50,50,50,0.2);
  transition: height 0.3s;
  height: ${(props) => (props.visible ? '500px' : '0px')};
  border-radius: 10px;
  margin: 0px auto;
  width: 90%;
  max-width: 500px;
  box-shadow: ${(props) => {
    if (props.visible) {
      switch (props.status) {
        case VerificationStatus.WARNING:
          return '0 0 30px 20px rgba(255, 200, 50, 0.5)'
        case VerificationStatus.ERROR:
          return '0 0 30px 20px rgba(255, 0, 50, 0.3)'
        default:
          return '0 0 80px 50px rgba(255, 255, 255, 0.3)'
      }
    }
  }};
  color: white;
  position: relative;
  overflow: hidden;

  .header {
    position: relative;
    padding: 28px 28px 0px 28px;
    z-index: 1;
  }

  .step-name {
    font-size: 28px;
    font-weight: 400;
  }

  .address {
    text-decoration: none;
    color: white;
    width: 100%;
    overflow-wrap: break-word;
    transition: 0.2s all;

    &:hover {
      cursor: pointer;
      text-shadow: 0 0 10px #fff;
    }
  }

  .addresses {
    width: 100%;
    max-height: 65px;
    overflow: scroll;
    overflow-wrap: break-word;
  }

  .footer {
  }

  .content {
    position: absolute;
    top: 58%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    &:after {
      content: '';
      display: block;
      padding-bottom: 100%;
    }

    .asset {
      img {
        width: 85%;
        border-radius: 10px;
      }
    }

    i {
      font-size: 170px;
    }
  }

  &:after {
    content: '';
    position: absolute;
    top: -110%;
    left: -210%;
    width: 200%;
    height: 200%;
    opacity: 0;
    transform: rotate(30deg);

    background: rgba(255, 255, 255, 0.13);
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.13) 0%,
      rgba(255, 255, 255, 0.13) 77%,
      rgba(255, 255, 255, 0.5) 92%,
      rgba(255, 255, 255, 0) 100%
    );

    &:hover {
      opacity: 1;
      top: -30%;
      left: -30%;
      transition-property: left, top, opacity;
      transition-duration: 0.7s, 0.7s, 0.15s;
      transition-timing-function: ease;
    }
  }
`
function Scan() {
  const router = useRouter()
  const { tx } = router.query
  const ctx = useEnvironmentCtx()

  // step 1
  const [owner, setOwner] = useState<PublicKey | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [executeResult, setExecuteResult] = useState<
    VerficationResult | undefined
  >(undefined)

  useEffect(() => {
    handleExecute()
  }, [setError, tx])

  const handleExecute = async () => {
    const executePromise: Promise<VerficationResult> = new Promise(
      async (res) => {
        try {
          // get owner from signature and check ownership
          const buffer = Buffer.from(
            decodeURIComponent(firstParam(tx)),
            'base64'
          )
          const transaction = Transaction.from(buffer)
          setOwner(transaction.feePayer)
          const txid = await sendAndConfirmRawTransaction(
            ctx.connection,
            transaction.serialize()
          )
          console.log('TX: ', txid)
          return res({ status: VerificationStatus.SUCCESS })
        } catch (e: any) {
          console.log(e)
          setError(e)
          return res({ status: VerificationStatus.ERROR })
        }
      }
    )

    const [executeResult] = await Promise.all([executePromise])
    setExecuteResult(executeResult)
  }

  return (
    <>
      <Header />
      <VerificationStepsOuter>
        <VerificationStep visible={true} status={executeResult?.status}>
          <div className="header">
            <div className="step-name">Using Ticket</div>
            <div className="addresses">
              {decodeURIComponent(firstParam(tx))}
            </div>
          </div>
          <div className="content">
            <LoadingPulseWrapped loading={!executeResult}>
              {executeResult?.status == VerificationStatus.SUCCESS ? (
                <>
                  <div
                    style={{
                      fontSize: '170px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <FaCheckCircle />
                  </div>
                  <div className="footer" style={{ marginTop: '25px' }}>
                    Message signed by{' '}
                    <a
                      className="address"
                      href={`https://explorer.solana.com/address/${owner?.toString()}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {owner?.toString()}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: '170px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <FaQuestionCircle />
                  </div>
                  {error && (
                    <div className="footer" style={{ marginTop: '25px' }}>
                      {`${error}`}
                    </div>
                  )}
                </>
              )}
            </LoadingPulseWrapped>
          </div>
        </VerificationStep>
      </VerificationStepsOuter>
      <StyledBackground />
    </>
  )
}

export default Scan
