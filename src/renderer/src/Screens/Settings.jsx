/* eslint-disable react/no-unknown-property */
/* eslint-disable react/jsx-key */
/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react'
import Navbar from '../components/UI/Navbar'
import { Info, Keyboard, Banknote, DatabaseBackup, Plus, X, Check, Trash2 } from 'lucide-react'
import { Input, InputNumber } from 'rsuite'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { setSettings } from '../app/features/electronSlice'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('about')
  const [showModal, setShowModal] = useState(false)
  const [taxName, setTaxName] = useState('')
  const [taxValue, setTaxValue] = useState('')
  const [isAddingTax, setIsAddingTax] = useState(false)

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
    const response = await window.api.getSettings()
    console.log(response)
    dispatch(setSettings(response))
  }

  const dispatch = useDispatch()
  const settings = useSelector((state) => state.electron.settings.data || [])

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleCheckUpdate = () => {
    setShowModal(true)
  }

  const handleSubmitTax = async (e) => {
    e.preventDefault()

    const settingsData = {
      taxName,
      taxValue
    }

    if (!taxName || !taxValue) {
      toast.error('Please fill all fields')
      return
    }

    const createSettings = await window.api.createSettings(settingsData)
    dispatch(setSettings(createSettings))
    console.log('Created setting response:', createSettings)

    toast.success('Tax added successfully')
    setTaxName('')
    setTaxValue('')
    setIsAddingTax(false)
  }

  const handleDeleteTax = async (id) => {
    const deleteSettings = await window.api.deleteSettings(id)
    dispatch(setSettings(deleteSettings))
    console.log('Deleted setting response:', deleteSettings)
    toast.success('Tax deleted successfully')
    fetchSettings()
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="text-gray-700 text-center max-w-2xl mx-auto animate-fadeIn">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-500">
                  <Info size={30} className="text-white" />
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Electron
                </p>
                <p className="text-lg font-light text-gray-500 mb-5">v1.0.0</p>

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
        return (
          <div className="animate-fadeIn max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-12 border border-blue-100">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Keyboard size={32} className="text-white" />
              </div>
              <p className="text-xl text-gray-700 text-center">
                ⌨️ Define your custom keyboard shortcuts here.
              </p>
            </div>
          </div>
        )

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
              <p className="text-xl text-gray-700 text-center">
                💾 Backup and restore your application data.
              </p>
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
