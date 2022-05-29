import React, { useState, useEffect } from 'react'
import {
  Stack,
  TextInput,
  Loader,
  Button,
  Checkbox,
  Text,
  Title,
} from '@mantine/core'
import { BigNumber, constants } from 'ethers'
import { useContractWrite, erc20ABI } from 'wagmi'
import { usdcAddress, creditPoolAddress } from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import {
  showPendingTxn,
  updatePendingTxn,
} from '../notifications/txnNotification'

const DepositTab = ({ userUsdc, usdcAllowance }) => {
  const [depositValue, setDepositValue] = useState('')
  const [depositError, setDepositError] = useState('')
  const [loading, setLoading] = useState(false)
  const [approved, setApproved] = useState(false)
  const [unlimitedApproval, setUnlimitedApproval] = useState(false)
  const addRecentTransaction = useAddRecentTransaction()

  const approveUsdc = useContractWrite(
    {
      addressOrName: usdcAddress,
      contractInterface: erc20ABI,
    },
    'approve',
    {
      onError(error) {
        console.log(error)
        setDepositError(
          'There was an error approving your transaction please try again'
        )
        setDepositValue('')
        setLoading(false)
      },
      onSuccess(data) {
        if (data) {
          const hash = data.hash
          showPendingTxn(hash)
          addRecentTransaction({
            hash: hash,
            description: `Approved ${depositValue} USDC to be spent for credits`,
          })
          data
            .wait()
            .then((data) => {
              if (data) {
                updatePendingTxn(hash)
                setApproved(true)
                setLoading(false)
              }
            })
            .catch((e) => {
              updatePendingTxn(hash, true)
              setDepositError(
                'There was an error with your approval please try again'
              )
              console.log(e)
              setLoading(false)
            })
        }
      },
    }
  )

  const writeBuyCredits = useContractWrite(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'buyCredit',
    {
      onSettled(data) {
        if (data) {
          const hash = data.hash
          showPendingTxn(hash)

          addRecentTransaction({
            hash: hash,
            description: `Bought in for $${depositValue}`,
          })
          data
            .wait()
            .then((data) => {
              if (data) {
                updatePendingTxn(hash)
                setDepositValue('')
                setDepositError('')
                setLoading(false)
              }
            })
            .catch((error) => {
              console.log(error)
              updatePendingTxn(hash, true)
              setDepositError(
                'There was an error with your transaction Please try again'
              )
              setLoading(false)
            })
        }
      },
      onError(error) {
        console.log(error)
        setDepositError(
          'There was an error completing your transaction please try again'
        )
        setLoading(false)
      },
    }
  )

  useEffect(() => {
    if (depositValue === '') {
      return
    }
    //remove everything but numbers
    const noCommas = depositValue.replace(/\D/g, '')

    //Turn into a big number
    const bigValue = BigNumber.from(noCommas)

    if (usdcAllowance?.data && !approved) {
      if (usdcAllowance.data.gte(bigValue.mul(10 ** 6))) {
        setApproved(true)
      }
    }
    if (usdcAllowance?.data && approved) {
      if (usdcAllowance.data.lt(bigValue.mul(10 ** 6))) {
        setApproved(false)
      }
    }
  }, [usdcAllowance?.data, depositValue, approved])

  const handleInputChange = (e) => {
    //remove everything but numbers
    const legalInput = e.currentTarget.value.replace(/\D/g, '')

    //add commas
    const withCommas = legalInput.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    //set value
    setDepositValue(withCommas)

    setDepositError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const bigValue = BigNumber.from(depositValue.replace(/\D/g, ''))

    if (!approved) {
      setLoading(true)
      approveUsdc.write({
        args: [
          creditPoolAddress,
          unlimitedApproval ? constants.MaxUint256 : bigValue.mul(10 ** 6),
        ],
      })
    } else {
      if (bigValue.mul(10 ** 6).gt(userUsdc.data)) {
        setDepositError(
          'You do not have enough USDC to complete this transaction'
        )
      } else {
        setLoading(true)
        writeBuyCredits.write({ args: bigValue })
      }
    }
  }

  return (
    <Stack
      align='center'
      justify='center'
      spacing='xs'
      style={{ height: '100%' }}
    >
      <Text color='dimmed'>USDC IN YOUR WALLET</Text>
      {userUsdc.isFetched ? (
        <Title order={1}>{userUsdc?.data?.div(1000000).toString()}</Title>
      ) : (
        <Loader />
      )}

      <form onSubmit={(e) => handleSubmit(e)}>
        <TextInput
          size='xs'
          onChange={(e) => handleInputChange(e)}
          value={depositValue}
          error={depositError}
          styles={(theme) => ({
            input: {
              backgroundColor: theme.colors.dark[4],
            },
          })}
          disabled={loading}
        />
      </form>
      <div>
        <Button size='md' onClick={(e) => handleSubmit(e)} loading={loading}>
          {depositValue !== '' && !approved ? 'APPROVE' : 'DEPOSIT'}
        </Button>

        {depositValue !== '' && !approved && (
          <Checkbox
            label='Unlimited Approval'
            checked={unlimitedApproval}
            onChange={(event) =>
              setUnlimitedApproval(event.currentTarget.checked)
            }
            style={{ position: 'absolute' }}
          />
        )}
      </div>
    </Stack>
  )
}

export default DepositTab
