/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react'
import { Trash, PenLine, Plus, Import, FileUp } from 'lucide-react'
import Loader from '../components/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { deleteClient, setClients } from '../app/features/electronSlice'
import SearchIcon from '@mui/icons-material/Search'
import { toast } from 'react-toastify'
import { DateRangePicker, SelectPicker, InputGroup, Input } from 'rsuite'
import ClientModal from '../components/Modal/ClientModal'
import Navbar from '../components/UI/Navbar'

const ClientList = () => {
  const dispatch = useDispatch()
  const [showLoader, setShowLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [clientFilter, setClientFilter] = useState('')

  const fetchClients = async () => {
    const response = await window.api.getAllClients()
    dispatch(setClients(response))
  }

  const clients = useSelector((state) => state.electron.clients.data || [])

  const filteredData = useMemo(() => {
    if (!Array.isArray(clients)) return []
    const query = searchQuery.toLowerCase()
    let result = clients.filter((data) => {
      const matchesSearch =
        data?.id?.toString().includes(query) ||
        data?.clientName?.toLowerCase().includes(query) ||
        data?.phoneNo?.toString().includes(query) ||
        data?.pendingAmount?.toString().includes(query) ||
        data?.paidAmount?.toString().includes(query) ||
        data?.pendingFromOurs?.toString().includes(query)

      const matchesClient = clientFilter ? data.id === clientFilter : true

      let matchesDate = true
      if (dateRange && dateRange.length === 2) {
        const createdDate = new Date(data.createdAt)
        const start = new Date(dateRange[0])
        const end = new Date(dateRange[1])
        matchesDate = createdDate >= start && createdDate <= end
      }

      return matchesSearch && matchesClient && matchesDate
    })
    return result
  }, [clients, searchQuery, clientFilter, dateRange])

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  const handleDeleteClient = async (id) => {
    const response = await window.api.deleteClient(id)
    dispatch(deleteClient(response))
    fetchClients()
    toast.success('Client data deleted successfully')
  }

  const handleEditClient = async (client) => {
    const response = await window.api.getClientById(client.id)
    setSelectedClient(response)
    setIsUpdateExpense(true)
    setShowModal(true)
  }

  const handleAddClient = async () => {
    const response = await window.api.getAllClients()
    dispatch(setClients(response))
    setSelectedClient(null)
    setIsUpdateExpense(false)
    setShowModal(true)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLoader(false)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [])

  const handleOnChange = (value) => {
    setSearchQuery(value)
  }

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Clients</p>
        <div className="mx-7 flex gap-2">
          <div className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm">
            <Import size={16} />
            <p className="text-sm">Import</p>
          </div>
          <div className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm">
            <FileUp size={16} />
            <p className="text-sm">Export</p>
          </div>
          <div
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={handleAddClient}
          >
            <Plus size={16} />
            <p className="text-sm">ADD</p>
          </div>
        </div>
      </div>
      <div>{showLoader && <Loader />}</div>
      <div className="overflow-y-auto h-screen customScrollbar">
        <div className="border border-gray-200 shadow px-5 py-3 mx-6 rounded-3xl my-4 flex">
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Assets Value</p>
            <p className="text-2xl font-light">₹ {toThousands(10000)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Products</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">200</span>
              Products
            </p>
          </div>
        </div>
        <div className="w-full h-[calc(100%-40px)] my-3 bg-white overflow-y-auto customScrollbar relative">
          <div className="mx-7 my-3">
            <div className="flex justify-between">
              <div>
                <InputGroup size="md">
                  <Input
                    placeholder="Search..."
                    value={searchQuery || ''}
                    onChange={(value) => handleOnChange(value)}
                    className={`rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none`}
                  />
                  <InputGroup.Button>
                    <SearchIcon />
                  </InputGroup.Button>
                </InputGroup>
              </div>
              <div className="flex gap-2">
                <DateRangePicker
                  format="dd/MM/yyyy"
                  character=" ~ "
                  placeholder="Select Date Range"
                  onChange={(value) => setDateRange(value)}
                  placement="bottomEnd"
                />
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client?.clientName,
                    value: client?.id // DB ID
                  }))}
                  onChange={(value) => setClientFilter(value)}
                  placeholder="Select Client"
                  style={{ width: 150 }}
                />
              </div>
            </div>

            <div className="overflow-x-auto customScrollbar border-2 border-gray-200 rounded-lg h-screen mt-5 ">
              <table className="min-w-max border-collapse table-fixed">
                <thead className="bg-gray-200">
                  <tr className="text-sm sticky top-0">
                    <th className="px-4 py-3 border-r border-gray-300 w-[80px] sticky left-0 bg-gray-200 z-10">
                      ID
                    </th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[150px]">Date</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[200px]">Client Name</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[200px]">Phone No</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[170px]">
                      Pending Payment
                    </th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[170px]">Paid Amount</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[150px]">Our Pendings</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[150px]">Loss</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[150px]">Total Worth</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[150px]">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {filteredData && filteredData.length === 0 && (
                    <tr className="text-center h-72">
                      <td
                        colSpan={7}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  )}
                  {filteredData.map((client, index) => (
                    <tr
                      key={client.id}
                      className={`text-sm text-center ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]'
                      }`}
                    >
                      <td
                        className={`px-4 py-3 w-[80px] sticky left-0 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]'
                        } z-10 text-xs `}
                      >
                        {client?.id ? `RO${String(client.id).slice(-3).toUpperCase()}` : 'RO---'}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 px-6">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center border border-blue-300 justify-center text-xs font-medium text-blue-600 mr-3">
                            {client.clientName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          {client.clientName}
                        </div>
                      </td>
                      <td className="px-4 py-3">{client.phoneNo}</td>
                      <td className={`px-4 py-3`}>
                        <p className="border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] p-1 rounded-4xl font-bold">
                          ₹ {toThousands(Number(client.pendingAmount).toFixed(0))}
                        </p>
                      </td>
                      <td className={`px-4 py-3 font-bold`}>
                        <p>₹ {toThousands(Number(client.paidAmount).toFixed(0))}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#166534] bg-[#dcfce7] border-1 border-[#8ffab5] p-1 rounded-4xl font-bold">
                          ₹ {toThousands(Number(client.pendingFromOurs).toFixed(0))}
                        </p>
                      </td>

                      <td className="px-4 py-3 tracking-wide">
                        <p className="text-[#991b1b] bg-[#fee2e2] border-1 border-[#ffadad] p-1 rounded-4xl font-bold">
                          ₹{' '}
                          {toThousands(
                            Number(client.pendingFromOurs) + Number(client.pendingAmount)
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 tracking-wide">
                        <p>
                          ₹{' '}
                          {toThousands(
                            Number(client.pendingFromOurs) +
                              Number(client.pendingAmount) +
                              (Number(client.paidAmount) - Number(client.pendingFromOurs))
                          )}
                        </p>
                      </td>
                      <td className="w-28 ">
                        <div>
                          <div className="flex gap-3 justify-center relative transition cursor-pointer items-center">
                            <Trash
                              className="text-red-500 text-sm p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-120"
                              onClick={() => handleDeleteClient(client.id)}
                              size={28}
                            />
                            <PenLine
                              className="text-purple-500 text-sm p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-120"
                              onClick={() => handleEditClient(client)}
                              size={28}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <ClientModal
          setShowModal={setShowModal}
          existingClient={selectedClient}
          isUpdateExpense={isUpdateExpense}
          type="client"
        />
      )}
    </div>
  )
}

export default ClientList
