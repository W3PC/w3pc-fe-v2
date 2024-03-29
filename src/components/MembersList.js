import React, { useEffect, useState } from 'react'
import { useQuery } from 'urql'
import {
  Center,
  Container,
  Table,
  Text,
  Loader,
  Badge,
  Accordion,
  Group,
} from '@mantine/core'
import { creditPoolAddress, usdcAddress } from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'
import { useContractRead, useAccount, erc20ABI } from 'wagmi'
import HostControls from './HostControl'
import { useSessionEvents } from '../hooks/useSessionEvents'
import { utils } from 'ethers'

const MembersList = () => {
  const account = useAccount()

  const isHost = useContractRead(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'isHost',
    {
      enabled: account?.data?.address ? true : false,
      args: account?.data?.address,
    }
  )

  const totalGameCredits = useContractRead(
    {
      addressOrName: creditPoolAddress,
      contractInterface: creditPoolAbi,
    },
    'totalCredits',
    {
      watch: true,
    }
  )

  const totalGameUsdc = useContractRead(
    {
      addressOrName: usdcAddress,
      contractInterface: erc20ABI,
    },
    'balanceOf',
    {
      watch: true,
      args: [creditPoolAddress],
    }
  )

  // TODO: We are currently saving all addresses in the subGraph as lowercase versions of the address, need to check with zaz and see if thats intentional or problematic. For now im just going to lowercase any addresses i pass in as queries
  const activeMembersQuery = `
  {
    creditPools(id: "${creditPoolAddress.toLowerCase()}") {
        activeMembers {
          id
          name
          credits
          isHost
        }
      }
    }`

  const [result, reexecuteQuery] = useQuery({
    query: activeMembersQuery,
  })

  if (result.fetching) {
    return (
      <Center>
        <Loader size='xl' m='xl' />
      </Center>
    )
  }
  if (result.error)
    return (
      <Text>There was an error fetching member data please try again....</Text>
    )

  return (
    <Container style={{ height: 'auto', width: '100%' }} m='sm'>
      <Table>
        <thead>
          <tr>
            <th>
              <Text color='dimmed'>Name</Text>
            </th>
            <th style={{ textAlign: 'right' }}>
              <Text color='dimmed'>Credits</Text>
            </th>
          </tr>
        </thead>
        {!isHost.data && (
          <tbody>
            {/* TODO: Add sorting so players with most credits are at the top*/}
            {result.data?.creditPools[0].activeMembers.map((player) => (
              <AccordionLabel player={player} key={player.id} table />
            ))}
          </tbody>
        )}
      </Table>
      {isHost.data && (
        <Accordion>
          {result.data?.creditPools[0].activeMembers.map((player) => (
            <Accordion.Item
              label={<AccordionLabel player={player} />}
              key={player.id}
            >
              <HostControls
                player={player}
                totalGameCredits={totalGameCredits}
                totalGameUsdc={totalGameUsdc}
                refetch={reexecuteQuery}
              />
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  )
}

const AccordionLabel = ({ player, table }) => {
  const [credits, setCredits] = useState(player.credits)
  const { sessionEvents } = useSessionEvents()

  const checkSumAddress = utils.getAddress(player.id)

  useEffect(() => {
    if (sessionEvents[checkSumAddress]?.credits) {
      setCredits(
        sessionEvents[checkSumAddress].credits.add(player.credits).toString()
      )
    }
  }, [sessionEvents[checkSumAddress]?.credits, player.credits, player.id])

  if (table) {
    return (
      <tr key={player.id}>
        <td
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text weight='bold'>{player.name}</Text>
          {(player.isHost ||
            player.id === '0x88532f5e88f6a1ccd9e64681acc63416594000f4') && (
            <Badge ml='xs' variant='light' radius='xs'>
              HOST
            </Badge>
          )}
        </td>
        <td style={{ textAlign: 'right' }}>
          <Text weight='bold'>{credits}</Text>
        </td>
      </tr>
    )
  } else {
    return (
      <Group noWrap position='apart'>
        <Text weight='bold'>
          {player.name}
          {player.isHost ||
          player.id === '0x88532f5e88f6a1ccd9e64681acc63416594000f4' ? (
            <Badge ml='xs' variant='light' radius='xs'>
              HOST
            </Badge>
          ) : (
            ''
          )}
        </Text>
        <Text weight='bold'>{credits}</Text>
      </Group>
    )
  }
}

export default MembersList
