import { Table, Text, Loader } from '@mantine/core'
import React from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from 'urql'

const RecentTransactions = () => {
  const account = useAccount()

  const activeMembersQuery = `
  {
    member(id:"${account?.data?.address?.toLowerCase()}") {
        transactions(orderDirection:desc, orderBy: timeStamp, first:9) {
          id
          timeStamp
          amount
        }
      }
    }`
  const [result] = useQuery({
    query: activeMembersQuery,
  })

  console.log(result)

  if (!account?.data?.address) {
    return <div></div>
  }
  if (result.fetching) {
    return <Loader />
  }
  if (result.error) {
    return <Text>There was an error loading your recent transactions</Text>
  }
  return (
    <Table>
      <thead>
        <tr>
          <th>
            <Text color='dimmed'>Amount</Text>
          </th>
          <th style={{ textAlign: 'right' }}>
            <Text color='dimmed'>Time</Text>
          </th>
        </tr>
      </thead>
      <tbody>
        {result.data?.member?.transactions?.map((txn) => (
          <tr key={txn.id}>
            <td>
              <Text color={+txn.amount < 0 ? 'red' : 'green'}>
                {txn.amount}
              </Text>
            </td>
            <td style={{ textAlign: 'right' }}>
              <Text color={+txn.amount < 0 ? 'red' : 'green'}>
                {time2TimeAgo(txn.timeStamp)}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function time2TimeAgo(ts) {
  // This function computes the delta between the
  // provided timestamp and the current time, then test
  // the delta for predefined ranges.

  var d = new Date() // Gets the current time
  var nowTs = Math.floor(d.getTime() / 1000) // getTime() returns milliseconds, and we need seconds, hence the Math.floor and division by 1000
  var seconds = nowTs - ts

  //more than 4 days
  if (seconds > 4 * 24 * 3600) {
    return 'a few days ago'
  }
  // more that two days
  if (seconds > 2 * 24 * 3600) {
    return 'a few days ago'
  }
  // a day
  if (seconds > 24 * 3600) {
    return 'yesterday'
  }

  if (seconds > 3600) {
    return 'a few hours ago'
  }
  if (seconds > 1800) {
    return 'Half an hour ago'
  }
  if (seconds > 60) {
    return Math.floor(seconds / 60) + ' minutes ago'
  }
}

export default RecentTransactions
