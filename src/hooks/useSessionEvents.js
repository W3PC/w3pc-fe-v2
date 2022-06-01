import React, { useContext, createContext, useState } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { creditPoolAddress } from '../constants'
import creditPoolAbi from '../constants/abis/CreditPool.json'

export const SessionEventsContext = createContext()

export const SessionsEventsProvider = ({ children }) => {
  const [sessionEvents, setSessionEvents] = useState({})
  const [sessionTransactions, setSessionTransactions] = useState([])
  const account = useAccount()

  const addSessionCreditEvent = (amount, address = account.data.address) => {
    const obj = { ...sessionEvents }

    if (obj[address]) {
      if (obj[address].credits) {
        obj[address].credits = obj[address].credits.add(amount)
        setSessionEvents(obj)
      } else {
        obj[address].credits = amount
        setSessionEvents(obj)
      }
    } else {
      obj[address] = { credits: amount }
      setSessionEvents(obj)
    }
  }

  const addSessionTransaction = (amount, hash) => {
    const arr = [...sessionTransactions]
    const d = new Date()
    const nowTs = Math.floor(d.getTime() / 1000)

    arr.push({ amount: amount, id: hash, timeStamp: nowTs })

    setSessionTransactions(arr)
  }

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
    <SessionEventsContext.Provider
      value={{
        sessionEvents,
        sessionTransactions,
        addSessionCreditEvent,
        addSessionTransaction,
        userCredits,
      }}
    >
      {children}
    </SessionEventsContext.Provider>
  )
}

export const useSessionEvents = () => {
  const events = useContext(SessionEventsContext)
  return { ...events }
}
