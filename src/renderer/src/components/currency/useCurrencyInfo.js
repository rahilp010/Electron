/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react'

const useCurrencyInfo = (currency) => {
  const [data, setData] = useState({})
  const date = new Date().toLocaleDateString().split('/').reverse().join('-')

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response = await fetch(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${currency}.json`
        )

        if (!response.ok) {
          // If the version doesn't exist, fallback to latest
          response = await fetch(
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.json`
          )
        }

        const json = await response.json()
        setData(json[currency])
      } catch (error) {
        console.error('Error fetching currency data:', error)
      }
    }

    fetchData()
  }, [currency, date])

  return data
}

export default useCurrencyInfo
