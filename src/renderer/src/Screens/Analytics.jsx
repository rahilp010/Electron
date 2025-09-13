/* eslint-disable prettier/prettier */
import Navbar from '../components/UI/Navbar'
import { useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'

const Analytics = () => {
  const navigate = useNavigate()
  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-auto customScrollbar">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Analytics</p>
      </div>

      {/* {showLoader && <Loader />} */}
      <div>
        <div className="grid grid-cols-12 gap-2 p-6 bg-gray-50 min-h-[500px] font-poppins">
          <div className="col-span-4 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex items-center justify-between gap-4 h-[150px] min-w-0 relative">
            <div className="flex flex-col flex-shrink min-w-0 mx-2">
              <p className="text-xl absolute top-5">Sales</p>
              <p className="text-3xl font-bold mt-3">₹ 14,00,000</p>
              <p className="text-sm text-gray-500 absolute bottom-6">
                <span className="text-green-500 font-semibold">+10%</span> from last month
              </p>
            </div>
            <div className="flex-grow min-w-0">
              <Stack direction="row" sx={{ width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <SparkLineChart plotType="bar" data={[1, 4, 2, 5, 7, 2, 4, 6]} height={100} />
                </Box>
              </Stack>
            </div>
          </div>

          <div className="col-span-4 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex items-center justify-between gap-4 h-[150px] min-w-0 relative">
            <div className="flex flex-col flex-shrink min-w-0 mx-2">
              <p className="text-xl absolute top-5">Purchase</p>
              <p className="text-3xl font-bold mt-3">₹ 14,00,000</p>
              <p className="text-sm text-gray-500 absolute bottom-6">
                <span className="text-red-500 font-semibold">+10%</span> from last month
              </p>
            </div>
            <div className="flex-grow min-w-0">
              <Stack direction="row" sx={{ width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <SparkLineChart plotType="bar" data={[1, 4, 2, 5, 7, 2, 4, 6]} height={100} />
                </Box>
              </Stack>
            </div>
          </div>

          {/* Time Tracker */}
          <div className="col-span-4 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex items-center justify-between gap-4 h-[150px] min-w-0 relative">
            <div className="flex flex-col flex-shrink min-w-0 mx-2">
              <p className="text-xl absolute top-5">AVG Income Per Day</p>
              <p className="text-3xl font-bold mt-3">₹ 14,00,000</p>
              <p className="text-sm text-gray-500 absolute bottom-6">
                <span className="text-red-500 font-semibold">+10%</span> from last month
              </p>
            </div>
            <div className="flex-grow min-w-0">
              <Stack direction="row" sx={{ width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <SparkLineChart plotType="bar" data={[1, 4, 2, 5, 7, 2, 4, 6]} height={100} />
                </Box>
              </Stack>
            </div>
          </div>

          {/* Onboarding Progress */}
          <div className="col-span-8 row-span-2 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex  flex-col items-center justify-center gap-5 h-[450px]">
            <div className="flex flex-col bg-gray-900 rounded-4xl p-3 items-center justify-center gap-5">
              <button
                className="mt-4 bg-white text-black px-20 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-white/80"
                onClick={() => navigate('/bank')}
              >
                Bank
              </button>
            </div>

            <div className="flex flex-col bg-gray-900 rounded-4xl p-3 items-center justify-center gap-3">
              <button
                className="mt-4 bg-white text-black px-20 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-white/80"
                onClick={() => navigate('/cash')}
              >
                Cash
              </button>
            </div>
          </div>

          <div className="col-span-4 row-span-2 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
            <button
              className="mt-4 bg-black text-white px-10 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
              onClick={() => navigate('/analytics')}
            >
              Reports & Analytics
            </button>
          </div>

          <div className="col-span-4 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
            <button
              className="mt-4 bg-black text-white px-16 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
              onClick={() => navigate('/products')}
            >
              Add Products
            </button>
          </div>

          <div className="col-span-4 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
            <button
              className="mt-4 bg-black text-white px-16 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
              onClick={() => navigate('/clients')}
            >
              Add Clients
            </button>
          </div>

          {/* Time Tracker */}
          <div className="col-span-4 bg-white rounded-4xl border border-gray-100 shadow-lg p-4 flex flex-col items-center justify-center gap-4">
            <button
              className="mt-4 bg-black text-white px-18 py-2 rounded-full shadow cursor-pointer transition-all duration-200 hover:bg-black/80"
              onClick={() => navigate('/purchase')}
            >
              Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
