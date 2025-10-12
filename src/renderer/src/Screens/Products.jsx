/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState, useCallback, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUp, Import, PenLine, Plus, Trash } from 'lucide-react'
import Loader from '../components/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { deleteProduct, setClients, setProducts } from '../app/features/electronSlice'
import { toast } from 'react-toastify'
import SearchIcon from '@mui/icons-material/Search'
import { DateRangePicker, SelectPicker, InputGroup, Input } from 'rsuite'
import ProductModal from '../components/Modal/ProductModal'
import Navbar from '../components/UI/Navbar'
import ImportExcel from '../components/UI/ImportExcel'
import * as XLSX from 'xlsx'

// Constants
const TABLE_HEADERS = [
  // { key: 'id', label: 'ID', width: 'w-[80px]', sticky: true },
  { key: 'date', label: 'Date', width: 'w-[150px]' },
  { key: 'client', label: 'Client', width: 'w-[250px]' },
  { key: 'product', label: 'Product', width: 'w-[250px]' },
  { key: 'price', label: 'Price', width: 'w-[200px]' },
  { key: 'quantity', label: 'Quantity', width: 'w-[200px]' },
  { key: 'assetsType', label: 'Assets Type', width: 'w-[200px]' },
  { key: 'totalWorth', label: 'Total Worth', width: 'w-[200px]' },
  { key: 'action', label: 'Action', width: 'w-[150px]' }
]

const ASSETS_TYPE_OPTIONS = [
  { label: 'Raw Material', value: 'Raw Material' },
  { label: 'Finished Goods', value: 'Finished Goods' },
  { label: 'Assets', value: 'Assets' }
]

// Utility functions
const toThousands = (value) => {
  if (!value || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(value))
}

const formatProductId = (id) => {
  return id ? `RO${String(id).slice(-3).toUpperCase()}` : 'RO---'
}

const getClientName = (clientId, clients) => {
  if (!clientId || clientId === 0 || clientId === '') return '-'
  const client = clients.find((c) => String(c?.id) === String(clientId))
  return client ? client.clientName : '-'
}

const getAssetsTypeStyle = (assetsType) => {
  switch (assetsType) {
    case 'Raw Material':
      return 'text-[#166534] font-medium border border-[#8ffab5] bg-green-50'
    case 'Finished Goods':
      return 'border border-[#fef08a] text-[#854d0e] bg-yellow-50'
    case 'Assets':
      return 'border border-[#8a94fe] text-[#0e1a85] bg-blue-50'
    default:
      return 'border border-gray-300 text-gray-600 bg-gray-50'
  }
}

// Memoized ProductRow component
const ProductRow = memo(({ product, index, clients, onDelete, onEdit }) => {
  const isEven = index % 2 === 0
  const rowBg = isEven ? 'bg-white' : 'bg-[#f0f0f0]'
  const totalWorth = (product?.price || 0) * (product?.quantity || 0)

  return (
    <tr className={`text-sm text-center ${rowBg}`}>
      {/* <td className="px-4 py-3">{formatProductId(product?.id)}</td> */}
      <td className="px-4 py-3">{new Date(product?.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 tracking-wide">{getClientName(product?.clientId, clients)}</td>
      <td className="px-4 py-3 tracking-wide font-medium">
        {String(product?.name || '').toUpperCase()}
      </td>
      <td className="px-4 py-3">
        <div className="border border-[#67C090] text-[#568F87] bg-[#DDF4E7] p-1 px-2 rounded-full font-bold text-xs">
          ₹ {toThousands(product?.price)}
        </div>
      </td>
      <td className={`px-4 py-3 ${(product?.quantity || 0) <= 0 ? 'text-red-500' : ''}`}>
        <span className="bg-gray-300 px-2 py-1 rounded-full text-xs font-medium">
          {product?.quantity || 0}
        </span>
      </td>
      <td className="px-4 py-3 tracking-wide">
        <div
          className={`p-1 px-2 rounded-full font-medium text-xs ${getAssetsTypeStyle(product?.assetsType)}`}
        >
          {product?.assetsType || '-'}
        </div>
      </td>
      <td className="px-4 py-3 tracking-wide font-bold">₹ {toThousands(totalWorth)}</td>
      <td className="w-28">
        <div className="flex gap-3 justify-center items-center">
          <button
            className="text-red-500 p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={() => onDelete(product?.id)}
            title="Delete product"
          >
            <Trash size={12} />
          </button>
          <button
            className="text-purple-500 p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={() => onEdit(product)}
            title="Edit product"
          >
            <PenLine size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
})

// Custom hook for product operations
const useProductOperations = () => {
  const dispatch = useDispatch()

  const fetchProducts = useCallback(async () => {
    try {
      const response = await window.api?.getAllProducts()
      dispatch(setProducts(response))
    } catch (error) {
      toast.error('Failed to fetch products: ' + error.message)
      console.error('Error fetching products:', error)
    }
  }, [dispatch])

  const fetchClients = useCallback(async () => {
    try {
      const response = await window.api.getAllClients()
      dispatch(setClients(response))
    } catch (error) {
      toast.error('Failed to fetch clients: ' + error.message)
    }
  }, [dispatch])

  const handleDeleteProduct = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this product?')) return

      try {
        await window.api.deleteProduct(id)
        dispatch(deleteProduct(id))
        toast.success('Product deleted successfully')
      } catch (error) {
        toast.error('Failed to delete product: ' + error.message)
      }
    },
    [dispatch]
  )

  const handleEditProduct = useCallback(
    async (product, setSelectedProduct, setIsUpdateExpense, setShowModal) => {
      try {
        const response = await window.api?.getProductById(product.id)
        setSelectedProduct(response)
        setIsUpdateExpense(true)
        setShowModal(true)
      } catch (error) {
        toast.error('Failed to fetch product details: ' + error.message)
        console.error('Error fetching product:', error)
      }
    },
    []
  )

  return { fetchProducts, fetchClients, handleDeleteProduct, handleEditProduct }
}

// Main Component
const Products = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { fetchProducts, fetchClients, handleDeleteProduct, handleEditProduct } =
    useProductOperations()

  // State management
  const [showLoader, setShowLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [productFilter, setProductFilter] = useState('')
  const [assetsTypeFilter, setAssetsTypeFilter] = useState('')
  const [importFile, setImportFile] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [visibleCount, setVisibleCount] = useState(30)
  const tableContainerRef = useRef(null)

  const products = useSelector((state) => state.electron.products?.data || [])
  const clients = useSelector((state) => state.electron.clients?.data || [])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(products)) return []
    const query = searchQuery?.toLowerCase()

    const filtered = products.filter((data) => {
      const matchesSearch =
        !query ||
        [
          data?.id?.toString(),
          data?.name?.toLowerCase(),
          data?.price?.toString(),
          data?.quantity?.toString(),
          data?.assetsType?.toLowerCase(),
          getClientName(data?.clientId, clients)?.toLowerCase()
        ].some((field) => field?.includes(query))

      const matchesProduct = !productFilter || data.id === productFilter
      const matchesAssetsType = !assetsTypeFilter || data.assetsType === assetsTypeFilter

      let matchesDate = true
      if (dateRange?.length === 2) {
        const createdDate = new Date(data.createdAt)
        const [start, end] = dateRange
        matchesDate = createdDate >= new Date(start) && createdDate <= new Date(end)
      }

      return matchesSearch && matchesProduct && matchesDate && matchesAssetsType
    })

    // ✅ Sorting logic
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || 0
        const bVal = b[sortConfig.key] || 0

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [products, searchQuery, productFilter, dateRange, assetsTypeFilter, clients, sortConfig])

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
    // Reset visible count when sorting to start from top
    setVisibleCount(30)
  }, [])

  const loadMore = useCallback(() => {
    if (visibleCount < filteredData.length) {
      setVisibleCount((prev) => prev + 30)
    }
  }, [visibleCount, filteredData.length])

  const handleScroll = useCallback(() => {
    if (tableContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore()
      }
    }
  }, [loadMore])

  useEffect(() => {
    const container = tableContainerRef?.current
    if (container) {
      container?.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Memoized visible data for rendering
  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleCount)
  }, [filteredData, visibleCount])

  // Memoized statistics (based on full filtered data)
  const statistics = useMemo(() => {
    const totalAssetsValue = filteredData.reduce(
      (acc, item) => acc + (item?.price || 0) * (item?.quantity || 0),
      0
    )
    const totalQuantity = filteredData.length

    return { totalAssetsValue, totalQuantity }
  }, [filteredData])

  useEffect(() => {
    fetchProducts()
    fetchClients()
  }, [fetchProducts, fetchClients])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30)
  }, [filteredData])

  // Event handlers
  const handleAddProduct = useCallback(() => {
    setSelectedProduct(null)
    setIsUpdateExpense(false)
    setShowModal(true)
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const handleImportExcel = useCallback(
    async (filePath) => {
      try {
        const result = await window.api.importExcel(filePath, 'products')

        if (result.success) {
          toast.success(`Imported ${result.count} products successfully`)
          await fetchProducts()
          setImportFile(false)
        } else {
          toast.error(`Import failed: ${result.error}`)
        }
      } catch (error) {
        toast.error('Failed to import Excel: ' + error.message)
      }
    },
    [fetchProducts]
  )

  const handleExportExcel = useCallback(() => {
    try {
      const exportData = filteredData.map((product) => ({
        ID: formatProductId(product.id),
        Date: new Date(product.createdAt).toLocaleDateString(),
        Client: getClientName(product.clientId, clients),
        'Product Name': product.name,
        Price: product.price,
        Quantity: product.quantity,
        'Assets Type': product.assetsType,
        'Total Worth':
          product.assetsType === 'Finished Goods'
            ? product.quantity
            : (product.price || 0) * (product.quantity || 0)
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Products')
      XLSX.writeFile(wb, `products_${new Date().toISOString().split('T')[0]}.xlsx`)

      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data: ' + error.message)
    }
  }, [filteredData, clients])

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Products</p>
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
            onClick={handleAddProduct}
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
            <p className="text-sm font-light mb-1">Total Product Value</p>
            <p className="text-2xl font-light">₹ {toThousands(statistics.totalAssetsValue)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Products</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">{statistics.totalQuantity}</span> Products
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
                    placeholder="Search products..."
                    value={searchQuery || ''}
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
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={products.map((product) => ({
                    label: product?.name,
                    value: product?.id
                  }))}
                  onChange={setProductFilter}
                  placeholder="Select Product"
                  style={{ width: 150 }}
                  placement="bottomEnd"
                  searchable
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
                <SelectPicker
                  data={ASSETS_TYPE_OPTIONS}
                  onChange={setAssetsTypeFilter}
                  placeholder="Select Assets Type"
                  style={{ width: 150 }}
                  searchable={false}
                  container={() => document.body}
                  menuStyle={{ zIndex: 99999, position: 'absolute' }}
                />
              </div>
            </div>

            {/* Table */}
            <div
              ref={tableContainerRef}
              className="overflow-x-auto customScrollbar border-2 border-gray-200 rounded-lg h-screen mt-5"
            >
              <table className="min-w-max border-collapse table-fixed">
                <thead className="bg-gray-200 relative z-20">
                  <tr className="text-sm sticky top-0 z-20">
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.key}
                        className={`px-4 py-3 border-r border-gray-300 ${header.width}
          ${header.sticky ? 'sticky left-0 z-30 bg-gray-200 shadow-md' : 'bg-gray-200'}
          
        `}
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
                    visibleData.map((product, index) => (
                      <ProductRow
                        key={product?.id || index}
                        product={product}
                        index={index}
                        clients={clients}
                        onDelete={handleDeleteProduct}
                        onEdit={(product) =>
                          handleEditProduct(
                            product,
                            setSelectedProduct,
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
        <ProductModal
          setShowModal={setShowModal}
          existingProduct={selectedProduct}
          isUpdateExpense={isUpdateExpense}
          type="product"
        />
      )}
    </div>
  )
}

export default Products
