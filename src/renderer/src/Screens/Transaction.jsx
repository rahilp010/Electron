import React, { useEffect, useState, useMemo } from 'react';
import {
   ChevronLeft,
   FileUp,
   Import,
   PenLine,
   Plus,
   Trash,
} from 'lucide-react';
import Loader from '../Components/Loader';
import { useNavigate } from 'react-router-dom';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {
   DateRangePicker,
   SelectPicker,
   Animation,
   Whisper,
   Tooltip,
   InputGroup,
   Input,
} from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import {
   deleteTransaction,
   setClients,
   setProducts,
   setTransactions,
} from '../app/features/electronSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import TransactionModal from '../Components/Modal/TransactionModal';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import Navbar from '../Components/UI/Navbar';

const Transaction = () => {
   const navigate = useNavigate();
   const [showLoader, setShowLoader] = useState(false);
   const [showModal, setShowModal] = useState(false);
   const [selectedTransaction, setSelectedTransaction] = useState(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [isUpdateExpense, setIsUpdateExpense] = useState(false);
   const [dateRange, setDateRange] = useState([]);
   const [clientFilter, setClientFilter] = useState('');
   const [productFilter, setProductFilter] = useState('');
   const [statusFilter, setStatusFilter] = useState('');
   const dispatch = useDispatch();

   const fetchAllProducts = async () => {
      try {
         setShowLoader(true);
         const response = await window.api.getAllProducts();
         dispatch(setProducts(response));
      } catch (error) {
         console.error('Error fetching products:', error);
         toast.error('Failed to fetch products');
      } finally {
         setShowLoader(false);
      }
   };

   const fetchAllClients = async () => {
      try {
         setShowLoader(true);
         const response = await window.api.getAllClients();
         dispatch(setClients(response));
      } catch (error) {
         console.error('Error fetching clients:', error);
         toast.error('Failed to fetch clients');
      } finally {
         setShowLoader(false);
      }
   };

   const fetchAllTransaction = async () => {
      try {
         setShowLoader(true);
         const response = await window.api.getAllTransactions();
         dispatch(setTransactions(response));
      } catch (error) {
         console.error('Error fetching transactions:', error);
         toast.error('Failed to fetch transactions');
      } finally {
         setShowLoader(false);
      }
   };
   const products = useSelector((state) => state.electron.products.data || []);

   const clients = useSelector((state) => state.electron.clients.data || []);

   const transaction = useSelector(
      (state) => state.electron.transaction.data || []
   );

   useEffect(() => {
      fetchAllProducts();
      fetchAllClients();
      fetchAllTransaction();
   }, []);

   const getClientName = (id) => {
      const client = clients.find((c) => c?.id === id);
      return client ? client.clientName : '';
   };

   const getProductName = (id) => {
      const product = products.find((p) => p?.id === id);
      return product ? product.name : '';
   };

   const filteredData = useMemo(() => {
      if (!Array.isArray(transaction)) return [];
      const query = searchQuery.toLowerCase();
      let result = transaction.filter((data) => {
         const matchesSearch =
            data?.id?.toString().includes(query) ||
            getClientName(data?.clientId)?.toLowerCase().includes(query) ||
            data?.sellAmount?.toString().includes(query) ||
            getProductName(data?.productId)?.toLowerCase().includes(query) ||
            data?.quantity?.toString().includes(query) ||
            data?.statusOfTransaction?.toLowerCase().includes(query);

         const matchesClient = clientFilter
            ? String(data.clientId) === String(clientFilter)
            : true;

         const matchesProduct = productFilter
            ? String(data.productId) === String(productFilter)
            : true;

         const matchesStatus = statusFilter
            ? data?.statusOfTransaction === statusFilter
            : true;

         let matchesDate = true;
         if (dateRange && dateRange.length === 2) {
            const createdDate = new Date(data.createdAt);
            const start = new Date(dateRange[0]);
            const end = new Date(dateRange[1]);
            matchesDate = createdDate >= start && createdDate <= end;
         }

         return (
            matchesSearch &&
            matchesClient &&
            matchesProduct &&
            matchesDate &&
            matchesStatus
         );
      });
      return result;
   }, [
      transaction,
      searchQuery,
      clientFilter,
      productFilter,
      dateRange,
      statusFilter,
   ]);

   const handlecreateTransaction = async () => {
      const response = await window.api.getAllTransactions();
      dispatch(setTransactions(response));
      setIsUpdateExpense(false);
      setShowModal(true);
   };

   const handleEditTransaction = async (transaction) => {
      try {
         const response = await window.api.getTransactionById(transaction.id);

         // Make sure the response has the right structure
         setSelectedTransaction(response);
         setIsUpdateExpense(true);
         setShowModal(true);
      } catch (error) {
         console.error('Error fetching transaction:', error);
         toast.error('Failed to load transaction data');
      }
   };

   const handleDeleteTransaction = async (id) => {
      const response = await window.api.deleteTransaction(id);
      dispatch(deleteTransaction(response));
      fetchAllTransaction();
      toast.success('Transaction data deleted successfully');
   };

   const toThousands = (value) => {
      if (!value) return value;
      return new Intl.NumberFormat('en-IN').format(value);
   };

   const handleOnChange = (value) => {
      setSearchQuery(value);
   };

   const handlePendingAmount = () => {
      if (!Array.isArray(transaction)) return 0;

      const fullPayment = transaction
         .filter(
            (item) =>
               item.statusOfTransaction === 'pending' &&
               item.paymentType === 'full'
         )
         .reduce((total, item) => total + item.sellAmount * item.quantity, 0);

      const paritalPayment = transaction
         .filter(
            (item) =>
               item.statusOfTransaction === 'pending' &&
               item.paymentType === 'partial'
         )
         .reduce((total, item) => total + item.pendingAmount, 0);

      return fullPayment + paritalPayment;
   };

   return (
      <div className="select-none gap-10 h-screen w-full overflow-x-auto transition-all duration-300 min-w-[720px] overflow-hidden">
         <div className="w-full sticky top-0 z-10">
            <Navbar />
         </div>
         <div className="flex justify-between mt-5 pb-2 items-center">
            <p className="text-3xl font-light mx-7">Sales</p>
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
                  onClick={handlecreateTransaction}>
                  <Plus size={16} />
                  <p className="text-sm">ADD</p>
               </div>
            </div>
         </div>
         <div>{showLoader && <Loader />}</div>
         <div className="overflow-y-auto h-screen customScrollbar">
            <div className="border border-gray-200 shadow px-5 py-3 mx-6 rounded-3xl my-4 flex">
               <div className="mx-5 border-r w-52">
                  <p className="text-sm font-light mb-1">Total Sales</p>
                  <p className="text-2xl font-light">
                     ₹{' '}
                     {toThousands(
                        transaction.reduce(
                           (total, item) =>
                              total + item.sellAmount * item.quantity,
                           0
                        )
                     )}
                  </p>
               </div>
               <div className="mx-5 border-r w-52">
                  <p className="text-sm font-light mb-1">
                     Total Pending Amount
                  </p>
                  <p className="font-light text-sm relative">
                     <span className="font-light text-2xl">
                        ₹ {toThousands(handlePendingAmount())}
                     </span>
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
                              value: product?.id, // DB ID
                           }))}
                           onChange={(value) => setProductFilter(value)}
                           placeholder="Select Product"
                           style={{ width: 150 }}
                        />
                        <SelectPicker
                           data={clients.map((client) => ({
                              label: client?.clientName,
                              value: client?.id, // DB ID
                           }))}
                           placement="bottomEnd"
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
                              <th className="px-4 py-3 border-r border-gray-300 w-[150px]">
                                 Date
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[200px]">
                                 Client Name
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[230px]">
                                 Product Name
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[150px]">
                                 Quantity
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[170px]">
                                 Selling Price
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[200px]">
                                 Total Amount
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[200px]">
                                 Pending Amount
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[200px]">
                                 Paid Amount
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[170px]">
                                 Payment Status
                              </th>
                              <th className="px-4 py-3 border-r border-gray-300 w-[150px]">
                                 Action
                              </th>
                           </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-200">
                           {filteredData && filteredData.length === 0 && (
                              <tr className="text-center h-80">
                                 <td
                                    colSpan={8}
                                    className="text-center font-light tracking-wider text-gray-500 text-lg">
                                    No Data Found
                                 </td>
                              </tr>
                           )}
                           {filteredData.map((transaction, index) => (
                              <tr
                                 key={transaction?.id}
                                 className={`text-sm text-center  ${
                                    index % 2 === 0
                                       ? 'bg-white'
                                       : 'bg-[#f0f0f0]'
                                 }`}>
                                 <td
                                    className={`px-4 py-3 w-[80px] sticky left-0 ${
                                       index % 2 === 0
                                          ? 'bg-white'
                                          : 'bg-[#f0f0f0]'
                                    } z-10 text-xs`}>
                                    {transaction?.id
                                       ? `RO${String(transaction.id)
                                            .slice(-3)
                                            .toUpperCase()}`
                                       : 'RO---'}
                                 </td>
                                 <td className="px-4 py-3">
                                    {new Date(
                                       transaction?.createdAt
                                    ).toLocaleDateString()}
                                 </td>
                                 <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 px-6">
                                       <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center border border-blue-300 justify-center text-xs font-medium text-blue-600 mr-3">
                                          {getClientName(transaction?.clientId)
                                             .split(' ')
                                             .map((n) => n[0])
                                             .join('')
                                             .toUpperCase()}
                                       </div>
                                       {getClientName(transaction?.clientId)}
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 tracking-wide">
                                    {String(
                                       getProductName(transaction?.productId)
                                    ).toUpperCase()}
                                 </td>
                                 <td className={`px-4 py-3`}>
                                    <span className="bg-gray-300 px-2 py-1 rounded-full">
                                       {transaction?.quantity}
                                    </span>
                                 </td>
                                 <td
                                    className={`px-4 py-3 font-bold ${
                                       transaction?.sellAmount >
                                       getProductName(transaction?.productId)
                                          ?.price
                                          ? 'text-indigo-500'
                                          : 'text-[#568F87]'
                                    }`}>
                                    ₹{' '}
                                    {toThousands(
                                       Number(transaction?.sellAmount).toFixed(
                                          0
                                       )
                                    )}
                                 </td>
                                 <td className={`px-4 py-3 `}>
                                    ₹{' '}
                                    {toThousands(
                                       Number(
                                          transaction?.sellAmount *
                                             transaction?.quantity
                                       ).toFixed(0)
                                    )}
                                 </td>
                                 <td className={`px-4 py-3 `}>
                                    <Whisper
                                       trigger="hover"
                                       placement="rightStart"
                                       speaker={
                                          <Tooltip>
                                             {toThousands(
                                                transaction?.pendingAmount
                                             )}
                                          </Tooltip>
                                       }>
                                       {transaction?.statusOfTransaction ===
                                          'pending' &&
                                       transaction?.paymentType ===
                                          'partial' ? (
                                          '₹ ' +
                                          toThousands(
                                             Number(
                                                transaction?.pendingAmount
                                             ).toFixed(0)
                                          )
                                       ) : transaction?.statusOfTransaction ===
                                         'completed' ? (
                                          '-'
                                       ) : (
                                          <HistoryToggleOffIcon />
                                       )}
                                    </Whisper>
                                 </td>
                                 <td className={`px-4 py-3 `}>
                                    <Whisper
                                       trigger="hover"
                                       placement="rightStart"
                                       speaker={
                                          <Tooltip>
                                             {toThousands(
                                                transaction?.paidAmount
                                             )}
                                          </Tooltip>
                                       }>
                                       {transaction?.paymentType ===
                                       'partial' ? (
                                          '₹ ' +
                                          toThousands(
                                             Number(
                                                transaction?.paidAmount
                                             ).toFixed(0)
                                          )
                                       ) : transaction?.statusOfTransaction ===
                                         'pending' ? (
                                          '-'
                                       ) : (
                                          <CreditScoreIcon />
                                       )}
                                    </Whisper>
                                 </td>
                                 <td className="px-4 py-3 tracking-wide">
                                    <div className={`font-bold text-white`}>
                                       {transaction?.statusOfTransaction ===
                                       'completed' ? (
                                          <p className="flex items-center text-[#166534] bg-[#dcfce7] border-1 border-[#8ffab5] p-1 rounded-4xl justify-center gap-1 text-xs">
                                             {/* <CircleCheck size={16} /> */}
                                             {String(
                                                transaction?.statusOfTransaction
                                             )
                                                .charAt(0)
                                                .toUpperCase() +
                                                String(
                                                   transaction?.statusOfTransaction
                                                ).slice(1)}
                                          </p>
                                       ) : transaction?.statusOfTransaction ===
                                            'pending' &&
                                         transaction?.paymentType ===
                                            'partial' ? (
                                          <p className="flex items-center border border-[#8a94fe] text-[#0e1a85] bg-[#c3d3fe] p-1 rounded-4xl justify-center gap-1 text-xs">
                                             Partial
                                          </p>
                                       ) : transaction?.statusOfTransaction ===
                                         'pending' ? (
                                          <p className="flex items-center border border-[#fef08a] text-[#854d0e] bg-[#fef9c3] p-1 rounded-4xl justify-center gap-1 text-xs">
                                             {/* <ClockArrowUp size={16} /> */}
                                             {String(
                                                transaction?.statusOfTransaction
                                             )
                                                .charAt(0)
                                                .toUpperCase() +
                                                String(
                                                   transaction?.statusOfTransaction
                                                ).slice(1)}
                                          </p>
                                       ) : (
                                          ''
                                       )}
                                    </div>
                                 </td>
                                 <td className="w-28 ">
                                    <div>
                                       <div className="flex gap-3 justify-center relative transition cursor-pointer items-center">
                                          <PenLine
                                             className="text-purple-500 text-sm p-2 border border-purple-500 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 hover:scale-120"
                                             onClick={() =>
                                                handleEditTransaction(
                                                   transaction
                                                )
                                             }
                                             size={28}
                                          />
                                          <Trash
                                             className="text-red-500 text-sm p-2 border border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-120"
                                             onClick={() =>
                                                handleDeleteTransaction(
                                                   transaction?.id
                                                )
                                             }
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
            <TransactionModal
               setShowModal={setShowModal}
               existingTransaction={selectedTransaction}
               isUpdateExpense={isUpdateExpense}
               type="transaction"
            />
         )}
      </div>
   );
};

export default Transaction;
