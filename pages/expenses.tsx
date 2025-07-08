import React, { useState } from 'react';
import Link from 'next/link';
import { FaPlus, FaReceipt, FaFilter, FaSearch, FaFileDownload } from 'react-icons/fa';

interface Expense {
  id: number;
  vendor: string;
  date: string;
  amount: string;
  category: string;
  paymentMethod: string;
  description: string;
  receiptId?: number;
}

// Empty expense data
const sampleExpenses: Expense[] = [];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Filter expenses based on search query and category
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories for the filter dropdown
  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];
  
  // Format currency for display
  const formatCurrency = (amount: string | number): string => {
    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    }
    
    if (isNaN(amount)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };
  
  // Calculate expense totals
  const totalExpenses = expenses.reduce((sum, expense) => {
    return sum + parseFloat(expense.amount);
  }, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          <p className="text-gray-500">
            Total expenses: {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/receipts" 
            className="btn-secondary flex items-center"
          >
            <FaReceipt className="mr-2" />
            Manage Receipts
          </Link>
          <Link 
            href="/expenses/new" 
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Expense
          </Link>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search expenses by vendor or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaFilter className="text-gray-400" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn-outline flex items-center sm:w-auto w-full justify-center"
          onClick={() => alert('Export functionality would be implemented here')}
        >
          <FaFileDownload className="mr-2" />
          Export
        </button>
      </div>
      
      {/* Expenses List */}
      {filteredExpenses.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            <div>Date</div>
            <div>Vendor</div>
            <div>Category</div>
            <div>Description</div>
            <div>Payment Method</div>
            <div>Amount</div>
            <div className="text-right">Receipt</div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <div 
                key={expense.id} 
                className="grid grid-cols-7 px-6 py-4 hover:bg-gray-50 items-center"
              >
                <div className="text-gray-500">{formatDate(expense.date)}</div>
                <div className="font-medium text-gray-900">{expense.vendor}</div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    expense.category === 'Fuel' ? 'bg-blue-100 text-blue-800' :
                    expense.category === 'Materials' ? 'bg-green-100 text-green-800' :
                    expense.category === 'Equipment' ? 'bg-purple-100 text-purple-800' :
                    expense.category === 'Repairs' ? 'bg-yellow-100 text-yellow-800' :
                    expense.category === 'Permits' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {expense.category}
                  </span>
                </div>
                <div className="truncate max-w-xs" title={expense.description}>
                  {expense.description}
                </div>
                <div>{expense.paymentMethod}</div>
                <div className="font-medium">{formatCurrency(expense.amount)}</div>
                <div className="text-right">
                  {expense.receiptId ? (
                    <Link 
                      href={`/receipts?id=${expense.receiptId}`}
                      className="text-primary-600 hover:text-primary-800 font-medium text-sm inline-flex items-center"
                    >
                      <FaReceipt className="mr-1" /> View
                    </Link>
                  ) : (
                    <Link 
                      href="/receipts"
                      className="text-gray-400 hover:text-gray-600 text-sm inline-flex items-center"
                    >
                      <FaPlus className="mr-1" /> Add
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FaReceipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedCategory !== 'All' ? 
              'Try changing your search criteria or category filter' : 
              'Start by adding your first expense'}
          </p>
          <Link
            href="/expenses/new"
            className="btn-primary inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Expense
          </Link>
        </div>
      )}
    </div>
  );
} 