export const chains = {
  avalanche: {
    blockExplorers: {
      default: { name: 'SnowTrace', url: 'https://snowtrace.io/' },
      // eslint-disable-next-line
      default: { name: 'SnowTrace', url: 'https://snowtrace.io/' },
    },
    id: 43114,
    name: 'Avalanche',
    nativeCurrency: {
      decimals: 18,
      name: 'Avalanche',
      symbol: 'Avax',
    },
    rpcUrls: {
      default: 'https://api.avax.network/ext/bc/C/rpc',
    },
    testnet: false,
  },
}

export const membershipAddress = process.env.REACT_APP_MEMBERSHIP_ADDRESS
export const creditPoolAddress = process.env.REACT_APP_CREDIT_POOL_ADDRESS
export const usdcAddress = process.env.REACT_APP_USDC_ADDRESS

export const zeroAddress = '0x0000000000000000000000000000000000000000'

export const zeroUserAddress =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

export const deductCreditsErr =
  'Error: VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)'
export const addCreditsErr =
  "Error: VM Exception while processing transaction: reverted with custom error 'NotEnoughCredits()'"
