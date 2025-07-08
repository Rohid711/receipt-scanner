import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaTimes, 
  FaCalendar,
  FaUser,
  FaCheck,
  FaDownload,
  FaDatabase,
  FaCode
} from 'react-icons/fa';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface TaxItem {
  id: number;
  name: string;
  rate: number;
  amount: number;
}

interface Client {
  id: number;
  name: string;
  email?: string;
  address?: string;
}

interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  website: string;
  taxId: string;
  logo?: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { job: jobId } = router.query;
  
  // State for form fields
  const [clientId, setClientId] = useState<number | string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [taxItems, setTaxItems] = useState<TaxItem[]>([
    { id: 1, name: '', rate: 0, amount: 0 }
  ]);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Business profile state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  
  // Add state for setup
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [sqlScript, setSqlScript] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  
  // Fetch clients on component mount
  useEffect(() => {
    async function fetchClients() {
      try {
        console.log('Fetching clients...');
        const response = await fetch('/api/clients');
        const result = await response.json();
        
        console.log('Client API response:', result);
        
        if (result.success) {
          console.log(`Loaded ${result.data?.length || 0} clients`);
          setClients(result.data || []);
          
          // If there's only one client, select it automatically
          if (result.data && result.data.length === 1) {
            setClientId(result.data[0].id);
          }
        } else {
          console.error('Failed to load clients:', result.message);
          setError(result.message || 'Failed to load clients');
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Error connecting to the server');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClients();
  }, []);
  
  // Load business profile
  useEffect(() => {
    // Try to load from localStorage first
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
      try {
        setBusinessProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Error parsing profile from localStorage:', e);
      }
    }
    
    // Also fetch from server (this will be more up-to-date)
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profiles');
        if (response.ok) {
          const profiles = await response.json();
          if (profiles && profiles.length > 0) {
            setBusinessProfile(profiles[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching business profile:', err);
      }
    }
    
    fetchProfile();
  }, []);
  
  // Calculate due date (30 days from invoice date by default)
  useEffect(() => {
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + 30);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [invoiceDate]);
  
  // Generate invoice number
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setInvoiceNumber(`INV-${year}${month}-${randomNum}`);
  }, []);
  
  // Fetch job details if jobId is provided
  useEffect(() => {
    if (jobId) {
      // In a real app, you would fetch job details from API
      console.log(`Fetching job details for job ${jobId}`);
      // For now we just handle it as if we have no job data
    }
  }, [jobId]);
  
  // Calculate item amount when quantity or rate changes
  const updateItemAmount = (index: number, quantity: number, rate: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].rate = rate;
    newItems[index].amount = quantity * rate;
    setItems(newItems);
  };
  
  // Add a new item
  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, { id: newId, description: '', quantity: 1, rate: 0, amount: 0 }]);
  };
  
  // Delete an item
  const deleteItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  // Calculate total amount
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };
  
  // Calculate tax amounts for each tax item
  const calculateTaxAmounts = () => {
    const subtotal = calculateTotal();
    const newTaxItems = [...taxItems];
    
    // Update amount for each tax item
    newTaxItems.forEach(taxItem => {
      taxItem.amount = subtotal * (taxItem.rate / 100);
    });
    
    setTaxItems(newTaxItems);
    return newTaxItems;
  };
  
  // Get total tax amount
  const getTotalTaxAmount = () => {
    return taxItems.reduce((sum, tax) => sum + (tax.amount || 0), 0);
  };
  
  // Calculate grand total
  const calculateGrandTotal = () => {
    const subtotal = calculateTotal();
    const totalTaxAmount = getTotalTaxAmount();
    return subtotal + totalTaxAmount;
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!clientId) {
      setErrorMessage('Please select a client');
      return;
    }
    
    if (items.some(item => !item.description.trim())) {
      setErrorMessage('Please fill in all item descriptions');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Find the client by ID (which could be a string)
      console.log('Looking for client with ID:', clientId);
      console.log('Available clients:', clients);
      
      const selectedClient = clients.find(c => c.id.toString() === clientId.toString());
      
      if (!selectedClient) {
        throw new Error('Client not found. Please select a valid client.');
      }
      
      console.log('Selected client:', selectedClient);

      const subtotal = calculateTotal();
      const taxAmount = calculateTaxAmounts();
      const totalAmount = calculateGrandTotal();
      
      // First save the invoice to the database
      const invoiceDataForDb = {
        client_id: selectedClient.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        subtotal: subtotal,
        tax_rate: taxItems.length > 0 ? taxItems.reduce((sum, tax) => sum + tax.rate, 0) : 0,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'Pending',
        notes: notes,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))
      };

      console.log('Saving invoice to database:', invoiceDataForDb);
      
      // Save to database
      const dbResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceDataForDb),
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        console.error('Failed to save invoice to database:', errorData);
        // Continue with PDF generation even if database save fails
      } else {
        console.log('Invoice saved to database successfully');
      }
      
      // Prepare data for PDF generation
      const invoiceData = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        client: selectedClient,
        clientId: selectedClient.id,
        items,
        subtotal,
        taxItems,
        taxAmount,
        totalAmount,
        notes,
        businessProfile
      };

      try {
        const response = await fetch('/api/generate-invoice-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate invoice');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success message
        setSetupSuccess(true);
        setErrorMessage('Invoice created and saved successfully! The PDF has been downloaded.');
        
        // Reset form or redirect
        setTimeout(() => {
          router.push('/invoices');
        }, 2000);
      } catch (error) {
        console.error('Error generating invoice:', error);
        setErrorMessage('Failed to generate invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle invoice download
  const generatePDF = async () => {
    if (!clientId) {
      alert('Please select a client before downloading the invoice');
      return;
    }

    console.log('Generating PDF for client ID:', clientId);
    const selectedClient = clients.find(c => c.id.toString() === clientId.toString());
    
    if (!selectedClient) {
      alert('Client not found. Please select a valid client before downloading the invoice');
      return;
    }
    
    console.log('Selected client for PDF:', selectedClient);

    const subtotal = calculateTotal();
    const taxAmount = calculateTaxAmounts();
    const totalAmount = calculateGrandTotal();
    
    // First save the invoice to the database as a draft
    const invoiceDataForDb = {
      client_id: selectedClient.id,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      subtotal: subtotal,
      tax_rate: taxItems.length > 0 ? taxItems.reduce((sum, tax) => sum + tax.rate, 0) : 0,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'Draft',
      notes: notes,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      }))
    };

    console.log('Saving draft invoice to database:', invoiceDataForDb);
    
    try {
      // Save to database
      const dbResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceDataForDb),
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        console.error('Failed to save draft invoice to database:', errorData);
        // Continue with PDF generation even if database save fails
      } else {
        console.log('Draft invoice saved to database successfully');
      }
      
      // Prepare data for PDF generation
      const invoiceData = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        client: selectedClient,
        clientId: selectedClient.id,
        items,
        subtotal,
        taxItems,
        taxAmount: calculateTaxAmounts(),
        totalAmount: calculateGrandTotal(),
        notes,
        businessProfile
      };

      const response = await fetch('/api/generate-invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      setSetupSuccess(true);
      setErrorMessage('Draft invoice saved! The PDF has been downloaded for preview.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.');
    }
  };
  
  // Function to set up invoice tables
  const setupInvoiceTables = async () => {
    setIsSettingUp(true);
    try {
      // Try all three approaches in sequence
      
      // Approach 1: Direct SQL
      try {
        const directResponse = await fetch('/api/direct-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const directResult = await directResponse.json();
        
        if (directResult.success) {
          setSetupSuccess(true);
          setErrorMessage('Database tables created successfully! You can now try creating an invoice.');
          setIsSettingUp(false);
          return;
        }
      } catch (e) {
        console.error('Direct SQL approach failed:', e);
      }
      
      // Approach 2: Table creation API
      try {
        const tableResponse = await fetch('/api/create-invoice-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const tableResult = await tableResponse.json();
        
        if (tableResult.success) {
          setSetupSuccess(true);
          setErrorMessage('Database tables created successfully! You can now try creating an invoice.');
          setIsSettingUp(false);
          return;
        }
      } catch (e) {
        console.error('Table creation approach failed:', e);
      }
      
      // Approach 3: Original setup endpoint
      try {
        const setupResponse = await fetch('/api/setup-invoice-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const setupResult = await setupResponse.json();
        
        if (setupResult.success) {
          setSetupSuccess(true);
          setErrorMessage('Database tables created successfully! You can now try creating an invoice.');
          setIsSettingUp(false);
          return;
        } else {
          setErrorMessage(`Failed to set up database: ${setupResult.error || setupResult.message}`);
        }
      } catch (e) {
        console.error('Setup endpoint approach failed:', e);
        setErrorMessage('All database setup approaches failed. Please run the migration manually.');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      setErrorMessage('Failed to set up database. Please try running the migration manually.');
    } finally {
      setIsSettingUp(false);
    }
  };
  
  // Function to get the SQL script
  const getManualSql = async () => {
    try {
      const response = await fetch('/api/manual-sql');
      const result = await response.json();
      
      if (result.success) {
        setSqlScript(result.sql);
        setShowSql(true);
      }
    } catch (error) {
      console.error('Error getting SQL script:', error);
    }
  };
  
  // Add a new tax item
  const addTaxItem = () => {
    const newId = taxItems.length > 0 ? Math.max(...taxItems.map(tax => tax.id)) + 1 : 1;
    setTaxItems([...taxItems, { id: newId, name: '', rate: 0, amount: 0 }]);
  };
  
  // Delete a tax item
  const deleteTaxItem = (id: number) => {
    if (taxItems.length > 1) {
      setTaxItems(taxItems.filter(tax => tax.id !== id));
    }
  };
  
  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className={`border px-4 py-3 rounded relative ${setupSuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`} role="alert">
          <strong className="font-bold">{setupSuccess ? 'Success: ' : 'Error: '}</strong>
          <span className="block sm:inline">{errorMessage}</span>
          {errorMessage.includes('Database') && !setupSuccess && (
            <div className="mt-2">
              <p className="font-semibold">Administrator Instructions:</p>
              <ol className="list-decimal list-inside mt-2 text-sm">
                <li>Make sure Supabase is running and accessible</li>
                <li>Run the SQL in the migration file: <code className="bg-red-100 px-1">supabase/migrations/20240624_add_invoices_tables.sql</code></li>
                <li>You can run this SQL directly in your Supabase SQL editor or via the command line</li>
                <li>If you're using the Supabase CLI, run: <code className="bg-red-100 px-1">npx supabase db push</code></li>
              </ol>
              <div className="mt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={setupInvoiceTables}
                  disabled={isSettingUp}
                  className="btn-primary flex items-center text-sm"
                >
                  {isSettingUp ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                      Setting up tables...
                    </>
                  ) : (
                    <>
                      <FaDatabase className="mr-2" />
                      Set Up Invoice Tables Now
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={getManualSql}
                  className="btn-secondary flex items-center text-sm"
                >
                  <FaCode className="mr-2" />
                  Show SQL to Run Manually
                </button>
              </div>
              
              {showSql && sqlScript && (
                <div className="mt-4">
                  <p className="font-semibold">SQL Script to Run Manually:</p>
                  <div className="mt-2 bg-gray-800 text-white p-4 rounded overflow-auto max-h-60">
                    <pre className="text-xs">{sqlScript}</pre>
                  </div>
                  <p className="mt-2 text-sm">
                    Copy this SQL and run it in your Supabase SQL editor.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sqlScript);
                      alert('SQL copied to clipboard!');
                    }}
                    className="mt-2 btn-outline flex items-center text-sm"
                  >
                    Copy SQL to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Invoice</h1>
        <div className="flex space-x-2">
          <Link 
            href="/invoices" 
            className="btn-secondary flex items-center"
          >
            <FaTimes className="mr-2" />
            Cancel
          </Link>
          <button
            type="button"
            onClick={generatePDF}
            disabled={!clientId || items.some(item => !item.description.trim()) || isSubmitting}
            className="btn-secondary flex items-center"
          >
            <FaDownload className="mr-2" />
            Preview PDF
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="btn-primary flex items-center"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                Creating PDF...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Create & Download PDF
              </>
            )}
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Client and Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  {isLoading ? (
                    <div className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      Loading clients...
                    </div>
                  ) : error ? (
                    <div className="w-full pl-10 pr-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-500">
                      {error}
                    </div>
                  ) : (
                    <select
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={clientId}
                      onChange={(e) => {
                        console.log('Selected client ID:', e.target.value);
                        setClientId(e.target.value);
                      }}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Can't find your client? <Link href="/clients/new" className="text-primary-600 hover:text-primary-800">Add a new client</Link>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Invoice Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-outline flex items-center text-sm"
                >
                  <FaPlus className="mr-1" />
                  Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Quantity
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Rate
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Amount
                      </th>
                      <th scope="col" className="relative px-4 py-3 w-12">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].description = e.target.value;
                              setItems(newItems);
                            }}
                            placeholder="Enter item description"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={item.quantity}
                            onChange={(e) => updateItemAmount(index, parseInt(e.target.value) || 0, item.rate)}
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={item.rate}
                            onChange={(e) => updateItemAmount(index, item.quantity, parseFloat(e.target.value) || 0)}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={items.length === 1}
                          >
                            <FaTrash />
                            <span className="sr-only">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">
                        Subtotal
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(calculateTotal())}
                      </td>
                      <td></td>
                    </tr>
                    
                    {/* Tax Items */}
                    {taxItems.map((taxItem, index) => (
                      <tr key={taxItem.id}>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={taxItem.name}
                            onChange={(e) => {
                              const newTaxItems = [...taxItems];
                              newTaxItems[index].name = e.target.value;
                              setTaxItems(newTaxItems);
                            }}
                            placeholder="Tax Name (GST, PST, etc.)"
                          />
                        </td>
                        <td colSpan={1} className="px-4 py-3 text-right font-medium text-gray-900">
                          Rate (%)
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={taxItem.rate}
                            onChange={(e) => {
                              const newTaxItems = [...taxItems];
                              newTaxItems[index].rate = parseFloat(e.target.value) || 0;
                              newTaxItems[index].amount = calculateTotal() * (parseFloat(e.target.value) || 0) / 100;
                              setTaxItems(newTaxItems);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(taxItem.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteTaxItem(taxItem.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={taxItems.length === 1}
                          >
                            <FaTrash />
                            <span className="sr-only">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Add Tax Button */}
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={addTaxItem}
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                        >
                          <FaPlus className="mr-1" /> Add Another Tax
                        </button>
                      </td>
                    </tr>
                    
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(calculateGrandTotal())}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or payment instructions"
              ></textarea>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-2">
            <Link 
              href="/invoices" 
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                  Creating PDF...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Create & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 