/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { Trash, PenLine, Plus, Import, FileUp } from 'lucide-react'
import Loader from '../components/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { deleteClient, setClients } from '../app/features/electronSlice'
import SearchIcon from '@mui/icons-material/Search'
import { toast } from 'react-toastify'
import { DateRangePicker, SelectPicker, InputGroup, Input } from 'rsuite'
import ClientModal from '../components/Modal/ClientModal'
import Navbar from '../components/UI/Navbar'
import * as XLSX from 'xlsx'
import fs from 'fs'
import ImportExcel from '../components/UI/ImportExcel'

// Constants
const TABLE_HEADERS = [
  { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]' },
  { key: 'clientName', label: 'Client Name', width: 'w-[200px]' },
  { key: 'phoneNo', label: 'Phone No', width: 'w-[200px]' },
  { key: 'pendingAmount', label: 'Pending Payment', width: 'w-[170px]' },
  { key: 'paidAmount', label: 'Paid Amount', width: 'w-[170px]' },
  { key: 'pendingFromOurs', label: 'Our Pendings', width: 'w-[150px]' },
  { key: 'loss', label: 'Loss', width: 'w-[150px]' },
  { key: 'totalWorth', label: 'Total Worth', width: 'w-[150px]' },
  { key: 'action', label: 'Action', width: 'w-[150px]' }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}

const formatClientId = (id) => {
  return id ? `RO${String(id).slice(-3).toUpperCase()}` : 'RO---'
}

const getInitials = (name) => {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || ''
  )
}

const calculateLoss = (pendingFromOurs, pendingAmount) => {
  return Number(pendingFromOurs || 0) + Number(pendingAmount || 0)
}

const calculateTotalWorth = (pendingFromOurs, pendingAmount, paidAmount) => {
  return (
    Number(pendingFromOurs || 0) +
    Number(pendingAmount || 0) +
    (Number(paidAmount || 0) - Number(pendingFromOurs || 0))
  )
}

// Memoized ClientRow component
const ClientRow = memo(({ client, index, onDelete, onEdit }) => {
  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-[#f0f0f0]'

  return (
    <tr className={`text-sm text-center ${rowBg}`}>
      <td className={`px-4 py-3 w-[80px] sticky left-0 ${rowBg} z-10 text-xs`}>
        {formatClientId(client?.id)}
      </td>
      <td className="px-4 py-3">{new Date(client.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 px-6">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center border border-blue-300 justify-center text-xs font-medium text-blue-600 mr-3">
            {getInitials(client.clientName)}
          </div>
          {client.clientName}
        </div>
      </td>
      <td className="px-4 py-3">{client.phoneNo === '' ? '-' : client.phoneNo}</td>
      <td className="px-4 py-3">
        <div className="border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] p-1 rounded-full font-bold text-xs px-2">
          ₹ {toThousands(Number(client.pendingAmount).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3 font-bold">₹ {toThousands(Number(client.paidAmount).toFixed(0))}</td>
      <td className="px-4 py-3">
        <div className="text-[#166534] bg-[#dcfce7] border border-[#8ffab5] p-1 rounded-full font-bold text-xs px-2">
          ₹ {toThousands(Number(client.pendingFromOurs).toFixed(0))}
        </div>
      </td>
      <td className="px-4 py-3 tracking-wide">
        <div className="text-[#991b1b] bg-[#fee2e2] border border-[#ffadad] p-1 rounded-full font-bold text-xs px-2">
          ₹ {toThousands(calculateLoss(client.pendingFromOurs, client.pendingAmount))}
        </div>
      </td>
      <td className="px-4 py-3 tracking-wide">
        ₹{' '}
        {toThousands(
          calculateTotalWorth(client.pendingFromOurs, client.pendingAmount, client.paidAmount)
        )}
      </td>
      <td className="w-28">
        <div className="flex gap-3 justify-center items-center">
          <button
            className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={() => onDelete(client.id)}
            title="Delete client"
          >
            <Trash size={12} />
          </button>
          <button
            className="text-purple-500 p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={() => onEdit(client)}
            title="Edit client"
          >
            <PenLine size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
})

// Custom hook for client operations
const useClientOperations = () => {
  const dispatch = useDispatch()

  const fetchClients = useCallback(async () => {
    try {
      const response = await window.api.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      toast.error('Failed to fetch clients: ' + error.message)
    }
  }, [dispatch])

  const handleDeleteClient = useCallback(
    async (id) => {
      try {
        const response = await window.api.deleteClient(id)
        dispatch(deleteClient(response))
        await fetchClients()
        toast.success('Client data deleted successfully')
      } catch (error) {
        toast.error('Failed to delete client: ' + error.message)
      }
    },
    [dispatch, fetchClients]
  )

  const handleEditClient = useCallback(
    async (client, setSelectedClient, setIsUpdateExpense, setShowModal) => {
      try {
        const response = await window.api.getClientById(client.id)
        setSelectedClient(response)
        setIsUpdateExpense(true)
        setShowModal(true)
      } catch (error) {
        toast.error('Failed to fetch client details: ' + error.message)
      }
    },
    []
  )

  return { fetchClients, handleDeleteClient, handleEditClient }
}

// Main Component
const ClientList = () => {
  const dispatch = useDispatch()
  const { fetchClients, handleDeleteClient, handleEditClient } = useClientOperations()

  // State management
  const [showLoader, setShowLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [clientFilter, setClientFilter] = useState('')
  const [importFile, setImportFile] = useState(false)

  const clients = useSelector((state) => state.electron.clients.data || [])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(clients)) return []
    const query = searchQuery.toLowerCase()

    return clients.filter((data) => {
      // Search filter
      const matchesSearch =
        !query ||
        [
          data?.id?.toString(),
          data?.clientName?.toLowerCase(),
          data?.phoneNo?.toString(),
          data?.pendingAmount?.toString(),
          data?.paidAmount?.toString(),
          data?.pendingFromOurs?.toString()
        ].some((field) => field?.includes(query))

      // Client filter
      const matchesClient = !clientFilter || data.id === clientFilter

      // Date filter
      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return matchesSearch && matchesClient && matchesDate
    })
  }, [clients, searchQuery, clientFilter, dateRange])

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalAssets = filteredData.reduce(
      (sum, client) =>
        sum +
        Number(
          calculateTotalWorth(client.pendingFromOurs, client.pendingAmount, client.paidAmount) || 0
        ),
      0
    )
    const totalProducts = filteredData.length

    return { totalAssets, totalProducts }
  }, [filteredData])

  // Event handlers
  const handleAddClient = useCallback(async () => {
    setSelectedClient(null)
    setIsUpdateExpense(false)
    setShowModal(true)
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'clients')

        if (result.success) {
          toast.success(`Imported ${result.count} rows successfully`)
          await fetchClients()
          setImportFile(false)
        } else {
          toast.error(`Import failed: ${result.error}`)
        }
      } catch (error) {
        toast.error('Failed to import Excel: ' + error.message)
      }
    },
    [fetchClients]
  )

  const handleExportExcel = useCallback(() => {
    try {
      const exportData = filteredData.map((client) => ({
        ID: formatClientId(client.id),
        Date: new Date(client.createdAt).toLocaleDateString(),
        'Client Name': client.clientName,
        'Phone No': client.phoneNo || '-',
        'Pending Amount': client.pendingAmount,
        'Paid Amount': client.paidAmount,
        'Pending From Ours': client.pendingFromOurs,
        Loss: calculateLoss(client.pendingFromOurs, client.pendingAmount),
        'Total Worth': calculateTotalWorth(
          client.pendingFromOurs,
          client.pendingAmount,
          client.paidAmount
        )
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Clients')
      XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data: ' + error.message)
    }
  }, [filteredData])

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden relative">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Clients</p>
        <div className="mx-7 flex gap-2">
          <button
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => setImportFile(!importFile)}
          >
            <Import size={16} />
            <span className="text-sm">Import</span>
          </button>
          <button
            className="flex items-center gap-2 border border-gray-300 w-fit p-1.5 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={handleExportExcel}
          >
            <FileUp size={16} />
            <span className="text-sm">Export</span>
          </button>
          <button
            className="text-black flex items-center cursor-pointer gap-1 border border-gray-300 w-fit p-1 px-3 rounded-sm hover:bg-black hover:text-white transition-all duration-300 hover:scale-105"
            onClick={handleAddClient}
          >
            <Plus size={16} />
            <span className="text-sm">ADD</span>
          </button>
        </div>
      </div>

      {/* Import Excel Component */}
      {importFile && (
        <ImportExcel onFileSelected={handleImportExcel} onClose={() => setImportFile(false)} />
      )}

      {/* Loader */}
      {showLoader && <Loader />}

      <div className="overflow-y-auto h-screen customScrollbar">
        {/* Statistics Cards */}
        <div className="border border-gray-200 shadow px-5 py-3 mx-6 rounded-3xl my-4 flex">
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light mb-1">Total Assets Value</p>
            <p className="text-2xl font-light">₹ {toThousands(statistics.totalAssets)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Clients</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">{statistics.totalProducts}</span> Clients
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full h-[calc(100%-40px)] my-3 bg-white overflow-y-auto customScrollbar relative">
          <div className="mx-7 my-3">
            {/* Filters */}
            <div className="flex justify-between mb-4">
              <div>
                <InputGroup size="md">
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="rounded-xl border-2 indent-2 border-[#d4d9fb] outline-none"
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
                  onChange={setDateRange}
                  placement="bottomEnd"
                />
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client?.clientName,
                    value: client?.id
                  }))}
                  onChange={setClientFilter}
                  placeholder="Select Client"
                  style={{ width: 150 }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto customScrollbar border-2 border-gray-200 rounded-lg h-screen mt-5">
              <table className="min-w-max border-collapse table-fixed">
                <thead className="bg-gray-200">
                  <tr className="text-sm sticky top-0">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.key}
                        className={`px-4 py-3 border-r border-gray-300 ${header.width} ${
                          header.sticky ? 'sticky left-0 bg-gray-200 z-10' : ''
                        }`}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr className="text-center h-72">
                      <td
                        colSpan={TABLE_HEADERS.length}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((client, index) => (
                      <ClientRow
                        key={client.id}
                        client={client}
                        index={index}
                        onDelete={handleDeleteClient}
                        onEdit={(client) =>
                          handleEditClient(
                            client,
                            setSelectedClient,
                            setIsUpdateExpense,
                            setShowModal
                          )
                        }
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
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
