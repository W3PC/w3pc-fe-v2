import React, { useState } from 'react'
import { Text, Title, TextInput, Loader } from '@mantine/core'
import { membershipAddress, zeroUserAddress } from '../constants'
import membershipAbi from '../constants/abis/Membership.json'
import { utils } from 'ethers'
import { useContractRead, useContractWrite } from 'wagmi'
import { IconArrowUpCircle } from '@tabler/icons'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import {
  showPendingTxn,
  updatePendingTxn,
} from '../notifications/txnNotification'

const PlayerName = ({ account }) => {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [inputLoading, setInputLoading] = useState(false)
  const addRecentTransaction = useAddRecentTransaction()

  const userName = useContractRead(
    {
      addressOrName: membershipAddress,
      contractInterface: membershipAbi,
    },
    'nameOfAddress',
    {
      args: [account?.data?.address],
      enabled: account?.data?.address ? true : false,
      watch: true,
    }
  )

  const Icon = (
    <IconArrowUpCircle
      as='button'
      type='submit'
      onClick={(e) => handleSubmit(e)}
    />
  )

  //TODO Add proper error message for when name is already taken
  const register = useContractWrite(
    {
      addressOrName: membershipAddress,
      contractInterface: membershipAbi,
    },
    'register',
    {
      onSettled(data) {
        if (data) {
          const hash = data.hash
          showPendingTxn(hash)
          addRecentTransaction({
            hash: hash,
            description: `Set ${inputValue} as account name`,
          })
          data
            .wait()
            .then((data) => {
              setInputLoading(false)
              updatePendingTxn(hash)
            })
            .catch((e) => {
              console.log(e)
              updatePendingTxn(hash, true)
              setInputLoading(false)
              setInputError('There was an error writing to the chain')
            })
        }
      },
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()

    if (inputValue === '') {
      setInputError('Please type a username')
    }
    try {
      //FormatBytes32 will throw an error if the string is greater than 32 bytes, thats why we put in try/catch and set the proper error
      const bytesInput = utils.formatBytes32String(inputValue)
      register.write({ args: bytesInput })
    } catch (error) {
      console.log(error)
      setInputError(
        'Username needs to be bytes32 or smaller (usually < 31 characters)'
      )
    }

    setInputLoading(true)
  }

  const handleInputChange = (e) => {
    try {
      const lowerCase = e.currentTarget.value.toLowerCase()
      utils.formatBytes32String(lowerCase)
      setInputError('')
      setInputValue(lowerCase)
    } catch (error) {
      console.log(error)
      setInputError(
        'Username needs to be bytes32 or smaller (usually < 31 characters)'
      )
    }
  }

  if (!account.data?.address) {
    //If user hasnt connected their wallet yet, return empty div to make the blank spot in header where account name would be
    return <div></div>
  } else if (!userName?.data || userName.data === zeroUserAddress) {
    //If wallet is connected but they have never registered a userName return an input box so they can make an account
    return (
      <div>
        <form onSubmit={(e) => handleSubmit(e)}>
          <TextInput
            placeholder='Username'
            label='Register'
            description='Create a username on game contract'
            value={inputValue}
            onChange={(e) => handleInputChange(e)}
            error={inputError}
            size='xs'
            rightSection={inputLoading ? <Loader size='xs' /> : Icon}
            styles={(theme) => ({
              rightSection: {
                cursor: 'pointer',

                '&:hover': {
                  color: theme.colors.blue[7],
                },
              },
              error: {
                position: 'absolute',
              },
            })}
            disabled={inputLoading}
          />
        </form>
      </div>
    )
  } else {
    return (
      <div>
        <Text color='dimmed' size='xs' mb={-5}>
          Player
        </Text>
        <Title order={4}>{utils.parseBytes32String(userName.data)}</Title>
      </div>
    )
  }
}

export default PlayerName
