/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react'
import { setProducts, updateProduct } from '../../app/features/electronSlice'
import { CircleX } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  Animation,
  Badge,
  Checkbox,
  CheckPicker,
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
  const [baseQuantities, setBaseQuantities] = useState({})
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
      const baseQtyMap = {}

      parsedParts.forEach((part) => {
        qtyMap[part.partId] = part.quantity
        // Calculate base quantity by dividing by main product quantity
        baseQtyMap[part.partId] =
          existingProduct.quantity > 0
            ? Math.round(part.quantity / existingProduct.quantity)
            : part.quantity
      })

      setQuantities(qtyMap)
      setBaseQuantities(baseQtyMap)
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
          ),
          pageName: 'Product'
        }

        console.log('Submitting product:', productData)

        if (!isUpdateExpense) {
          const response = await window.api.createProduct(productData)
          console.log('Product created:', response)
          dispatch(setProducts(response))
          toast.success('Product added successfully')
        } else {
          const response = await window.api.updateProduct({
            id: safeProduct.id,
            ...productData
          })
          dispatch(updateProduct(response))
          toast.success('Product updated successfully')
        }

        fetchProducts()
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

  const selectedProduct = products.find((p) => p?.id === product?.productId)

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

  const handleQuantityChange = (partId, delta) => {
    setBaseQuantities((prev) => {
      const newBaseQty = Math.max((prev[partId] || 0) + delta, 0)
      return { ...prev, [partId]: newBaseQty }
    })

    // Also update actual quantities
    if (product.assetsType === 'Finished Goods' && product.addParts === 1) {
      setQuantities((prev) => ({
        ...prev,
        [partId]: Math.max((prev[partId] || 0) + delta * (Number(product.quantity) || 1), 0)
      }))
    } else {
      setQuantities((prev) => ({
        ...prev,
        [partId]: Math.max((prev[partId] || 0) + delta, 0)
      }))
    }
  }

  useEffect(() => {
    if (product.assetsType === 'Finished Goods' && product.addParts === 1) {
      setQuantities(() => {
        const updated = {}
        for (const [partId, baseQty] of Object.entries(baseQuantities)) {
          // Multiply base quantity by main product quantity
          updated[partId] = (baseQty || 0) * (Number(product.quantity) || 1)
        }
        return updated
      })
    }
  }, [product.quantity, baseQuantities, product.assetsType, product.addParts])

  // 3. Update the initialization useEffect for existing products
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
      const baseQtyMap = {}

      parsedParts.forEach((part) => {
        qtyMap[part.partId] = part.quantity
        // Calculate base quantity by dividing by main product quantity
        baseQtyMap[part.partId] =
          existingProduct.quantity > 0
            ? Math.round(part.quantity / existingProduct.quantity)
            : part.quantity
      })

      setQuantities(qtyMap)
      setBaseQuantities(baseQtyMap)
    }
  }, [existingProduct, isUpdateExpense])

  useEffect(() => {
    if (
      product.assetsType === 'Finished Goods' &&
      product.addParts === 1 &&
      selectedParts.length > 0
    ) {
      let totalCost = 0
      const mainQty = Number(product.quantity) || 1

      selectedParts.forEach((part) => {
        const partProduct = products.find((p) => p.id === part.partId)
        if (partProduct) {
          const totalPartQty = quantities[part.partId] || 0
          totalCost += (partProduct.price || 0) * totalPartQty
        }
      })

      // // 🔹 update the price dynamically
      // if (totalCost !== product.price) {
      //   setProduct((prev) => ({
      //     ...prev,
      //     price: totalCost
      //   }))
      // }
    }
  }, [selectedParts, quantities, products, product.assetsType, product.addParts, product.quantity])

  const checkPartsStock = () => {
    if (product.assetsType === 'Finished Goods' && product.addParts === 1) {
      for (const part of selectedParts) {
        const partProduct = products.find((p) => p.id === part.partId)
        const requiredQty = quantities[part.partId] || 0

        if (partProduct && partProduct.quantity < requiredQty) {
          return {
            isValid: false,
            productName: partProduct.name,
            available: partProduct.quantity,
            required: requiredQty
          }
        }
      }
    }
    return { isValid: true }
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
        <form onSubmit={handleSubmitProduct} className="grid grid-cols-12 gap-3">
          <div
            className={`${product.assetsType === 'Finished Goods' && product.addParts === 1 ? 'col-span-8' : 'col-span-12'} bg-white p-6 rounded-lg shadow-2xl w-full max-w-3xl relative`}
          >
            <p className="text-lg font-semibold mb-4">
              {isUpdateExpense ? 'Update Product' : 'Add Product'}
            </p>
            <CircleX
              className="absolute top-4 right-4 cursor-pointer text-red-400 hover:text-red-600"
              size={30}
              onClick={() => setShowModal(false)}
            />

            <div className="grid grid-cols-3 gap-4 my-2 items-center">
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
                  virtualized={true}
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
                  searchable={false}
                />
              </div>
              <div>
                <label htmlFor="client" className="block text-sm mb-1 text-gray-600">
                  Sale HSN Code
                </label>
                <Input
                  size="sm"
                  value={product.saleHSNCode}
                  placeholder="Enter Sale HSN Code"
                  onChange={(value) => handleOnChangeEvent(value, 'saleHSNCode')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>
              {product.assetsType === 'Finished Goods' ? null : (
                <div>
                  <label htmlFor="client" className="block text-sm mb-1 text-gray-600">
                    Purchase HSN Code
                  </label>
                  <Input
                    size="sm"
                    value={product.purchaseHSNCode}
                    placeholder="Enter Purchase HSN Code"
                    onChange={(value) => handleOnChangeEvent(value, 'purchaseHSNCode')}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                  />
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm mb-1 text-gray-600">
                  Product Name
                </label>
                <Input
                  size="sm"
                  value={product.name}
                  placeholder="Enter Product Name"
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
                  placeholder="Enter Quantity"
                  onChange={(value) => handleOnChangeEvent(value, 'quantity')}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>

              <Animation.Collapse in={product.addParts === 1} className="col-span-3">
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
                    virtualized={true}
                    renderMenuItem={(label, item) => {
                      const partProduct = products.find((p) => p.id === item.value)
                      const requiredQty =
                        product.assetsType === 'Finished Goods' && product.addParts === 1
                          ? (baseQuantities[item.value] || 0) * (Number(product.quantity) || 1)
                          : quantities[item.value] || 0
                      const hasEnoughStock = partProduct && partProduct.quantity >= requiredQty

                      return (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className={!hasEnoughStock ? 'text-red-500' : ''}>{label}</span>
                            {!hasEnoughStock && (
                              <span className="text-xs text-red-500">
                                Stock: {partProduct?.quantity || 0} (Need: {requiredQty})
                              </span>
                            )}
                          </div>
                          <InputGroup size="xs" style={{ width: 120, zIndex: 999 }}>
                            <IconButton
                              size="xs"
                              icon={<MinusIcon />}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuantityChange(item.value, -1)
                              }}
                              style={{ zIndex: 999 }}
                            />
                            <input
                              readOnly
                              value={
                                product.assetsType === 'Finished Goods' && product.addParts === 1
                                  ? `${baseQuantities[item.value] || 0} × ${product.quantity || 1}`
                                  : quantities[item.value] || 0
                              }
                              style={{
                                zIndex: 999,
                                width: 60,
                                textAlign: 'center',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '11px'
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
                      )
                    }}
                    // 5. Update renderValue to show calculated quantities
                    renderValue={(value, items) =>
                      items.map((item) => {
                        const partProduct = products.find((p) => p.id === item.value)
                        const requiredQty =
                          product.assetsType === 'Finished Goods' && product.addParts === 1
                            ? quantities[item.value] || 0
                            : baseQuantities[item.value] || quantities[item.value] || 1
                        const hasEnoughStock = partProduct && partProduct.quantity >= requiredQty

                        return (
                          <span
                            key={item.value}
                            className={`rounded-lg p-2 m-2 ${hasEnoughStock ? 'bg-gray-200' : 'bg-red-100'}`}
                          >
                            <Badge
                              content={requiredQty}
                              style={{ backgroundColor: hasEnoughStock ? undefined : '#ef4444' }}
                            >
                              {item.label}
                            </Badge>
                          </span>
                        )
                      })
                    }
                  />
                </div>
              </Animation.Collapse>

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
                  className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 h-9 items-center tracking-wide"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="tax" className="block text-sm mb-1 text-gray-600">
                  Tax
                </label>
                <CheckPicker
                  data={[
                    { label: 'IGST 18', value: 'i-18' },
                    { label: 'IGST 28', value: 'i-28' },
                    { label: 'SGST 9', value: 's-9' },
                    { label: 'CGST 9', value: 'c-9' },
                    { label: 'Fright Changed', value: 0 }
                  ]}
                  searchable={false}
                  size="md"
                  placeholder="Select Tax"
                  value={Array.isArray(product.tax) ? product.tax : []}
                  onChange={(value) => handleOnChangeEvent(value, 'tax')}
                  style={{ width: 300, zIndex: clientModal ? 1 : 999 }}
                  menuStyle={{ zIndex: clientModal ? 1 : 999 }}
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
            </div>

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
          {product.assetsType === 'Finished Goods' && product.addParts === 1 && (
            <div className="col-span-4 bg-white py-6 px-3 rounded-lg shadow-2xl w-full max-w-3xl relative overflow-y-auto">
              <p className="text-lg font-semibold mb-3 text-gray-700">Rate Breakdown</p>

              {selectedParts.length === 0 ? (
                <p className="text-sm text-gray-400 flex items-center justify-center border border-gray-400 h-36 p-2 rounded-lg">
                  No parts selected yet.
                </p>
              ) : (
                <table className="w-full text-sm border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-2 border border-gray-200 text-left w-40">Part</th>
                      <th className="p-2 border border-gray-200 text-center">Qty</th>
                      <th className="p-2 border border-gray-200 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParts.map((part) => {
                      const partProduct = products.find((p) => p.id === part.partId)
                      const partQty = quantities[part.partId] || 0
                      const partPrice = partProduct?.price || 0

                      return (
                        <tr key={part.partId} className="hover:bg-gray-50 transition-all">
                          <td className="p-2 border border-gray-200">
                            {partProduct?.name || 'Unknown'}
                          </td>
                          <td className="p-2 border border-gray-200 text-center">{partQty}</td>
                          <td className="p-2 border border-gray-200 text-right">
                            {partPrice.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold bg-gray-100">
                      <td colSpan="2" className="p-2 border border-gray-200 text-right">
                        Total Cost
                      </td>
                      <td className="p-2 border border-gray-200 text-right">
                        ₹
                        {selectedParts
                          .reduce((acc, part) => {
                            const partProduct = products.find((p) => p.id === part.partId)
                            const partQty = quantities[part.partId] || 0
                            return acc + (partProduct?.price || 0) * partQty
                          }, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Auto-calculated Price:</strong>{' '}
                  <span className="text-blue-700 font-semibold">
                    ₹
                    {selectedParts
                      .reduce((acc, part) => {
                        const partProduct = products.find((p) => p.id === part.partId)
                        const partQty = quantities[part.partId] || 0
                        return acc + (partProduct?.price || 0) * partQty
                      }, 0)
                      .toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </form>
      ) : null}
    </div>
  )
}

export default ProductModal
