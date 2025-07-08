import React, { useState, useEffect } from 'react';
import ReceiptScanner from '../components/ReceiptScanner';
import { FaPlus, FaFileAlt, FaSearch, FaFilter, FaSort, FaReceipt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { exportToExcel, formatReceiptsForExport } from '../utils/excelExport';

// Define the Receipt interface
interface Receipt {
  id: number;
  date: string;
  vendor: string;
  amount: number;
  totalAmount: string;
  category: string;
  status: string;
  notes?: string;
  items: Array<{
    name: string;
    price: string;
  }>;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState<Receipt | null>(null);

  // Fetch receipts on component mount
  useEffect(() => {
    fetchReceipts();
  }, [filterCategory]);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/receipts');
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }
      
      const data = await response.json();
      
      // If category filter is applied
      if (filterCategory !== 'All') {
        setReceipts(data.filter((r: Receipt) => r.category === filterCategory));
      } else {
        setReceipts(data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReceipt = async (receiptData: any) => {
    try {
      console.log("Saving receipt data:", receiptData);
      
      const newReceipt = {
        id: Date.now(), // Convert to string to match our Receipt interface
        vendor: receiptData.vendor,
        date: receiptData.date,
        totalAmount: receiptData.totalAmount,
        category: receiptData.category || 'Uncategorized',
        items: receiptData.items || [],
        status: 'Pending',
        notes: receiptData.notes,
        createdAt: new Date().toISOString()
      };
      
      console.log("Sending to API:", newReceipt);
      
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReceipt),
      });
      
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to save receipt: ' + errorText);
      }
      
      // Refresh the receipt list
      fetchReceipts();
      
      // Close the scanner modal
      setShowScanner(false);
      
      return true;
    } catch (error) {
      console.error('Error saving receipt:', error);
      return false;
    }
  };

  // Filter receipts based on search term
  const filteredReceipts = receipts.filter(receipt => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      receipt.vendor.toLowerCase().includes(searchLower) ||
      receipt.category.toLowerCase().includes(searchLower) ||
      receipt.totalAmount.includes(searchLower)
    );
  });

  // Get unique categories for the filter dropdown
  const categories = ['All', ...Array.from(new Set(receipts.map(r => r.category)))];

  // Add a function to handle Excel export
  const handleExportToExcel = () => {
    if (receipts.length === 0) {
      alert('No receipts to export');
      return;
    }
    
    const formattedData = formatReceiptsForExport(receipts);
    exportToExcel(formattedData, 'Bizznex_Receipts', 'Receipts');
  };

  // Function to handle receipt deletion
  const handleDeleteReceipt = (id: number) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id));
    if (selectedReceipt?.id === id) {
      setSelectedReceipt(null);
    }
  };

  // Function to handle receipt selection
  const handleSelectReceipt = (receipt: Receipt) => {
    if (selectedReceipt?.id === receipt.id) {
      setSelectedReceipt(null);
    } else {
      setSelectedReceipt(receipt);
    }
  };

  // Function to update receipt status
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const updatedReceipts = receipts.map(receipt =>
        receipt.id === id ? { ...receipt, status: newStatus } : receipt
      );
      setReceipts(updatedReceipts);
      
      if (selectedReceipt?.id === id) {
        setSelectedReceipt({ ...selectedReceipt, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating receipt status:', error);
    }
  };

  // Add this function to handle editing a receipt
  const handleEditReceipt = async () => {
    if (!editedReceipt) return;
    
    try {
      const response = await fetch('/api/receipts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editedReceipt.id,
          vendor: editedReceipt.vendor,
          date: editedReceipt.date,
          totalAmount: editedReceipt.totalAmount,
          category: editedReceipt.category,
          items: editedReceipt.items,
          status: editedReceipt.status,
          notes: editedReceipt.notes
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update receipt');
      }
      
      // Update receipt in state
      setReceipts(prev => 
        prev.map(receipt => 
          receipt.id === editedReceipt.id 
            ? editedReceipt
            : receipt
        )
      );
      
      // Update selected receipt
      setSelectedReceipt(editedReceipt);
      setIsEditing(false);
      
      // Show success message
      alert('Receipt updated successfully!');
    } catch (error) {
      console.error('Error updating receipt:', error);
      alert('Failed to update receipt. Please try again.');
    }
  };

  // Add this function to handle form field changes
  const handleEditFieldChange = (field: string, value: string) => {
    if (!editedReceipt) return;
    
    setEditedReceipt({
      ...editedReceipt,
      [field]: value
    });
  };

  // Add this function to handle item changes
  const handleEditItemChange = (index: number, field: string, value: string) => {
    if (!editedReceipt) return;
    
    const updatedItems = [...editedReceipt.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    setEditedReceipt({
      ...editedReceipt,
      items: updatedItems
    });
  };

  // Add a function to add a new item
  const handleAddItem = () => {
    if (!editedReceipt) return;
    
    setEditedReceipt({
      ...editedReceipt,
      items: [
        ...editedReceipt.items,
        { name: '', price: '' }
      ]
    });
  };

  // Add a function to remove an item
  const handleRemoveItem = (index: number) => {
    if (!editedReceipt) return;
    
    const updatedItems = [...editedReceipt.items];
    updatedItems.splice(index, 1);
    
    setEditedReceipt({
      ...editedReceipt,
      items: updatedItems
    });
  };

  // Add this to enable editing mode
  const startEditing = () => {
    if (selectedReceipt) {
      setEditedReceipt({...selectedReceipt});
      setIsEditing(true);
    }
  };

  // Add this to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedReceipt(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">
            <span className="flex items-center">
              <FaReceipt className="mr-2 text-primary" />
              Business Receipts
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Track and manage all your business expenses</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn-outline flex items-center border-primary text-primary hover:bg-primary hover:text-white" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="w-4 h-4 mr-2" /> 
            Filters
          </button>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search receipts..." 
              className="input pl-10 border-primary focus:ring-primary focus:border-primary" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button 
            className="btn-outline flex items-center border-primary text-primary hover:bg-primary hover:text-white"
            onClick={handleExportToExcel}
          >
            <FaFileAlt className="w-4 h-4 mr-2" /> 
            Export
          </button>
          <button className="btn-primary flex items-center" onClick={() => setShowScanner(true)}>
            <FaPlus className="w-4 h-4 mr-2" /> 
            Scan New Receipt
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="card p-6">
          <div className="flex flex-wrap gap-6">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                className="input py-2.5" 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select className="input py-2.5">
                <option value="">All Statuses</option>
                <option value="Reconciled">Reconciled</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="min-w-[300px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input type="date" className="input py-2.5" />
                <span className="self-center text-gray-500">to</span>
                <input type="date" className="input py-2.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Scan Receipt</h2>
              <button 
                onClick={() => setShowScanner(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <ReceiptScanner onSave={handleSaveReceipt} />
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="section-title">Recent Receipts</h2>
        
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-green-500 mb-3"></div>
            <p className="text-gray-500 text-lg">Loading receipts...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="py-16 text-center">
            <FaReceipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-xl mb-2">No receipts found</p>
            {searchTerm && (
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            )}
            <button className="btn-primary inline-flex items-center" onClick={() => setShowScanner(true)}>
              <FaPlus className="w-4 h-4 mr-2" /> 
              Scan Your First Receipt
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header">
                      <div className="flex items-center cursor-pointer">
                        DATE
                        <FaSort className="ml-1 h-3 w-3 text-blue-300" />
                      </div>
                    </th>
                    <th className="table-header">
                      <div className="flex items-center cursor-pointer">
                        VENDOR
                        <FaSort className="ml-1 h-3 w-3 text-blue-300" />
                      </div>
                    </th>
                    <th className="table-header">
                      CATEGORY
                    </th>
                    <th className="table-header">
                      <div className="flex items-center cursor-pointer">
                        AMOUNT
                        <FaSort className="ml-1 h-3 w-3 text-blue-300" />
                      </div>
                    </th>
                    <th className="table-header">
                      STATUS
                    </th>
                    <th className="table-header">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReceipts.map((receipt, index) => (
                    <tr key={receipt.id} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="table-cell text-blue-700 font-medium">
                        {new Date(receipt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="table-cell text-blue-700 font-medium">
                        {receipt.vendor}
                      </td>
                      <td className="table-cell">
                        {receipt.category}
                      </td>
                      <td className="table-cell text-blue-700 font-medium">
                        {receipt.totalAmount}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className={receipt.status === 'Reconciled' ? 'badge badge-success' : 'badge badge-pending'}>
                            {receipt.status}
                          </span>
                          <div className="relative ml-2">
                            <select 
                              className="input py-1 pl-2 pr-8 text-xs border-gray-200"
                              value={receipt.status || 'Pending'}
                              onChange={(e) => handleUpdateStatus(Number(receipt.id), e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Reconciled">Reconciled</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-1.5 rounded-full transition-colors shadow-sm" onClick={() => setSelectedReceipt(receipt)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-8 flex justify-center">
              <nav className="flex space-x-1.5" aria-label="Pagination">
                <a
                  href="#"
                  className="relative inline-flex items-center px-3 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 shadow-sm"
                >
                  <span className="sr-only">Previous</span>
                  &lt;
                </a>
                <a
                  href="#"
                  aria-current="page"
                  className="z-10 bg-green-100 border-green-500 text-green-800 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-full shadow-sm"
                >
                  1
                </a>
                <a
                  href="#"
                  className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-full shadow-sm"
                >
                  2
                </a>
                <a
                  href="#"
                  className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-full shadow-sm"
                >
                  3
                </a>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-full">
                  ...
                </span>
                <a
                  href="#"
                  className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-full shadow-sm"
                >
                  8
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center px-3 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 shadow-sm"
                >
                  <span className="sr-only">Next</span>
                  &gt;
                </a>
              </nav>
            </div>
          </>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Receipt' : 'Receipt Details'}
              </h2>
              <button 
                onClick={() => {
                  setSelectedReceipt(null);
                  setIsEditing(false);
                  setEditedReceipt(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                      <input 
                        type="text" 
                        className="input w-full" 
                        value={editedReceipt?.vendor || ''} 
                        onChange={(e) => handleEditFieldChange('vendor', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <input 
                        type="text" 
                        className="input w-full" 
                        value={editedReceipt?.totalAmount || ''} 
                        onChange={(e) => handleEditFieldChange('totalAmount', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input 
                        type="date" 
                        className="input w-full" 
                        value={editedReceipt?.date || ''} 
                        onChange={(e) => handleEditFieldChange('date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select 
                        className="input w-full" 
                        value={editedReceipt?.category || ''} 
                        onChange={(e) => handleEditFieldChange('category', e.target.value)}
                      >
                        <option value="Materials">Materials</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Fuel">Fuel</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea 
                        className="input w-full h-24" 
                        value={editedReceipt?.notes || ''} 
                        onChange={(e) => handleEditFieldChange('notes', e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Items</label>
                      <button 
                        type="button" 
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center"
                        onClick={handleAddItem}
                      >
                        <FaPlus className="w-3 h-3 mr-1" /> Add Item
                      </button>
                    </div>
                    <div className="border rounded-xl overflow-hidden shadow-sm mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {editedReceipt?.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  className="input w-full py-1" 
                                  value={item.name} 
                                  onChange={(e) => handleEditItemChange(index, 'name', e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  className="input w-full py-1 text-right" 
                                  value={item.price} 
                                  onChange={(e) => handleEditItemChange(index, 'price', e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button 
                                  type="button" 
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <FaTimes />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedReceipt.vendor}</h3>
                    <span className="text-2xl font-bold text-green-600">{selectedReceipt.totalAmount}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
                      <p className="font-medium text-lg">{new Date(selectedReceipt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                      <p className="font-medium text-lg">{selectedReceipt.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                      <div className="flex items-center">
                        <span className={`badge ${selectedReceipt.status === 'Reconciled' ? 'badge-success' : 'badge-pending'} mr-3`}>
                          {selectedReceipt.status || 'Pending'}
                        </span>
                        <div className="relative">
                          <select 
                            className="input py-1 pl-2 pr-8 text-sm"
                            value={selectedReceipt.status || 'Pending'}
                            onChange={(e) => handleUpdateStatus(Number(selectedReceipt.id), e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Reconciled">Reconciled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedReceipt.items?.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                {item.price}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              Total
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                              {selectedReceipt.totalAmount}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  
                  {selectedReceipt.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                      <p className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 border border-gray-100">
                        {selectedReceipt.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEditing} 
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary flex items-center"
                    onClick={handleEditReceipt}
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedReceipt(null)} 
                    className="btn-outline"
                  >
                    Close
                  </button>
                  <button
                    className="btn-primary flex items-center"
                    onClick={startEditing}
                  >
                    <FaEdit className="w-4 h-4 mr-2" />
                    Edit Receipt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 