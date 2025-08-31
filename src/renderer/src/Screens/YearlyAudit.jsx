import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Loader from '../Components/Loader';
import { useNavigate } from 'react-router-dom';

const YearlyAudit = () => {
   const navigate = useNavigate();
   const [showLoader, setShowLoader] = useState(false);
   return (
      <div className="flex justify-between p-3 select-none gap-10 bg-[#d3cfe7] h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] relative">
         <div className="bg-[#e0ddee] w-full h-full rounded-4xl backdrop-blur-lg p-4">
            <div className="flex items-center justify-between gap-1 cursor-pointer">
               <div
                  className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 hover:drop-shadow-lg transition-all duration-200"
                  onClick={() => navigate('/')}>
                  <ChevronLeft size={23} />
                  <p className="font-bold">
                     Back [ <span className="text-indigo-500">YearlyAudit</span>{' '}
                     ]
                  </p>
               </div>
            </div>
            <div>{showLoader && <Loader />}</div>
         </div>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-2xl font-bold text-shadow-red-300 text-shadow-xs">Under Development</div>
      </div>
   );
};

export default YearlyAudit;
