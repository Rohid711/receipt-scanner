import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaCalendar, 
  FaFileInvoiceDollar,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFileDownload,
  FaEnvelope,
  FaCreditCard,
  FaMoneyBillWave,
  FaPaypal,
  FaStripe,
  FaUniversity,
  FaCashRegister
} from 'react-icons/fa';

interface Invoice {
  id: number | string;
  jobId?: number;
  clientId: number;
  clientName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Sample invoice data
const sampleInvoices: Invoice[] = [];

export default function InvoicesPage() {
  const router = useRouter();
  const { clientId: clientIdParam } = router.query;
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const invoiceStatuses = ['All', 'Paid', 'Pending', 'Overdue'];
  
  // Calculate total amounts
  const totalUnpaidAmount = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + inv.amount - inv.amountPaid, 0);
    
  const totalOverdueAmount = invoices
    .filter(inv => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.amount - inv.amountPaid, 0);
  
  // Fetch invoices from API
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices');
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match our interface
        const formattedInvoices = await Promise.all(data.data.map(async (invoice: any) => {
          // Fetch invoice items if they're not included in the response
          let items = [];
          try {
            if (!invoice.items || invoice.items.length === 0) {
              const itemsResponse = await fetch(`/api/invoice-items?invoice_id=${invoice.id}`);
              const itemsData = await itemsResponse.json();
              if (itemsData.success) {
                items = itemsData.data.map((item: any) => ({
                  id: item.id,
                  description: item.description,
                  quantity: item.quantity,
                  rate: item.rate,
                  amount: item.amount
                }));
              }
            } else {
              items = invoice.items.map((item: any) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount
              }));
            }
          } catch (error) {
            console.error(`Error fetching items for invoice ${invoice.id}:`, error);
          }
          
          return {
            id: invoice.id,
            jobId: invoice.job_id,
            clientId: invoice.client_id,
            clientName: invoice.client ? invoice.client.name : 'Unknown Client',
            invoiceNumber: invoice.invoice_number,
            date: invoice.invoice_date,
            dueDate: invoice.due_date,
            amount: invoice.total_amount,
            amountPaid: invoice.amount_paid || 0,
            status: invoice.status,
            notes: invoice.notes,
            items: items
          };
        }));
        
        setInvoices(formattedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  // Filter invoices based on search query, status, and clientId
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || invoice.status === selectedStatus;
    
    const matchesClient = !clientIdParam || invoice.clientId.toString() === clientIdParam;
    
    return matchesSearch && matchesStatus && matchesClient;
  });
  
  // Sort invoices by date (newest first)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
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
  
  // Get status icon based on invoice status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case 'Overdue':
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FaCalendar className="w-4 h-4 text-blue-500" />;
    }
  };
  
  // Get status color based on invoice status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Calculate payment status
  const getPaymentStatus = (invoice: Invoice) => {
    if (invoice.amountPaid === 0) return 'Not Paid';
    if (invoice.amountPaid < invoice.amount) return 'Partially Paid';
    return 'Fully Paid';
  };
  
  // Calculate days overdue or until due
  const getDueDateInfo = (invoice: Invoice) => {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `Due in ${diffDays} days`;
    }
  };
  
  // Add this function to handle PDF download
  const downloadPdf = async (invoice: Invoice) => {
    if (!invoice || !invoice.clientId) {
      alert('Error: Client information is missing');
      return;
    }

    try {
      // Add default notes if not present
      const notes = invoice.notes || "Thank you for your business. Please pay within the due date.";
      
      // Check if the invoice already exists in the database
      // If it's already in the database, we don't need to save it again
      // We can identify this by checking if the invoice has an id that's not auto-generated
      const isExistingInvoice = typeof invoice.id === 'string' && invoice.id.includes('invoice_');
      
      // If it's not an existing invoice, save it to the database first
      if (!isExistingInvoice) {
        console.log('Saving invoice to database before generating PDF');
        
        // Prepare invoice data for database
        const invoiceDataForDb = {
          client_id: invoice.clientId,
          invoice_number: invoice.invoiceNumber,
          invoice_date: invoice.date,
          due_date: invoice.dueDate,
          subtotal: invoice.amount,
          tax_rate: 0, // Default to 0 if not available
          tax_amount: 0, // Default to 0 if not available
          total_amount: invoice.amount,
          status: invoice.status || 'Pending',
          notes: notes,
          items: invoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }))
        };
        
        // Save to database
        const dbResponse = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceDataForDb),
        });
        
        if (!dbResponse.ok) {
          console.error('Failed to save invoice to database:', await dbResponse.json());
          // Continue with PDF generation even if database save fails
        } else {
          console.log('Invoice saved to database successfully');
          // Refresh the invoice list
          fetchInvoices();
        }
      }
      
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.date,
        dueDate: invoice.dueDate,
        clientId: invoice.clientId,
        client: { id: invoice.clientId, name: invoice.clientName },
        items: invoice.items,
        subtotal: invoice.amount,
        taxItems: [],
        totalAmount: invoice.amount,
        notes: notes // Include notes in the invoice data
      };

      console.log('Sending invoice data with notes:', invoiceData);

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
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.');
    }
  };
  
  // Handle recording payment
  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Calculate new total paid amount
      const newAmountPaid = (selectedInvoice.amountPaid || 0) + paymentAmount;
      
      // Determine new status
      let newStatus = selectedInvoice.status;
      if (newAmountPaid >= selectedInvoice.amount) {
        newStatus = 'Paid';
      } else if (newStatus === 'Overdue') {
        // Keep it as overdue if it was already overdue
        newStatus = 'Overdue';
      } else {
        newStatus = 'Pending';
      }
      
      const response = await fetch('/api/update-invoice-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          status: newStatus,
          amountPaid: newAmountPaid,
          paymentDate,
          paymentMethod,
          paymentNote
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }
      
      // Refresh invoices list
      fetchInvoices();
      
      // Close the modal
      setShowPaymentModal(false);
      
      // Reset form
      setPaymentAmount(0);
      setPaymentMethod('Credit Card');
      setPaymentNote('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
      // Close invoice details modal
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to record payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: <FaCreditCard className="mr-2" /> },
    { id: 'cash', name: 'Cash', icon: <FaMoneyBillWave className="mr-2" /> },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: <FaUniversity className="mr-2" /> },
    { id: 'paypal', name: 'PayPal', icon: <FaPaypal className="mr-2" /> },
    { id: 'stripe', name: 'Stripe', icon: <FaStripe className="mr-2" /> },
    { id: 'other', name: 'Other', icon: <FaCashRegister className="mr-2" /> }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {clientIdParam ? 
              `Invoices for ${filteredInvoices[0]?.clientName || 'Client'}` : 
              'Invoices'
            }
          </h1>
          <p className="text-gray-500">
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/invoices/new" 
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            New Invoice
          </Link>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Outstanding Balance</p>
            <FaFileInvoiceDollar className="text-primary-500 h-8 w-8" />
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totalUnpaidAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">
            Across {invoices.filter(inv => inv.status !== 'Paid').length} unpaid invoices
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Overdue Amount</p>
            <FaExclamationTriangle className="text-red-500 h-8 w-8" />
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totalOverdueAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">
            Across {invoices.filter(inv => inv.status === 'Overdue').length} overdue invoices
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Paid this Month</p>
            <FaCheckCircle className="text-green-500 h-8 w-8" />
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {formatCurrency(
              invoices
                .filter(inv => {
                  const invDate = new Date(inv.date);
                  const currentDate = new Date();
                  return invDate.getMonth() === currentDate.getMonth() && 
                         invDate.getFullYear() === currentDate.getFullYear() &&
                         inv.status === 'Paid';
                })
                .reduce((sum, inv) => sum + inv.amount, 0)
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.filter(inv => {
              const invDate = new Date(inv.date);
              const currentDate = new Date();
              return invDate.getMonth() === currentDate.getMonth() && 
                     invDate.getFullYear() === currentDate.getFullYear() &&
                     inv.status === 'Paid';
            }).length} invoices paid
          </p>
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
            placeholder="Search invoices by client or invoice number..."
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
          >
            {invoiceStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Invoices List */}
      {sortedInvoices.length > 0 ? (
        <div className="space-y-4">
          {sortedInvoices.map(invoice => (
            <div 
              key={invoice.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-medium text-gray-900 mr-3">{invoice.invoiceNumber}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status}</span>
                      </span>
                    </div>
                    <Link 
                      href={`/clients/${invoice.clientId}`}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {invoice.clientName}
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    <p className="text-sm text-gray-500 mt-1">{getPaymentStatus(invoice)}</p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Invoice Date</span>
                    <span className="text-sm text-gray-900 mt-1">{formatDate(invoice.date)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Due Date</span>
                    <span className="text-sm text-gray-900 mt-1">{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className={`text-sm mt-1 ${
                      invoice.status === 'Overdue' ? 'text-red-600' :
                      invoice.status === 'Pending' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {invoice.status === 'Paid' ? 'Paid in full' : getDueDateInfo(invoice)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoice(invoice);
                  }}
                >
                  View Details
                </button>
                
                {invoice.status !== 'Paid' && (
                  <button
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPaymentModal(true);
                    }}
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FaFileInvoiceDollar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedStatus !== 'All' ? 
              'Try changing your search criteria or status filter' : 
              'Create your first invoice to get started'}
          </p>
          <Link
            href="/invoices/new"
            className="btn-primary inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            New Invoice
          </Link>
        </div>
      )}
      
      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-xl font-bold text-gray-900 mr-3">{selectedInvoice.invoiceNumber}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusIcon(selectedInvoice.status)}
                      <span className="ml-1">{selectedInvoice.status}</span>
                    </span>
                  </div>
                  <Link 
                    href={`/clients/${selectedInvoice.clientId}`}
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    {selectedInvoice.clientName}
                  </Link>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Invoice Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.date)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className={`font-medium ${
                    selectedInvoice.status === 'Overdue' ? 'text-red-600' :
                    selectedInvoice.status === 'Pending' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {getPaymentStatus(selectedInvoice)}
                  </p>
                </div>
              </div>
              
              {selectedInvoice.jobId && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Related Job</p>
                  <Link 
                    href={`/jobs/${selectedInvoice.jobId}`}
                    className="text-primary-600 hover:text-primary-800 flex items-center"
                  >
                    <FaCalendar className="mr-1 h-4 w-4" />
                    View Related Job
                  </Link>
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Invoice Items</p>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                          Total
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(selectedInvoice.amount)}
                        </td>
                      </tr>
                      {selectedInvoice.amountPaid > 0 && (
                        <>
                          <tr>
                            <td colSpan={3} className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                              Amount Paid
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-green-600 text-right">
                              {formatCurrency(selectedInvoice.amountPaid)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                              Balance Due
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-red-600 text-right">
                              {formatCurrency(selectedInvoice.amount - selectedInvoice.amountPaid)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setSelectedInvoice(null)} 
                className="btn-secondary"
              >
                Close
              </button>
              
              <button
                className="btn-outline flex items-center"
                onClick={() => downloadPdf(selectedInvoice)}
              >
                <FaFileDownload className="mr-2" />
                Download PDF
              </button>
              
              <button
                className="btn-outline flex items-center"
                onClick={() => alert('Email invoice functionality would be implemented here')}
              >
                <FaEnvelope className="mr-2" />
                Email Invoice
              </button>
              
              {selectedInvoice.status !== 'Paid' && (
                <button
                  className="btn-primary"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Record Payment</h2>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Invoice</p>
                <p className="font-medium">{selectedInvoice.invoiceNumber} - {selectedInvoice.clientName}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance Due</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice.amount - (selectedInvoice.amountPaid || 0))}</p>
                </div>
              </div>
              
              <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
                  Payment Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="paymentAmount"
                    id="paymentAmount"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.amount - (selectedInvoice.amountPaid || 0)}
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
                <button 
                  type="button"
                  className="mt-1 text-sm text-primary-600 hover:text-primary-500"
                  onClick={() => setPaymentAmount(selectedInvoice.amount - (selectedInvoice.amountPaid || 0))}
                >
                  Pay full amount
                </button>
              </div>
              
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  id="paymentDate"
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      className={`flex items-center p-3 border rounded-md cursor-pointer ${
                        paymentMethod === method.name 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                      onClick={() => setPaymentMethod(method.name)}
                    >
                      {method.icon}
                      <span>{method.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="paymentNote" className="block text-sm font-medium text-gray-700">
                  Note (Optional)
                </label>
                <textarea
                  name="paymentNote"
                  id="paymentNote"
                  rows={2}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add any notes about this payment"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={isProcessingPayment || paymentAmount <= 0}
                className="btn-primary flex items-center"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 