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
  TextInput,
} from '@mantine/core'
import { creditPoolAddress, membershipAddress, usdcAddress } from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'
import membershipAbi from '../constants/abis/Membership.json'
import {
  useContractRead,
  useAccount,
  erc20ABI,
  useContract,
  useProvider,
} from 'wagmi'
import HostControls from './HostControl'
import { useSessionEvents } from '../hooks/useSessionEvents'
import { utils } from 'ethers'

const MembersList = () => {
  const account = useAccount()
  const [hostSearch, setHostSearch] = useState('')
  const [inputError, setInputError] = useState('')
  const [hostAddedMembers, setHostAddedMembers] = useState([])
  const provider = useProvider()

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

  const creditPoolContract = useContract({
    addressOrName: creditPoolAddress,
    contractInterface: creditPoolAbi,
    signerOrProvider: provider,
  })

  const membershipContract = useContract({
    addressOrName: membershipAddress,
    contractInterface: membershipAbi,
    signerOrProvider: provider,
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if it is an address
    if (
      hostSearch.length === 42 &&
      hostSearch[0] === '0' &&
      hostSearch[1] === 'x'
    ) {
      try {
        const checkSum = utils.getAddress(hostSearch)
        const credits = await creditPoolContract.memberCredits(checkSum)
        setHostAddedMembers([
          ...hostAddedMembers,
          {
            id: checkSum,
            name: checkSum,
            isHost: false,
            credits: credits.toString(),
            key: checkSum + '6969696969',
          },
        ])
        setHostSearch('')
      } catch (error) {
        console.log(error)
        setInputError('Please enter a valid address or account name')
        setHostSearch('')
        return
      }
    } else {
      try {
        const nameAsBytes = utils.formatBytes32String(hostSearch)
        const nameAddress = await membershipContract.addressOfName(nameAsBytes)
        const credits = await creditPoolContract.memberCredits(nameAddress)
        setHostAddedMembers([
          ...hostAddedMembers,
          {
            name: hostSearch,
            id: nameAddress,
            credits: credits.toString(),
            isHost: false,
            key: nameAddress + '6969696969',
          },
        ])
        setHostSearch('')
      } catch (error) {
        console.log(error)
        setInputError('Please enter a valid address or account name')
        setHostSearch('')
      }
    }
  }

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
  console.log(result)

  return (
    <Container style={{ height: 'auto', width: '100%' }} m='sm'>
      {isHost.data && (
        <form onSubmit={handleSubmit}>
          <TextInput
            size='xs'
            onChange={(e) => setHostSearch(e.currentTarget.value)}
            value={hostSearch}
            error={inputError}
            styles={(theme) => ({
              input: {
                backgroundColor: theme.colors.dark[4],
              },
            })}
            label='Add member by account name or address'
          />
        </form>
      )}
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
          {hostAddedMembers
            .concat(result.data?.creditPools[0].activeMembers)
            .map((player) => (
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

  useEffect(() => {
    const checkSumAddress = utils.getAddress(player.id)
    if (sessionEvents[checkSumAddress]?.credits) {
      setCredits(
        sessionEvents[checkSumAddress].credits.add(player.credits).toString()
      )
    }
  }, [sessionEvents?.credits, player.credits, player.id])

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
