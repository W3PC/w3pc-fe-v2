import React from 'react'
import { AppShell, Grid, Text } from '@mantine/core'
import Header from './Header'
import ManageCredits from './ManageCredits'
import MembersList from './MembersList'
import RecentTransactions from './RecentTransactions'

const Layout = () => {
  return (
    <AppShell
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colors.dark[5],
        },
      })}
      header={<Header />}
      fixed
    >
      <Grid style={{ height: '100%' }} justify='center' align='center'>
        <Grid.Col
          span={7}
          sm={6}
          lg={6}
          xl={4}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ height: '5%' }}>
            <Text weight='bolder'>Members</Text>
          </div>
          <div
            style={{
              height: '85%',
              border: '1px solid white',
              borderRadius: '5px',
              display: 'flex',
            }}
          >
            <MembersList />
          </div>
        </Grid.Col>
        <Grid.Col
          span={5}
          sm={4}
          md={3}
          lg={3}
          xl={2}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ height: '5%' }}>
            <Text weight='bolder' pb='xl'>
              Manage Credits
            </Text>
          </div>
          <div
            style={{
              height: '35%',
              border: '1px solid white',
              borderRadius: '5px',
            }}
          >
            <ManageCredits />
          </div>
          <div
            style={{
              height: '10%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Text weight='bolder'>Recent Credit Transactions</Text>
          </div>
          <div
            style={{
              height: '40%',
              border: '1px solid white',
              borderRadius: '5px',
              overflow: 'hidden',
            }}
          >
            <RecentTransactions />
          </div>
        </Grid.Col>
      </Grid>
    </AppShell>
  )
}

export default Layout
