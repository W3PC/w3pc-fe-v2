import React, { useState } from 'react'
import {
  Grid,
  Group,
  Text,
  Badge,
  Tooltip,
  Stack,
  NumberInput,
  Slider,
  Button,
} from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { useContractRead, useContractWrite } from 'wagmi'
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit'
import {
  showPendingTxn,
  updatePendingTxn,
} from '../notifications/txnNotification'
import {
  creditPoolAddress,
  addCreditsErr,
  deductCreditsErr,
} from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'
import { utils, BigNumber } from 'ethers'

const HostControls = ({ player, totalGameCredits, totalGameUsdc, refetch }) => {
  const [inputValue, setInputValue] = useState(0)
  const [errors, setErrors] = useState('')
  const [loading, setLoading] = useState(false)
  const addRecentTransaction = useAddRecentTransaction()
  const clipboard = useClipboard({ timeout: 1000 })

  const memberCredits = useContractRead(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'memberCredits',
    {
      watch: true,
      args: [utils.getAddress(player.id)],
    }
  )

  const addCreditsWrite = useContractWrite(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'addCredits',
    {
      onSuccess(data) {
        if (data) {
          const hash = data.hash

          showPendingTxn(hash)

          addRecentTransaction({
            hash: hash,
            description: `Added ${inputValue} game credits to ${player.name}`,
          })
          data
            .wait()
            .then((data) => {
              if (data) {
                updatePendingTxn(hash)
                setLoading(false)
                setInputValue(0)
                refetch({ requestPolicy: 'network-only' })
              }
            })
            .catch((error) => {
              console.log(error)
              updatePendingTxn(hash, true)
              setErrors('There was an error adding credits please try again')
            })
        }
      },
      onError(error) {
        console.log(error)
        if (error.message === addCreditsErr) {
          setErrors(
            'There is not enough credits in the game contract to add that many credits.'
          )
        } else {
          setErrors('There was an error adding credits please try again')
        }
        setLoading(false)
      },
    }
  )

  const deductCreditsWrite = useContractWrite(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'deductCredits',
    {
      onSuccess(data) {
        if (data) {
          const hash = data.hash

          showPendingTxn(hash)

          addRecentTransaction({
            hash: hash,
            description: `Deducted ${inputValue} game credits from ${player.name}`,
          })
          data
            .wait()
            .then((data) => {
              if (data) {
                updatePendingTxn(hash)
                setLoading(false)
                setInputValue(0)
                refetch({ requestPolicy: 'network-only' })
              }
            })
            .catch((error) => {
              updatePendingTxn(hash, true)
              console.log(error)
              setLoading(false)
              setErrors(
                'There was an error subtracting credits, please try again'
              )
            })
        }
      },
      onError(error) {
        console.log(error)
        if (error.message === deductCreditsErr) {
          setErrors('You cannot deduct more than a player has')
        } else {
          setErrors('There was an error deducting credits please try again')
        }
        setLoading(false)
      },
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue || window.isNaN(inputValue)) {
      setErrors('Please input a valid amount')
      return
    }
    if (inputValue === 0) {
      setErrors('Please input an amount to adjust the credits')
      return
    }
    setErrors(0)
    setLoading(true)
    if (inputValue > 0) {
      addCreditsWrite.write({
        args: [utils.getAddress(player.id), BigNumber.from(inputValue)],
      })
    }
    if (inputValue < 0) {
      deductCreditsWrite.write({
        args: [utils.getAddress(player.id), BigNumber.from(inputValue).abs()],
      })
    }
  }

  return (
    <Grid>
      <Grid.Col span={8}>
        <Group>
          <Tooltip
            style={{ cursor: 'pointer' }}
            label={clipboard.copied ? 'Copied' : 'Click to copy'}
          >
            <Text
              onClick={() => clipboard.copy(player.id)}
              size='sm'
            >{`${player.id.substring(0, 5)}...${player.id.substring(
              38,
              42
            )}`}</Text>
          </Tooltip>
          <Badge>Verify</Badge>
          <Badge>Verified</Badge>
        </Group>
      </Grid.Col>
      <Grid.Col span={4}>
        <Stack spacing='xs'>
          <form onSubmit={(e) => handleSubmit(e)}>
            <NumberInput
              label='adjust credits'
              value={inputValue}
              hideControls
              precision={0}
              max={totalGameUsdc.data
                .div(1000000)
                .sub(totalGameCredits.data)
                .toNumber()}
              min={-memberCredits?.data?.toNumber()}
              error={errors}
              onChange={(v) => setInputValue(v)}
              styles={(theme) => ({
                input: {
                  backgroundColor: theme.colors.dark[4],
                },
              })}
              disabled={loading}
            />
          </form>
          <Slider
            value={inputValue}
            onChange={(v) => setInputValue(v)}
            marks={[{ value: 0, label: 0 }]}
            max={totalGameUsdc.data
              .div(1000000)
              .sub(totalGameCredits.data)
              .toNumber()}
            min={-memberCredits?.data?.toNumber()}
            disabled={loading}
          />
          <Text>
            = {memberCredits?.data?.add(inputValue).toString()} credits
          </Text>
          <Button size='xs' onClick={(e) => handleSubmit(e)} loading={loading}>
            CONFIRM
          </Button>
        </Stack>
      </Grid.Col>
    </Grid>
  )
}

export default HostControls
