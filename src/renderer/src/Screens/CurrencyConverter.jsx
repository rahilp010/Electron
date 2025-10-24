/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import CurrencyCard from '../components/currency/CurrencyCard'
import useCurrencyInfo from '../components/currency/useCurrencyInfo'
import Navbar from '../components/UI/Navbar'

const CurrencyConvertor = () => {
  const [amount, setAmount] = useState()
  const [from, setFrom] = useState('inr')
  const [to, setTo] = useState('usd')
  const [convertedAmount, setConvertedAmount] = useState()

  const currencyInfo = useCurrencyInfo(from)

  const options = Object.keys(currencyInfo)

  const swap = () => {
    setFrom(to)
    setTo(from)
    setConvertedAmount(Number(amount).toFixed(2))
    setAmount(Number(convertedAmount).toFixed(2))
  }

  const convert = () => {
    setConvertedAmount(Number(amount) * currencyInfo[to])
  }

  return (
    <div className="select-none gap-10 h-screen w-full transition-all duration-300 min-w-[720px] overflow-hidden">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Currency Converter</p>
      </div>
      <div className="flex justify-center items-center">
        <div className="w-full m-10 mx-40 bg-white rounded-4xl border border-gray-600 shadow-lg p-4 relative">
          <CurrencyCard
            label="From"
            amount={Number(amount)}
            currencyOptions={options}
            onCurrencyChange={(currency) => setFrom(currency)}
            selectCurrency={from}
            onAmountChange={(amount) => setAmount(amount)}
          />

          <span
            className="absolute left-[46%] top-30 text-center p-5  rounded-full text-white font-light bg-black hover:cursor-pointer flex items-center gap-2 hover:bg-black/80 hover:drop-shadow-lg transition-all duration-200 hover:scale-105"
            onClick={swap}
          >
            <ArrowUpDown size={20} />
          </span>

          <CurrencyCard
            label="To"
            amount={Number(convertedAmount)}
            currencyOptions={options}
            onCurrencyChange={(currency) => setTo(currency)}
            selectCurrency={to}
            onAmountChange={(amount) => setAmount(amount)}
            amountDisabled
          />

          <p
            className={`p-3 text-center bg-black rounded-xl text-white font-light m-3 hover:cursor-pointer transition-all duration-200 hover:bg-black/80 hover:drop-shadow-lg`}
            onClick={convert}
          >
            Convert {from.toUpperCase()} to {to.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CurrencyConvertor
