import React, { useState } from 'react'
import styled from '@emotion/styled'
import { DatePicker } from 'antd'
import { Connection, PublicKey } from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { Alert } from 'rental-components/common/Alert'
import { StepDetail } from 'rental-components/common/StepDetail'
import { LabeledInput } from 'rental-components/common/LabeledInput'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { FiSend } from 'react-icons/fi'
import { BiTimer, BiQrScan } from 'react-icons/bi'
import { ImPriceTags } from 'react-icons/im'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { TokenData } from 'api/api'
import { getQueryParam } from 'common/utils'
import { NFTOverlay } from 'common/NFTOverlay'
import { claimLinks } from '@cardinal/token-manager'
import { executeTransaction } from 'common/Transactions'
import { TokenManagerKind } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { notify } from 'common/Notification'

const NFTOuter = styled.div`
  height: 200px;
  margin: 0px auto;
  position: relative;
  border-radius: 10px;

  .media {
    border-radius: 10px;
    height: 100%;
  }
`

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

export type RentalCardProps = {
  dev?: boolean
  cluster?: string
  connection: Connection
  wallet: Wallet
  tokenData: TokenData
  appName?: string
  appTwitter?: string
  notify?: Function
  onComplete?: (asrg0: string) => void
}

export const RentalCard = ({
  appName,
  appTwitter,
  dev,
  cluster,
  connection,
  wallet,
  tokenData,
  notify,
  onComplete,
}: RentalCardProps) => {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [rentalType, setRentalType] = useState('time')
  const [link, setLink] = useState<string | null>(null)
  const { tokenAccount, metaplexData, metadata, tokenManager } = tokenData
  console.log(tokenData)
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')

  // form
  const [price, setPrice] = useState(0)
  const [paymentMint, setPaymentMint] = useState(PAYMENT_MINTS[0].mint)
  const [amount, setAmount] = useState(1)
  const [expiration, setExpiration] = useState<number | null>(null)
  const [maxUsages, setMaxUsages] = useState<number | null>(null)
  const [revocable, setRevocable] = useState(false)
  const [extendable, setExtendable] = useState(false)
  const [returnable, setReturnable] = useState(false)
  const [recipient, setRecipient] = useState(null)

  const handleRental = async () => {
    console.log('HANDLING RENTAL')
    try {
      if (!tokenAccount) {
        throw 'Token acount not found'
      }
      setLoading(true)
      const rentalMint = new PublicKey(
        tokenAccount?.account.data.parsed.info.mint
      )
      console.log(rentalMint)
      const [transaction, _tokenManagerId, otpKeypair] =
        await claimLinks.issueToken(connection, wallet, {
          rentalMint,
          issuerTokenAccountId: tokenAccount?.pubkey,
          usages: maxUsages || undefined,
          kind: TokenManagerKind.Unmanaged,
        })
      await executeTransaction(connection, wallet, transaction)
      const link = claimLinks.getLink(rentalMint, otpKeypair)
      setLink(link)
      handleCopy(link)
      console.log(link)
    } catch (e) {
      console.log('Error handling rental', e)
      setError(`Error handling rental ${e}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <RentalCardOuter>
      <Wrapper>
        <Instruction>
          {appName ? `${appName} uses` : 'Use'} Cardinal to rent out this NFT on{' '}
          <strong>Solana</strong>.
        </Instruction>
        {(!wallet?.publicKey || !connection) && (
          <Alert
            style={{ marginBottom: '20px' }}
            message={
              <>
                <div>Connect wallet to continue</div>
              </>
            }
            type="warning"
            showIcon
          />
        )}
        <DetailsWrapper>
          <div
            style={{ padding: '0px 80px' }}
            className="flex items-center justify-center gap-10"
          >
            <BigIcon selected={rentalType === 'time'}>
              <BiTimer />
            </BigIcon>
            <BigIcon selected={true}>
              <BiQrScan />
            </BigIcon>
            <BigIcon selected={true}>
              <ImPriceTags />
            </BigIcon>
          </div>
          <NFTOuter>
            <NFTOverlay
              state={tokenManager?.parsed.state}
              paymentAmount={tokenManager?.parsed.paymentAmount}
              paymentMint={tokenManager?.parsed.paymentMint}
              expiration={expiration || undefined}
              usages={tokenManager?.parsed.usages}
              maxUsages={maxUsages || undefined}
              revocable={tokenManager?.parsed.revokeAuthority != null}
              extendable={tokenManager?.parsed.isExtendable}
              returnable={tokenManager?.parsed.isReturnable}
              lineHeight={12}
            />
            {metadata &&
              metadata.data &&
              (metadata.data.animation_url ? (
                // @ts-ignore
                <model-viewer
                  className="media"
                  auto-rotate-delay="0"
                  auto-rotate="true"
                  auto-play="true"
                  src={metadata.data.animation_url}
                  arStatus="not-presenting"
                  // @ts-ignore
                ></model-viewer>
              ) : (
                <img
                  className="media"
                  src={customImageUri || metadata.data.image}
                  alt={metadata.data.name}
                />
              ))}
          </NFTOuter>
          <StepDetail
            disabled={false}
            icon={<BiTimer />}
            title="Duration"
            description={
              <div>
                <DatePicker
                  style={{
                    borderRadius: '4px',
                    zIndex: 99999,
                  }}
                  showTime
                  onChange={(e) => setExpiration(e ? e.valueOf() / 1000 : null)}
                />
              </div>
            }
          />
          <StepDetail
            disabled={false}
            icon={<BiQrScan />}
            title="Uses"
            description={
              <div>
                <LabeledInput
                  disabled={false}
                  label="Uses"
                  name="tweet"
                  type="number"
                  onChange={(e) => setMaxUsages(parseInt(e.target.value))}
                />
              </div>
            }
          />
          <StepDetail
            disabled={false}
            icon={<ImPriceTags />}
            title="Pricing Details"
            description={
              <>
                <MintPriceSelector
                  price={price}
                  mint={paymentMint}
                  handlePrice={setPrice}
                  handleMint={setPaymentMint}
                />
              </>
            }
          />
          {error && (
            <StyledAlert>
              <Alert
                style={{ marginTop: '10px', height: 'auto' }}
                message={
                  <>
                    <div>{error}</div>
                  </>
                }
                type="error"
                showIcon
              />
            </StyledAlert>
          )}
        </DetailsWrapper>
        {link && (
          <StyledAlert onClick={() => handleCopy(link)}>
            <Alert
              style={{ marginTop: '10px', height: 'auto', cursor: 'pointer' }}
              message={
                <>
                  <div>
                    {' '}
                    {link.substring(0, 40)}
                    ...
                    {link.substring(link.length - 10)}
                  </div>
                </>
              }
              type="success"
              showIcon
            />
          </StyledAlert>
        )}
        <ButtonWithFooter
          loading={loading}
          complete={link != null}
          disabled={false}
          onClick={handleRental}
          footer={<PoweredByFooter />}
        >
          <div
            style={{ gap: '5px' }}
            className="flex items-center justify-center"
          >
            Send
            <FiSend />
          </div>
        </ButtonWithFooter>
      </Wrapper>
    </RentalCardOuter>
  )
}

const BigIcon = styled.div<{ selected: boolean }>`
  font-size: 50px;
  background-color: ${({ selected }) => (selected ? 'black' : '#888')};
  color: white;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  height: 50px;
  width: 50px;
  display: flex;
  margin: 20px auto 0px auto;
  border-radius: 50%;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }
`

const ButtonWrapper = styled.div`
  display: flex;
  margin-top: 5px;
  justify-content: center;
`

const ButtonLight = styled.div`
  border-radius: 5px;
  padding: 5px 8px;
  border: none;
  background: #eee;
  color: #777;
  cursor: pointer;
  transition: 0.1s all;
  &:hover {
    background: #ddd;
  }
`

const StyledAlert = styled.div``

const Wrapper = styled.div`
  padding: 10px 28px 28px 28px;
`

const Instruction = styled.h2`
  margin-top: 0px;
  font-weight: normal;
  font-size: 24px;
  line-height: 30px;
  text-align: center;
  letter-spacing: -0.02em;
  color: #000000;
`

const DetailsWrapper = styled.div`
  display: grid;
  grid-row-gap: 28px;
`

export const RentalCardOuter = styled.div``
