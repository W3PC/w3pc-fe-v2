import React, { useState } from 'react'
import { Stack, TextInput, Loader, Button, Text, Title } from '@mantine/core'
import { useContractWrite } from 'wagmi'
import { BigNumber } from 'ethers'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import {
  showPendingTxn,
  updatePendingTxn,
} from '../notifications/txnNotification'
import { creditPoolAddress } from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'
import { useSessionEvents } from '../hooks/useSessionEvents'

const WithdrawTab = ({ userCredits }) => {
  const [withdrawValue, setWithdrawValue] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [loading, setLoading] = useState(false)
  const addRecentTransaction = useAddRecentTransaction()
  const { addSessionCreditEvent, addSessionTransaction } = useSessionEvents()

  const withdrawCredit = useContractWrite(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'withdrawCredit',
    {
      onSettled(data) {
        if (data) {
          const hash = data.hash

          showPendingTxn(hash)

          addRecentTransaction({
            hash: hash,
            description: `Cashed out $${withdrawValue} from the game`,
          })
          data
            .wait()
            .then((data) => {
              if (data) {
                const bigValue = BigNumber.from(0).sub(
                  BigNumber.from(withdrawValue.replace(/\D/g, ''))
                )
                addSessionCreditEvent(bigValue)
                addSessionTransaction(bigValue.toString(), data.transactionHash)
                updatePendingTxn(hash)
                setWithdrawValue('')
                setWithdrawError('')
                setLoading(false)
              }
            })
            .catch((error) => {
              updatePendingTxn(hash, true)
              setWithdrawError(
                'There was an error with your transaction Please try again'
              )
              setLoading(false)
            })
        }
      },
      onError(error) {
        console.log(error)
        setWithdrawError(
          'There was an error completing your transaction please try again'
        )
        setLoading(false)
      },
    }
  )

  const handleInputChange = (e) => {
    //remove everything but numbers
    const legalInput = e.currentTarget.value.replace(/\D/g, '')

    //add commas
    const withCommas = legalInput.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    //set value
    setWithdrawValue(withCommas)

    setWithdrawError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const bigValue = BigNumber.from(withdrawValue.replace(/\D/g, ''))

    if (bigValue.gt(userCredits.data)) {
      setWithdrawError('You do not have that many credits')
    } else {
      setLoading(true)
      withdrawCredit.write({ args: [bigValue] })
    }
  }

  return (
    <Stack
      align='center'
      justify='center'
      spacing='xs'
      style={{ height: '100%' }}
    >
      <Text color='dimmed'>CREDITS AVAILABLE</Text>
      {userCredits.isFetched ? (
        <Title order={1}>{userCredits?.data?.toString()}</Title>
      ) : (
        <Loader />
      )}
      <form onSubmit={(e) => handleSubmit(e)}>
        <TextInput
          size='xs'
          onChange={(e) => handleInputChange(e)}
          value={withdrawValue}
          error={withdrawError}
          styles={(theme) => ({
            input: {
              backgroundColor: theme.colors.dark[4],
            },
          })}
          disabled={loading}
        />
      </form>
      <Button size='md' onClick={(e) => handleSubmit(e)} loading={loading}>
        WITHDRAW
      </Button>
    </Stack>
  )
}

export default WithdrawTab
