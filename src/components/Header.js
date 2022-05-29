import React from 'react'
import { Grid, Header as MantineHeader, Text, Title } from '@mantine/core'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

import PlayerName from './PlayerName'

const Header = () => {
  const account = useAccount()

  return (
    <MantineHeader height={90}>
      <Grid align='center' justify='center' style={{ height: '100%' }} m={0}>
        <Grid.Col span={4} sm={4}>
          <Title order={1}>
            <Text color='green' inherit component='span'>
              W
            </Text>
            <Text color='blue' inherit component='span'>
              3
            </Text>
            <Text color='red' inherit component='span'>
              P
            </Text>
            <Text color='yellow' inherit component='span'>
              C
            </Text>
          </Title>
        </Grid.Col>
        <Grid.Col
          span={4}
          sm={2}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <PlayerName account={account} />
        </Grid.Col>
        <Grid.Col
          span={4}
          sm={4}
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
          }}
        >
          <ConnectButton
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </Grid.Col>
      </Grid>
    </MantineHeader>
  )
}

export default Header
