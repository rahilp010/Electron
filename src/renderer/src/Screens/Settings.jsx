/* eslint-disable prettier/prettier */
import React, { useState } from 'react'
import Navbar from '../components/UI/Navbar'
import { Info, Keyboard, DollarSign, Database } from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('about')
  const [showModal, setShowModal] = useState(false)

  const menuItems = [
    { key: 'about', label: 'About', icon: <Info size={18} /> },
    { key: 'keys', label: 'Key Bindings', icon: <Keyboard size={18} /> },
    { key: 'tax', label: 'Tax Configuration', icon: <DollarSign size={18} /> },
    { key: 'backup', label: 'Backup', icon: <Database size={18} /> }
  ]

  const handleCheckUpdate = () => {
    setShowModal(true)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="text-gray-600 text-center">
            <p className="text-3xl font-bold">Electron</p>
            <p className="text-lg font-light">v1.0.0</p>

            <div className="flex flex-col items-center justify-center gap-2 mt-5">
              <p>
                Thanks for choosing our application! If you run into any problems, feel free to
                reach out to us anytime.
              </p>
              <div className="flex gap-3 my-5">
                <span
                  className="border p-2 px-5 font-light rounded-2xl hover:bg-indigo-500 hover:text-white"
                  onClick={handleCheckUpdate}
                >
                  Check for Updates
                </span>
                <span className="border p-2 px-5 font-light rounded-2xl bg-indigo-500/50 cursor-pointer text-white">
                  Update Now
                </span>
              </div>
            </div>
          </div>
        )
      case 'keys':
        return <p className="text-gray-600">⌨️ Define your custom keyboard shortcuts here.</p>
      case 'tax':
        return <p className="text-gray-600">💰 Configure GST, IGST, CGST, or other tax rules.</p>
      case 'backup':
        return <p className="text-gray-600">💾 Backup and restore your application data.</p>
      default:
        return null
    }
  }

  return (
    <div className="select-none flex flex-col h-screen w-full bg-gray-50 transition-all duration-300 min-w-[720px]">
      {/* Sticky Navbar */}
      <div className="w-full sticky top-0 z-20">
        <Navbar />
      </div>

      {/* Header */}
      <div className="flex justify-between mt-5 items-center">
        <p className="text-3xl font-light mx-7">Settings</p>
      </div>

      <div>
        {/* Sidebar */}
        <div className="flex justify-center">
          <ul className="flex items-center p-0.5 px-0.5 rounded-4xl border border-gray-300">
            {menuItems.map((item) => (
              <li
                key={item.key}
                className={`flex items-center justify-center gap-3 px-6 py-2 cursor-pointer text-sm font-medium transition-all
                  ${
                    activeTab === item.key
                      ? 'bg-indigo-500 backdrop-blur-2xl text-white rounded-4xl'
                      : 'text-gray-300 hover:bg-white/30 rounded-4xl'
                  }`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Content */}
      <div className="grid grid-cols-12 mx-7 mt-3 border border-gray-200 rounded-2xl bg-white shadow-md overflow-hidden min-h-[calc(100vh-150px)]">
        {/* Main content */}
        <div className="col-span-12 p-6 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  )
}

export default Settings
