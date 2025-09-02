import React, { useCallback, useEffect, useState } from 'react'
import { setProducts, updateProduct } from '../../app/features/electronSlice'
import { CircleX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  Animation,
  Badge,
  Checkbox,
  IconButton,
  Input,
  InputGroup,
  InputNumber,
  SelectPicker,
  TagPicker
} from 'rsuite'
import ClientModal from './ClientModal'
import PlusIcon from '@rsuite/icons/Plus'
import MinusIcon from '@rsuite/icons/Minus'
import { useNavigate } from 'react-router-dom'

const ProductModal = ({
  setShowModal,
  existingProduct = null,
  isUpdateExpense = false,
  type = 'product'
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const fetchProducts = async () => {
    const response = await window.api?.getAllProducts()
    dispatch(setProducts(response))
  }

  const [clientModal, setClientModal] = useState(false)
  const [quantities, setQuantities] = useState({})
  const [selectedParts, setSelectedParts] = useState([])
  const products = useSelector((state) => state.electron.products.data || [])
  const clients = useSelector((state) => state.electron.clients.data || [])
  const safeProduct = existingProduct || {}

  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false)

  const getInitialProduct = useCallback(() => {
    if (isUpdateExpense && existingProduct) {
      // Parse parts if they exist and are a string
      let parsedParts = []
      if (existingProduct.parts) {
        try {
          parsedParts =
            typeof existingProduct.parts === 'string'
              ? JSON.parse(existingProduct.parts)
              : existingProduct.parts
        } catch (e) {
          console.warn('Failed to parse parts:', e)
          parsedParts = []
        }
      }

      return {
        name: existingProduct.name || '',
        quantity: existingProduct.quantity || '',
        price: Number(existingProduct.price) || '',
        clientId: existingProduct.clientId || '',
        addParts: existingProduct.addParts ? 1 : 0,
        assetsType: existingProduct.assetsType || '',
        parts: JSON.stringify(parsedParts || [])
      }
    }
    return {
      name: '',
      quantity: '',
      price: '',
      clientId: '',
      addParts: 0,
      assetsType: '',
      parts: []
    }
  }, [isUpdateExpense, existingProduct])

  // Simplified state - only use transaction object
  const [product, setProduct] = useState(getInitialProduct())

  // Initialize component
  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (existingProduct && isUpdateExpense) {
      let parsedParts = []
      try {
        parsedParts =
          typeof existingProduct.parts === 'string'
            ? JSON.parse(existingProduct.parts)
            : existingProduct.parts
      } catch (e) {
        parsedParts = []
      }

      setSelectedParts(parsedParts)

      const qtyMap = {}
      parsedParts.forEach((part) => {
        qtyMap[part.partId] = part.quantity
      })
      setQuantities(qtyMap)
    }
  }, [existingProduct, isUpdateExpense])

  const handleSubmitProduct = useCallback(
    async (e) => {
      e.preventDefault()

      if (isSubmittingProduct) return
      setIsSubmittingProduct(true)

      try {
        // Validation
        if (!product.name || !product.quantity) {
          toast.error('Please add both name and stock')
          return
        }

        if (!product.price || product.price <= 0) {
          toast.error('Please enter a valid price')
          return
        }

        const productData = {
          name: product.name,
          quantity: Number(product.quantity),
          price: Number(product.price),
          clientId: product.clientId || 0,
          assetsType: product.assetsType,
          addParts: product.addParts,
          parts: JSON.stringify(
            selectedParts.map((p) => ({
              partId: p.partId,
              quantity: quantities[p.partId] || 1
            }))
          )
        }

        console.log('Submitting product:', productData)

        if (!isUpdateExpense) {
          const response = await window.api.createProduct(productData)
          console.log('Product created:', response)
          dispatch(setProducts(response))
          toast.success('Product added successfully')
          fetchProducts()
        } else {
          const response = await window.api.updateProduct({
            id: safeProduct.id,
            ...productData
          })
          dispatch(updateProduct(response))
          toast.success('Product updated successfully')
          fetchProducts()
        }

        setShowModal(false)
      } catch (error) {
        console.error('Transaction Submit Error:', error)
        toast.error('An error occurred while processing your request')
      } finally {
        setIsSubmittingProduct(false)
      }
    },
    [
      dispatch,
      isUpdateExpense,
      existingProduct,
      product,
      selectedParts,
      quantities,
      setShowModal,
      isSubmittingProduct,
      fetchProducts
    ]
  )

  const selectedProduct = products.find((p) => p.id === product.productId)

  // Calculate available stock for validation
  const getAvailableStock = () => {
    if (!selectedProduct) return 0

    if (isUpdateExpense && existingProduct?.productId === product.productId) {
      // For updates of the same product, add back the old quantity to available stock
      return selectedProduct.quantity + (existingProduct.quantity || 0)
    }

    return selectedProduct.quantity
  }

  const handleOnChangeEvent = (value, fieldName) => {
    switch (fieldName) {
      case 'image':
        const file = value
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            setImagePreview(event.target.result)
            setProduct((prev) => ({
              ...prev,
              image: event.target.result
            }))
          }
          reader.readAsDataURL(file)
        }
        return

      case 'clientId':
        setProduct((prev) => ({ ...prev, clientId: value }))
        return

      case 'assetsType':
        setProduct((prev) => ({ ...prev, assetsType: value }))
        return

      case 'addParts':
        setProduct((prev) => ({ ...prev, addParts: value }))
        return

      default:
        setProduct((prev) => ({ ...prev, [fieldName]: value }))
        return
    }
  }

  const handleQuantityChange = (value, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [value]: Math.max((prev[value] || 0) + delta, 0)
    }))
  }

  const toThousands = (value) => {
    if (!value) return value
    return new Intl.NumberFormat('en-IN').format(value)
  }

  return (
    <div
      className="fixed z-50 inset-0 flex items-center justify-center transition-all duration-300 bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      {clientModal && (
        <ClientModal
          isUpdateExpense={isUpdateExpense}
          setShowModal={() => setClientModal(false)}
          type="client"
        />
      )}
      {type === 'product' ? (
        <form onSubmit={handleSubmitProduct}>
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg relative">
            <p className="text-lg font-semibold mb-4">
              {isUpdateExpense ? 'Update Product' : 'Add Product'}
            </p>
            <CircleX
              className="absolute top-4 right-4 cursor-pointer text-red-400 hover:text-red-600"
              size={30}
              onClick={() => setShowModal(false)}
            />

            <div className="grid grid-cols-2 gap-4 my-2">
              <div>
                <label htmlFor="client" className="block text-sm mb-1 text-gray-600">
                  Client
                </label>
                <SelectPicker
                  data={clients.map((client) => ({
                    label: client.clientName,
                    value: client.id
                  }))}
                  value={product.clientId}
                  onChange={(value) => handleOnChangeEvent(value, 'clientId')}
                  placeholder="Select Client"
                  style={{ width: 300, zIndex: clientModal ? 1 : 999 }}
                  menuStyle={{ zIndex: clientModal ? 1 : 999 }}
                  menuMaxHeight={200}
                  renderExtraFooter={() => (
                    <div className="px-3 py-1 border-t border-gray-200">
                      <p
                        className="text-blue-600 text-sm tracking-wider cursor-pointer font-bold"
                        onClick={() => setClientModal(true)}
                      >
                        + Create Client
                      </p>
                    </div>
                  )}
                />
              </div>
              <div>
                <label htmlFor="client" className="block text-sm mb-1 text-gray-600">
                  Assets Type
                </label>
                <SelectPicker
                  data={[
                    { label: 'Raw Material', value: 'Raw Material' },
                    {
                      label: 'Finished Goods',
                      value: 'Finished Goods'
                    },
                    { label: 'Assets', value: 'Assets' }
                  ]}
                  value={product.assetsType}
                  onChange={(value) => handleOnChangeEvent(value, 'assetsType')}
                  placeholder="Select Assets Type"
                  style={{ width: 300, zIndex: clientModal ? 1 : 999 }}
                  menuStyle={{ zIndex: clientModal ? 1 : 999 }}
                  menuMaxHeight={200}
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm mb-1 text-gray-600">
                  Product Name
                </label>
                <Input
                  size="sm"
                  value={product.name}
                  onChange={(value) => handleOnChangeEvent(value, 'name')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm mb-1 text-gray-600">
                  Quantity
                </label>
                <InputNumber
                  size="sm"
                  value={product.quantity}
                  onChange={(value) => handleOnChangeEvent(value, 'quantity')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="price" className="block text-sm mb-1 text-gray-600">
                Price
              </label>
              <InputNumber
                prefix="₹"
                defaultValue={0}
                size="xs"
                formatter={toThousands}
                value={product.price}
                onChange={(value) => handleOnChangeEvent(value, 'price')}
                className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-10 items-center tracking-wide"
              />
            </div>

            <div>
              {product.assetsType === 'Finished Goods' ? (
                <Checkbox
                  value="addParts"
                  checked={product.addParts}
                  onChange={(_, checked) => handleOnChangeEvent(checked ? 1 : 0, 'addParts')}
                  className="text-sm text-gray-600 -ml-2"
                >
                  Add Parts
                </Checkbox>
              ) : null}
            </div>

            <Animation.Collapse in={product.addParts === 1}>
              <div className="mt-2">
                <TagPicker
                  data={products
                    .filter((p) => p.assetsType !== 'Finished Goods')
                    .map((product) => ({
                      label: product.name,
                      value: product.id
                    }))}
                  style={{
                    width: '100%',
                    height: '100px',
                    zIndex: 999
                  }}
                  value={selectedParts.map((p) => p.partId)}
                  onChange={(values) => {
                    setSelectedParts(
                      values.map((id) => ({
                        partId: id,
                        quantity: quantities[id] || 1
                      }))
                    )
                  }}
                  menuStyle={{ zIndex: 999 }}
                  container={() => document.getElementById('modal-body-container')}
                  placeholder="Select products"
                  renderMenuItem={(label, item) => (
                    <div className="flex items-center justify-between w-full">
                      <span>{label}</span>
                      <InputGroup size="xs" style={{ width: 80, zIndex: 999 }}>
                        <IconButton
                          size="xs"
                          icon={<MinusIcon />}
                          onClick={(e) => {
                            e.stopPropagation() // prevent auto select
                            handleQuantityChange(item.value, -1)
                          }}
                          style={{ zIndex: 999 }}
                        />
                        <input
                          readOnly
                          value={quantities[item.value] || 0}
                          style={{
                            zIndex: 999,
                            width: 30,
                            textAlign: 'center',
                            border: 'none',
                            background: 'transparent'
                          }}
                        />
                        <IconButton
                          size="xs"
                          icon={<PlusIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuantityChange(item.value, 1)
                          }}
                          style={{ zIndex: 999 }}
                        />
                      </InputGroup>
                    </div>
                  )}
                  renderValue={(value, items) =>
                    items.map((item) => (
                      <span key={item.value} className="bg-gray-200 rounded-lg p-2 m-2">
                        <Badge content={quantities[item.value] || 1}>{item.label}</Badge>
                      </span>
                    ))
                  }
                />
              </div>
            </Animation.Collapse>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-7 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="px-7 py-2 bg-[#566dff] hover:bg-[#566dff]/60 text-white rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingProduct ? 'Processing...' : isUpdateExpense ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default ProductModal
