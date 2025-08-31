import React, { useId } from 'react';
import country from './country';

const CurrencyCard = ({
   label,
   amount,
   onAmountChange,
   onCurrencyChange,
   currencyOptions = [],
   selectCurrency = 'inr',
   amountDisabled = false,
   currencyDisabled = false,
}) => {
   const amountId = useId();
   const currencyFlag = `https://flagsapi.com/${country[selectCurrency]}/shiny/32.png`;

   return (
      <>
         <div className="bg-white rounded-lg h-24 items-center m-4 min-w-[500px]">
            <div className="flex justify-between p-3 px-5 font-bold">
               <label htmlFor={amountId} className="font-light tracking-wide">
                  {label}
               </label>
               <p className="font-light tracking-wide">Currency Type</p>
            </div>
            <div className="flex justify-between px-5 font-bold items-center">
               <input
                  type="number"
                  name="amount"
                  id={amountId}
                  className="outline-none hover:cursor-pointer w-40 border border-gray-300 rounded-md p-1 indent-1"
                  value={amount}
                  disabled={amountDisabled}
                  onChange={(e) =>
                     onAmountChange && onAmountChange(Number(e.target.value))
                  }
               />

               <div className="flex items-center gap-2 border border-gray-300 rounded-md px-2">
                  <div>
                     <img src={currencyFlag} alt="currency flag" />
                  </div>
                  <select
                     name=""
                     id=""
                     className="outline-none hover:cursor-pointer w-24"
                     value={selectCurrency}
                     onChange={(e) =>
                        onCurrencyChange && onCurrencyChange(e.target.value)
                     }
                     disabled={currencyDisabled}>
                     {currencyOptions.length > 0 ? (
                        currencyOptions
                           .filter((currency) => country[currency])
                           .map((currency) => (
                              <option key={currency} value={currency}>
                                 {String(currency).toUpperCase()}
                              </option>
                           ))
                     ) : (
                        <option disabled>No Data Found</option>
                     )}
                  </select>
               </div>
            </div>
         </div>
      </>
   );
};

export default CurrencyCard;
