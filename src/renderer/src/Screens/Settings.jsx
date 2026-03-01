/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/no-unknown-property */

import React, { useEffect, useState } from 'react'
import Navbar from '../components/UI/Navbar'
import { Info, Keyboard, Banknote, DatabaseBackup, Plus, X, Check, Trash2 } from 'lucide-react'
import { Input, InputNumber, SelectPicker } from 'rsuite'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import {
  deleteKeyBinding,
  setKeyBindings,
  setSettings,
  updateKeyBinding
} from '../app/features/electronSlice'

const KeyBindingsSection = () => {
  const dispatch = useDispatch()
  const keyBindings = useSelector((state) => state.electron.keyBindings?.data || [])

  const [isAddingKey, setIsAddingKey] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [keyForm, setKeyForm] = useState({
    name: '',
    description: '',
    key: '',
    modifiers: [],
    action: 'navigate',
    value: '',
    enabled: true
  })

  const safeParseModifiers = (value) => {
    try {
      if (!value) return []
      if (Array.isArray(value)) return value

      // if valid JSON
      if (typeof value === 'string' && value.startsWith('[')) {
        return JSON.parse(value)
      }

      // fallback for old bad data like "ctrl,shift"
      if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim())
      }

      return []
    } catch {
      return []
    }
  }

  // ✅ FETCH
  const fetchKeyBindings = async () => {
    try {
      const response = await window.api.getKeyBindings()

      const parsed = response.map((b) => ({
        ...b,
        modifiers: safeParseModifiers(b.modifiers),
        enabled: Boolean(b.enabled)
      }))

      dispatch(setKeyBindings(parsed))
    } catch (error) {
      console.error('Failed to fetch key bindings:', error)
    }
  }
  useEffect(() => {
    fetchKeyBindings()
  }, [])

  // ✅ SAVE / UPDATE
  const handleSaveKeyBinding = async (e) => {
    e.preventDefault()

    if (!keyForm.name || !keyForm.key) {
      toast.error('Please fill in name and key')
      return
    }

    try {
      if (editingKey) {
        const updated = await window.api.updateKeyBinding({
          id: editingKey,
          ...keyForm
        })

        updated.modifiers = safeParseModifiers(updated.modifiers)
        updated.enabled = Boolean(updated.enabled)

        dispatch(updateKeyBinding(updated))
        toast.success('Key binding updated successfully')
      } else {
        const created = await window.api.createKeyBinding(keyForm)

        created.modifiers = safeParseModifiers(created.modifiers)
        created.enabled = Boolean(created.enabled)

        dispatch(setKeyBindings([...keyBindings, created]))
        toast.success('Key binding added successfully')
      }

      resetForm()
    } catch (error) {
      toast.error('Failed to save key binding')
      console.error(error)
    }
  }

  // ✅ DELETE
  const handleDeleteKeyBinding = async (id) => {
    if (!window.confirm('Delete this shortcut?')) return

    try {
      await window.api.deleteKeyBinding(id)
      dispatch(deleteKeyBinding(id))
      toast.success('Key binding deleted successfully')
    } catch (error) {
      toast.error('Failed to delete key binding')
    }
  }

  const handleEditKeyBinding = (binding) => {
    setKeyForm({
      name: binding.name,
      description: binding.description || '',
      key: binding.key,
      modifiers: binding?.modifiers || [],
      action: binding.action,
      value: binding.value,
      enabled: binding?.enabled
    })
    setEditingKey(binding.id)
    setIsAddingKey(true)
  }

  const resetForm = () => {
    setKeyForm({
      name: '',
      description: '',
      key: '',
      modifiers: [],
      action: 'navigate',
      value: '',
      enabled: true
    })
    setIsAddingKey(false)
    setEditingKey(null)
  }

  const toggleModifier = (modifier) => {
    setKeyForm((prev) => ({
      ...prev,
      modifiers: prev.modifiers.includes(modifier)
        ? prev.modifiers.filter((m) => m !== modifier)
        : [...prev.modifiers, modifier]
    }))
  }

  const routes = [
    { label: 'Dashboard', value: '/' },
    { label: 'Sales', value: '/sales' },
    { label: 'Purchase', value: '/purchase' },
    { label: 'Products', value: '/products' },
    { label: 'Clients', value: '/clients' },
    { label: 'Client Ledger', value: '/ledger' },
    { label: 'Bank Ledger', value: '/bankLedger' },
    { label: 'Bank Managment', value: '/bankManagment' },
    { label: 'Pending Payment', value: '/pendingPayment' },
    { label: 'Pending Collection', value: '/pendingCollection' },
    { label: 'Reports', value: '/reports' }
  ]

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Keyboard size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Customize your workflow with keyboard shortcuts
            </p>
          </div>
        </div>

        {!isAddingKey && (
          <button
            onClick={() => setIsAddingKey(true)}
            className="group relative px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add Shortcut</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAddingKey && (
        <form onSubmit={handleSaveKeyBinding} className="mb-8 animate-slideDown">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingKey ? 'Edit Key Binding' : 'Add New Key Binding'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                <X size={20} className="text-red-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Shortcut Name *</label>
                <Input
                  className="bg-white border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                  value={keyForm.name}
                  onChange={(value) => setKeyForm((prev) => ({ ...prev, name: value }))}
                  placeholder="e.g., Go to Dashboard"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  className="bg-white border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                  value={keyForm.description}
                  onChange={(value) => setKeyForm((prev) => ({ ...prev, description: value }))}
                  placeholder="Brief description"
                />
              </div>

              {/* Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Key *</label>
                <Input
                  className="bg-white border-2 border-blue-200 focus:border-blue-500 rounded-xl uppercase"
                  value={keyForm.key}
                  onChange={(value) =>
                    setKeyForm((prev) => ({ ...prev, key: value.toLowerCase() }))
                  }
                  placeholder="e.g., d, s, p"
                  maxLength={1}
                />
              </div>

              {/* Modifiers */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Modifiers</label>
                <div className="flex gap-2">
                  {['ctrl', 'shift', 'alt'].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModifier(mod)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        keyForm.modifiers.includes(mod)
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {mod.charAt(0).toUpperCase() + mod.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Action Type</label>
                <SelectPicker
                  data={[
                    { label: 'Navigate to Page', value: 'navigate' },
                    { label: 'Custom Function', value: 'callback' },
                    { label: 'Custom Event', value: 'custom' }
                  ]}
                  value={keyForm.action}
                  onChange={(value) => setKeyForm((prev) => ({ ...prev, action: value }))}
                  className="w-full"
                  searchable={false}
                />
              </div>

              {/* Action Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {keyForm.action === 'navigate' ? 'Route' : 'Function/Event Name'}
                </label>
                {keyForm.action === 'navigate' ? (
                  <SelectPicker
                    data={routes}
                    value={keyForm.value}
                    onChange={(value) => setKeyForm((prev) => ({ ...prev, value }))}
                    className="w-full"
                    searchable={false}
                  />
                ) : (
                  <Input
                    className="bg-white border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                    value={keyForm.value}
                    onChange={(value) => setKeyForm((prev) => ({ ...prev, value }))}
                    placeholder={keyForm.action === 'callback' ? 'functionName' : 'eventName'}
                  />
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-white rounded-xl border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Shortcut Preview:</p>
              <div className="flex items-center gap-2">
                {keyForm.modifiers.map((mod) => (
                  <React.Fragment key={mod}>
                    <kbd className="px-3 py-2 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-mono font-semibold shadow-md">
                      {mod.charAt(0).toUpperCase() + mod.slice(1)}
                    </kbd>
                    <span className="text-gray-400 font-bold">+</span>
                  </React.Fragment>
                ))}
                {keyForm.key && (
                  <kbd className="px-3 py-2 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-mono font-semibold shadow-md uppercase">
                    {keyForm.key}
                  </kbd>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 group relative px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                <span>{editingKey ? 'Update' : 'Save'} Shortcut</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 font-medium text-gray-700 rounded-xl border-2 border-gray-300 hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Key Bindings List */}
      <div className="grid grid-cols-1 gap-4">
        {keyBindings?.map((binding, index) => (
          <div
            key={binding.id}
            className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{binding.name}</h3>
                  {!binding.enabled && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
                {binding.description && (
                  <p className="text-sm text-gray-600 mb-3">{binding.description}</p>
                )}
                <div className="flex items-center gap-2">
                  {Array.isArray(binding.modifiers) &&
                    binding.modifiers.map((mod) => (
                      <React.Fragment key={mod}>
                        <kbd className="px-3 py-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg text-xs font-mono font-semibold shadow">
                          {mod.charAt(0).toUpperCase() + mod.slice(1)}
                        </kbd>
                        <span className="text-gray-400 font-bold text-sm">+</span>
                      </React.Fragment>
                    ))}
                  <kbd className="px-3 py-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg text-xs font-mono font-semibold shadow uppercase">
                    {binding.key}
                  </kbd>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-sm text-gray-600 font-medium">
                    {binding.action === 'navigate' ? `Go to ${binding.value}` : binding.value}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEditKeyBinding(binding)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  <Check size={18} className="text-blue-600" />
                </button>
                <button
                  onClick={() => handleDeleteKeyBinding(binding.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {keyBindings.length === 0 && !isAddingKey && (
        <div className="text-center py-16 animate-fadeIn">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
            <Keyboard size={40} className="text-gray-400" />
          </div>
          <p className="text-xl text-gray-500 mb-4">No keyboard shortcuts configured</p>
          <p className="text-gray-400 mb-8">
            Click "Add Shortcut" to create your first keyboard shortcut
          </p>
        </div>
      )}
    </div>
  )
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('about')
  const [showModal, setShowModal] = useState(false)
  const [taxName, setTaxName] = useState('')
  const [taxValue, setTaxValue] = useState('')
  const [isAddingTax, setIsAddingTax] = useState(false)
  const [systemInfo, setSystemInfo] = useState({
    lastBackup: null,
    nextBackup: null,
    backupTakenToday: false,
    version: '',
    totalProducts: 0,
    totalClients: 0,
    totalAccounts: 0,
    totalTransactions: 0
  })

  const fetchSystemInfo = async () => {
    try {
      const data = await window.api.getSystemInfo()
      setSystemInfo(data)
    } catch (err) {
      console.error('Failed to load system info:', err)
    }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  const menuItems = [
    {
      key: 'about',
      label: 'About',
      icon: <Info size={18} />,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      key: 'keys',
      label: 'Key Bindings',
      icon: <Keyboard size={18} />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      key: 'tax',
      label: 'Tax Configuration',
      icon: <Banknote size={18} />,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      key: 'backup',
      label: 'Backup',
      icon: <DatabaseBackup size={18} />,
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  const fetchSettings = async () => {
    const response = await window.api.getTaxes()
    dispatch(setSettings(response))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const dispatch = useDispatch()
  const settings = useSelector((state) => state.electron.settings.data || [])

  const handleCheckUpdate = () => {
    setShowModal(true)
  }

  const handleSubmitTax = async (e) => {
    e.preventDefault()

    if (!taxName || !taxValue) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const created = await window.api.createTax({
        taxName,
        taxValue
      })

      dispatch(setSettings([...settings, created]))

      toast.success('Tax added successfully')
      setTaxName('')
      setTaxValue('')
      setIsAddingTax(false)
    } catch (error) {
      console.log(error)
      toast.error('Failed to add tax')
    }
  }

  const handleDeleteTax = async (id) => {
    try {
      await window.api.deleteTax(id)

      const updated = settings.filter((tax) => tax.id !== id)
      dispatch(setSettings(updated))

      toast.success('Tax deleted successfully')
    } catch (error) {
      console.log(error)

      toast.error('Failed to delete tax')
    }
  }
  const handleManualBackup = async () => {
    const result = await window.api.manualBackup()
    if (result.success) toast.success(result.message)
    else toast.error(result.message)
  }

  const handleRestoreBackup = async () => {
    try {
      // Let user select a .enc file
      const { canceled, filePaths } = await window.api.selectBackupFile()
      if (canceled || !filePaths?.length) return

      const filePath = filePaths[0]
      const result = await window.api.restoreBackup(filePath)

      if (result.success) {
        toast.success('Database restored successfully! Restart app to apply changes.')
      } else {
        toast.error(result.message || 'Restore failed.')
      }
    } catch (err) {
      console.error('Restore backup error:', err)
      toast.error('Failed to restore backup.')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="text-gray-700 text-center max-w-2xl mx-auto animate-fadeIn">
            <div className="relative">
              <div className="relative bg-white rounded-3xl p-4 border border-gray-100">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-500">
                  <Info size={30} className="text-white" />
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Electron
                </p>
                <p className="text-lg font-light text-gray-500 mb-5">
                  v{systemInfo?.version || '1.0.0'}
                </p>

                <p className="text-gray-600 mb-8 leading-relaxed">
                  Thanks for choosing our application! If you run into any problems, feel free to
                  reach out to us anytime.
                </p>

                <div className="flex gap-4 justify-center">
                  <button
                    className="group relative px-8 py-3 font-medium rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
                    onClick={handleCheckUpdate}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="absolute inset-0 border-2 border-purple-500 rounded-xl"></span>
                    <span className="relative text-purple-600 group-hover:text-white transition-colors duration-300">
                      Check for Updates
                    </span>
                  </button>

                  <button className="relative px-8 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative">Update Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'keys':
        return <KeyBindingsSection />

      case 'tax':
        return (
          <div className="animate-fadeIn customScrollbar">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Banknote size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Tax Configuration
                </h2>
              </div>

              {!isAddingTax && (
                <button
                  onClick={() => setIsAddingTax(true)}
                  className="group relative px-4 py-2 font-medium text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow hover:shadow-green-500/50 transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <Plus size={20} />
                  <span>Add New Tax</span>
                </button>
              )}
            </div>

            {/* Add Tax Form */}
            {isAddingTax && (
              <form onSubmit={handleSubmitTax} className="mb-8 animate-slideDown">
                <div className="border border-green-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Add New Tax</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTax(false)
                        setTaxName('')
                        setTaxValue('')
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    >
                      <X size={20} className="text-red-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Banknote size={16} className="text-green-600" />
                        Tax Name
                      </label>
                      <Input
                        className="p-3 bg-white border-2 border-green-200 focus:border-green-500 rounded-xl transition-all duration-200"
                        value={taxName}
                        onChange={(value) => setTaxName(String(value).toUpperCase())}
                        placeholder="Enter tax name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Banknote size={16} className="text-green-600" />
                        Tax Percentage
                      </label>
                      <InputNumber
                        className="bg-white border-2 border-green-200 focus:border-green-500 rounded-xl transition-all duration-200"
                        min={0}
                        value={taxValue}
                        onChange={(value) => setTaxValue(value)}
                        placeholder="Enter percentage"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 group relative px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/50 transition-all duration-300 cursor-pointer hover:shadow flex items-center justify-center gap-2"
                    >
                      <Check size={20} />
                      <span>Save Tax</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTax(false)
                        setTaxName('')
                        setTaxValue('')
                      }}
                      className="px-6 py-3 font-medium text-gray-700 rounded-xl border-2 border-gray-300 hover:bg-gray-100 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tax Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {settings.map((setting, index) => (
                <div
                  key={setting?.id}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-300 hover:border-green-100 shadow-xl transition-all duration-500 animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-2xl transition-all duration-500"></div>

                  <div className="relative flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                        <Banknote size={20} className="text-white" />
                      </div>

                      <button
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-lg transition-all duration-200 cursor-pointer"
                        onClick={() => handleDeleteTax(setting?.id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-green-600 transition-colors duration-300">
                        {setting?.taxName || '—'}
                      </h3>
                      <p className="text-xs mb-2 font-light text-gray-500 uppercase tracking-wide">
                        Tax Name
                      </p>
                    </div>

                    <div className=" pt-2 border-t border-gray-100">
                      <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {setting?.taxValue ? `${setting.taxValue}%` : '0%'}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                        Tax Value
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {settings.length === 0 && !isAddingTax && (
              <div className="text-center py-16 animate-fadeIn">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                  <Banknote size={40} className="text-gray-400" />
                </div>
                <p className="text-xl text-gray-500 mb-4">No tax configurations yet</p>
                <p className="text-gray-400 mb-8">
                  Click "Add New Tax" to create your first tax configuration
                </p>
              </div>
            )}
          </div>
        )

      case 'backup':
        return (
          <div className="animate-fadeIn max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-12 border border-orange-100">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <DatabaseBackup size={32} className="text-white" />
              </div>

              <p className="text-xl text-gray-700 text-center mb-6">
                💾 Backup and restore your application data.
              </p>

              <div className="flex flex-col md:flex-row justify-center gap-4">
                {/* Manual Backup */}
                <button
                  onClick={handleManualBackup}
                  className="px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:shadow hover:shadow-orange-500/50 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={20} />
                  <span>Create Backup</span>
                </button>

                {/* Restore Backup */}
                <button
                  onClick={handleRestoreBackup}
                  className="px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <DatabaseBackup size={20} />
                  <span>Restore Backup</span>
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="select-none flex flex-col h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 min-w-[720px]">
      {/* Sticky Navbar */}
      <div className="w-full sticky top-0 z-20">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex mt-6 mb-4 justify-between mx-7 items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your application preferences</p>
        </div>

        <div className="flex justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-1.5">
            <ul className="flex items-center gap-2 text-sm">
              {menuItems.map((item) => (
                <li
                  key={item.key}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-500 cursor-pointer font-medium overflow-hidden group
                    ${activeTab === item.key ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  {/* Animated background */}
                  {activeTab === item.key && (
                    <span
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} animate-slideIn`}
                    ></span>
                  )}

                  {/* Hover effect */}
                  <span
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  ></span>

                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-7 mt-3 mb-7 bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden min-h-[calc(100vh-180px)] backdrop-blur-xl">
        <div className="p-8 overflow-auto h-full">{renderContent()}</div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slideUp">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Check size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">You're up to date!</h3>
              <p className="text-gray-600 mb-8">
                You're running the latest version of the application.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 font-medium text-white rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default Settings
