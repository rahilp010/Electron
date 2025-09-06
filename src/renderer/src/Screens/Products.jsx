/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, FileUp, Import, PenLine, Plus, Trash } from 'lucide-react'
import Loader from '../Components/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { deleteProduct, setClients, setProducts } from '../app/features/electronSlice'
import { toast } from 'react-toastify'
import SearchIcon from '@mui/icons-material/Search'
import { DateRangePicker, SelectPicker, InputGroup, Input } from 'rsuite'
import ProductModal from '../Components/Modal/ProductModal'
import Navbar from '../Components/UI/Navbar'

const Products = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [showLoader, setShowLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isUpdateExpense, setIsUpdateExpense] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [productFilter, setProductFilter] = useState('')
  const [assetsTypeFilter, setAssetsTypeFilter] = useState('')

  const products = useSelector((state) => state.electron.products?.data || [])
  const clients = useSelector((state) => state.electron.clients?.data || [])

  const fetchProducts = async () => {
    try {
      setShowLoader(true)
      const response = await window.api?.getAllProducts()
      dispatch(setProducts(response))
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setShowLoader(false)
    }
  }

  const fetchClients = async () => {
    const response = await window.api.getAllClients()
    dispatch(setClients(response))
  }

  const getClientName = (id) => {
    const client = clients.find((c) => String(c?.id) === String(id?.id))
    return client ? client.clientName : ''
  }

  const filteredData = useMemo(() => {
    if (!Array.isArray(products)) return []
    const query = searchQuery?.toLowerCase()
    let result = products.filter((data) => {
      const matchesSearch =
        data?.id?.toString().includes(query) ||
        data?.name?.toLowerCase().includes(query) ||
        data?.price?.toString().includes(query) ||
        data?.quantity?.toString().includes(query) ||
        data?.assetsType?.toLowerCase().includes(query) ||
        getClientName(data?.clientId)?.toLowerCase().includes(query)

      const matchesProduct = productFilter ? data.id === productFilter : true

      const matchesAssetsType = assetsTypeFilter ? data.assetsType === assetsTypeFilter : true

      let matchesDate = true
      if (dateRange && dateRange.length === 2) {
        const createdDate = new Date(data.createdAt)
        const start = new Date(dateRange[0])
        const end = new Date(dateRange[1])
        matchesDate = createdDate >= start && createdDate <= end
      }

      return matchesSearch && matchesProduct && matchesDate && matchesAssetsType
    })
    return result
  }, [products, searchQuery, productFilter, dateRange, assetsTypeFilter])

  const handleDeleteProduct = async (id) => {
    try {
      await window.api.deleteProduct(id)
      dispatch(deleteProduct(id)) // directly remove by ID
      toast.success('Product deleted successfully')
    } catch (err) {
      toast.error('Failed to delete product')
    }
  }

  const handleEditProduct = async (product) => {
    try {
      const response = await window.api?.getProductById(product.id)
      setSelectedProduct(response)
      setIsUpdateExpense(true)
      setShowModal(true)
    } catch (err) {
      console.error('Error fetching product:', err)
      toast.error('Failed to edit product')
    }
  }

  const handleAddProduct = async () => {
    const response = await window.api?.getAllProducts()
    dispatch(setProducts(response))
    setSelectedProduct(null)
    setIsUpdateExpense(false)
    setShowModal(true)
  }

  useEffect(() => {
    fetchProducts()
    fetchClients()
  }, [])

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  const totalAssetsValue = useMemo(() => {
    return products?.reduce((acc, item) => acc + item?.price * item?.quantity, 0) ?? 0
  }, [products])

  const handleOnChange = (value) => {
    setSearchQuery(value)
  }

  return (
    <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden">
      <div className="w-full sticky top-0 z-10">
        <Navbar />
      </div>
      <div className="flex justify-between mt-5 pb-2 items-center">
        <p className="text-3xl font-light mx-7">Products</p>
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
            onClick={handleAddProduct}
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
            <p className="text-2xl font-light">₹ {toThousands(totalAssetsValue)}</p>
          </div>
          <div className="mx-5 border-r w-52">
            <p className="text-sm font-light">Total Products</p>
            <p className="font-light text-sm">
              <span className="font-bold text-2xl">
                {products?.reduce((acc, item) => acc + item?.quantity, 0)}{' '}
              </span>
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
                  data={products.map((product) => ({
                    label: product?.name,
                    value: product?.id // DB ID
                  }))}
                  onChange={(value) => setProductFilter(value)}
                  placeholder="Select Product"
                  style={{ width: 150 }}
                />
                <SelectPicker
                  data={[
                    { label: 'Raw Material', value: 'Raw Material' },
                    {
                      label: 'Finished Goods',
                      value: 'Finished Goods'
                    },
                    { label: 'Assets', value: 'Assets' }
                  ]}
                  onChange={(value) => setAssetsTypeFilter(value)}
                  placeholder="Select Assets Type"
                  style={{ width: 150 }}
                />
              </div>
            </div>

            <div className="overflow-x-auto customScrollbar border-2 border-gray-200 rounded-lg h-screen mt-5 ">
              <table className="min-w-max border-collapse  table-fixed">
                <thead className="bg-gray-200">
                  <tr className="text-sm sticky top-0">
                    <th className="px-4 py-3 border-r border-gray-300 w-[80px] sticky left-0 bg-gray-200 z-10">
                      ID
                    </th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[150px]">Date</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[250px]">Client</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[250px]">Product</th>
                    {/* <th className="px-4 py-3">Image</th> */}
                    <th className="px-4 py-3  border-r border-gray-300 w-[200px]">Price</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[200px]">Quantity</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[200px]">Assets Type</th>
                    <th className="px-4 py-3  border-r border-gray-300 w-[200px]">Total Worth</th>
                    <th className="px-4 py-3 w-[150px]">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {filteredData && filteredData.length === 0 && (
                    <tr className="text-center h-72">
                      <td
                        colSpan={10}
                        className="text-center font-light tracking-wider text-gray-500 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  )}
                  {filteredData.map((product, index) => (
                    <tr
                      key={index}
                      className={`text-sm text-center ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]'
                      }`}
                    >
                      <td
                        className={`px-4 py-3 w-[80px] sticky left-0 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f0]'
                        } z-10 text-xs`}
                      >
                        {product?.id ? `RO${String(product?.id).slice(-3).toUpperCase()}` : 'RO---'}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(product?.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 tracking-wide">
                        {product?.clientId === null ||
                        product?.clientId === 0 ||
                        product?.clientId === ''
                          ? '-'
                          : clients.find((client) => client?.id === product?.clientId)?.clientName}
                      </td>
                      <td className="px-4 py-3 tracking-wide">
                        {String(product?.name).toUpperCase()}
                      </td>
                      <td className={`px-4 py-3 text-[#93DA97] font-bold`}>
                        <p className="border border-[#fe8a8a] text-[#850e0e] p-1 rounded-4xl font-bold">
                          ₹ {toThousands(product?.price)}
                        </p>
                      </td>
                      <td className={`px-4 py-3 ${product?.quantity <= 0 ? 'text-red-500' : ''}`}>
                        <span className="bg-gray-300 px-2 py-2 rounded-full">
                          {product?.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 tracking-wide">
                        {product?.assetsType === 'Raw Material' ? (
                          <p className="text-[#166534] font-medium border-1 border-[#8ffab5] p-1 rounded-4xl">
                            {product?.assetsType}
                          </p>
                        ) : product?.assetsType === 'Finished Goods' ? (
                          <p className="flex items-center border border-[#fef08a] text-[#854d0e] p-1 rounded-4xl justify-center gap-1 font-medium">
                            {product?.assetsType}
                          </p>
                        ) : product?.assetsType === 'Assets' ? (
                          <p className="flex items-center border border-[#8a94fe] text-[#0e1a85] p-1 rounded-4xl justify-center gap-1 font-medium">
                            {product?.assetsType}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tracking-wide">
                        <p className="font-bold">
                          ₹ {toThousands(product?.price * product?.quantity)}
                        </p>
                      </td>
                      <td className="w-28 ">
                        <div>
                          <div className="flex gap-3 justify-center relative transition cursor-pointer items-center">
                            <Trash
                              className="text-red-500 text-sm p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-120"
                              onClick={() => handleDeleteProduct(product?.id)}
                              size={28}
                            />
                            <PenLine
                              className="text-purple-500 text-sm p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-120"
                              onClick={() => handleEditProduct(product)}
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
