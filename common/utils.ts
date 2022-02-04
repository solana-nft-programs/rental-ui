import * as web3 from '@solana/web3.js'

export function getExpirationString(expiration: number, UTCSecondsNow: number) {
  return `${Math.round(
    (expiration - UTCSecondsNow) / 60 / 60 / 24
  )}d ${Math.round(
    ((expiration - UTCSecondsNow) / 60 / 60) % 24
  )}h ${Math.round(((expiration - UTCSecondsNow) / 60) % 60)}m ${Math.round(
    (expiration - UTCSecondsNow) % 60
  )}s`
}

export function shortPubKey(pubkey: web3.PublicKey) {
  return `${pubkey?.toBase58().substring(0, 4)}..${pubkey
    ?.toBase58()
    .substring(pubkey?.toBase58().length - 4)}`
}

export function shortDateString(utc_seconds: number) {
  return `${new Date(utc_seconds * 1000).toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  })} ${new Date(utc_seconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

/**
 *
 * @param {string} name
 * @returns {string|null}
 */
export function getQueryParam(url: string, name: string) {
  if (!url || !name) return null
  var q = url.match(new RegExp('[?&]' + name + '=([^&#]*)'))
  return q && q[1]
}

export const firstParam = (param: string | string[] | undefined): string => {
  if (!param) return ''
  return typeof param === 'string' ? param : param[0]
}
