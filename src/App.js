import '@rainbow-me/rainbowkit/styles.css'
import { MantineProvider } from '@mantine/core'
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiConfig, createClient, configureChains } from 'wagmi'
import {
  createClient as createSubGraphClient,
  Provider as SubGraphProvider,
} from 'urql'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'
import { NotificationsProvider } from '@mantine/notifications'
import { SessionsEventsProvider } from './hooks/useSessionEvents'
import Layout from './components/Layout'

import { chains as chain } from './constants'

function App() {
  const subGraphClient = createSubGraphClient({
    url: process.env.REACT_APP_SUBGRAPH_URL,
  })

  //configure rainbow kit chain provider and connector
  const { chains, provider } = configureChains(
    [chain.avalanche],
    [
      jsonRpcProvider({
        rpc: (chain) => ({
          http: chain.rpcUrls.default,
        }),
      }),
      publicProvider(),
    ]
  )
  const { connectors } = getDefaultWallets({
    appName: 'Web3 Poker Social',
    chains,
  })

  //Create Wagmi client and pass in the connectors from rainbow kit
  const client = createClient({
    // AutoConnect must be true due to a bug in Wagmi not assigning Client.connector properly otherwise, will try and make a pull request on their github to fix
    autoConnect: true,
    connectors,
    provider,
  })

  return (
    <WagmiConfig client={client}>
      <SubGraphProvider value={subGraphClient}>
        <RainbowKitProvider
          chains={chains}
          showRecentTransactions={true}
          theme={darkTheme()}
        >
          <MantineProvider theme={{ colorScheme: 'dark' }} withGlobalStyles>
            <SessionsEventsProvider>
              <NotificationsProvider>
                <Layout />
              </NotificationsProvider>
            </SessionsEventsProvider>
          </MantineProvider>
        </RainbowKitProvider>
      </SubGraphProvider>
    </WagmiConfig>
  )
}

export default App
