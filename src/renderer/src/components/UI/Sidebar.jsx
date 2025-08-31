import React, { useState } from 'react';
import {
   Home,
   Store,
   Package,
   ShoppingCart,
   Archive,
   Percent,
   DollarSign,
   Users,
   BarChart3,
   Megaphone,
   Settings,
   ChevronDown,
   ChevronRight,
   Globe,
   MapPin,
} from 'lucide-react';
import ElectronLogo from '../../assets/electron2.png';

const Sidebar = () => {
   const [expandedMenus, setExpandedMenus] = useState({
      myStore: false,
      finance: false,
      analytics: false,
   });

   const toggleMenu = (menuKey) => {
      setExpandedMenus((prev) => ({
         ...prev,
         [menuKey]: !prev[menuKey],
      }));
   };

   const mainMenuItems = [
      { icon: Home, label: 'Home', path: '/' },
      {
         icon: Store,
         label: 'My Store',
         path: '/store',
         hasSubmenu: true,
         submenuKey: 'myStore',
         submenu: [
            { label: 'Products', path: '/products' },
            { label: 'Client List', path: '/orders' },
            { label: 'Currency Convertor', path: '/inventory' },
         ],
      },
      {
         icon: DollarSign,
         label: 'Finance',
         path: '/finance',
         hasSubmenu: true,
         submenuKey: 'finance',
         submenu: [
            { label: 'Purchase', path: '/products' },
            { label: 'Sales', path: '/orders' },
            { label: 'Bank & Cash', path: '/inventory' },
         ],
      },
      {
         icon: BarChart3,
         label: 'Analytics Report',
         path: '/analytics',
         hasSubmenu: true,
         submenuKey: 'analytics',
      },
      { icon: Settings, label: 'Settings', path: '/settings' },
   ];

   const salesChannels = [
      { icon: Globe, label: 'Online Store', path: '/online-store' },
      { icon: MapPin, label: 'Point of Sale', path: '/point-of-sale' },
   ];

   return (
      <div className="flex h-screen bg-gray-50">
         {/* Sidebar */}
         <div className={`bg-white shadow-lg transition-all duration-300 ease-in-out w-56 flex flex-col`}>
            {/* Logo Section */}
            <div className="p-4">
               <div className="flex items-end justify-between space-x-3">
                  <span
                     className={`font-medium text-gray-800 transition-opacity duration-300 whitespace-nowrap tracking-wide text-lg border border-gray-400 p-1 px-3 rounded-full`}>
                     Electron
                  </span>
               </div>
            </div>

            {/* Main Menu */}
            <div className="flex-1 overflow-y-auto customScrollbar">
               <div className="p-2">
                  <div 
                     className={`text-xs font-semibold tracking-wider text-gray-500 mb-3 px-1 transition-opacity duration-300`}>
                     MAIN MENU
                  </div>

                  <nav className="space-y-1">
                     {mainMenuItems.map((item, index) => (
                        <div key={index}>
                           <div
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors text-sm tracking-wide`}
                              onClick={() =>
                                 item.hasSubmenu && toggleMenu(item.submenuKey)
                              }>
                              <div className="flex items-center space-x-3">
                                 <item.icon className="w-5 h-5 flex-shrink-0" />
                                 <span
                                    className={`transition-opacity duration-300 whitespace-nowrap`}>
                                    {item.label}
                                 </span>
                              </div>
                              {item.hasSubmenu && (
                                 <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                       expandedMenus[item.submenuKey]
                                          ? 'rotate-180'
                                          : ''
                                    }`}
                                 />
                              )}
                           </div>

                           {/* Submenu */}
                           {item.hasSubmenu &&
                              item.submenu &&
                              expandedMenus[item.submenuKey] && (
                                 <div className="ml-8 mt-1 space-y-1">
                                    {item.submenu.map((subItem, subIndex) => (
                                       <div
                                          key={subIndex}
                                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 cursor-pointer rounded transition-colors hover:bg-gray-50">
                                          {subItem.label}
                                       </div>
                                    ))}
                                 </div>
                              )}
                        </div>
                     ))}
                  </nav>
               </div>

               {/* Sales Channels */}
               <div className="p-2 border-t border-gray-200 mt-4">
                  <div
                     className={`text-xs font-semibold text-gray-500 mb-3 px-2 transition-opacity duration-300`}>
                     SALES CHANNELS
                  </div>

                  <nav className="space-y-1">
                     {salesChannels.map((item, index) => (
                        <div
                           key={index}
                           className={`flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors text-sm tracking-wide`}>
                           <item.icon className="w-5 h-5 flex-shrink-0" />
                           <span
                              className={`ml-3 transition-opacity duration-300 whitespace-nowrap`}>
                              {item.label}
                           </span>
                        </div>
                     ))}
                  </nav>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Sidebar;
