import React from 'react'
import { Tabs } from '@mantine/core'
import { useContractRead, erc20ABI, useAccount } from 'wagmi'
import { usdcAddress, creditPoolAddress } from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'
import DepositTab from './DepositTab'
import WithdrawTab from './WithdrawTab'

const ManageCredits = () => {
  const account = useAccount()

  const usdcAllowance = useContractRead(
    {
      addressOrName: usdcAddress,
      contractInterface: erc20ABI,
    },
    'allowance',
    {
      enabled: account?.data?.address ? true : false,
      args: [account?.data?.address, creditPoolAddress],
      onError(error) {
        console.log(error)
      },
      watch: true,
    }
  )

  const userUsdc = useContractRead(
    {
      addressOrName: usdcAddress,
      contractInterface: erc20ABI,
    },
    'balanceOf',
    {
      enabled: account?.data?.address ? true : false,
      args: account?.data?.address,
      onError(error) {
        console.log(error)
      },
      watch: true,
    }
  )

  const userCredits = useContractRead(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'memberCredits',
    {
      args: account?.data?.address,
      enabled: account?.data?.address ? true : false,
      watch: true,
    }
  )

  return (
    <Tabs
      variant='pills'
      grow
      styles={(theme) => ({
        root: {
          height: '100%',
        },
        tabLabel: {
          fontSize: '1.2rem',
        },
        body: {
          height: '80%',
        },
      })}
      p='md'
    >
      <Tabs.Tab label='Withdraw'>
        <WithdrawTab userCredits={userCredits} />
      </Tabs.Tab>
      <Tabs.Tab label='Deposit'>
        <DepositTab usdcAllowance={usdcAllowance} userUsdc={userUsdc} />
      </Tabs.Tab>
    </Tabs>
  )
}

export default ManageCredits
