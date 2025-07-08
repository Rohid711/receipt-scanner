import React, { useState, useEffect } from 'react';
import { FaSearch, FaFileExport, FaFilter, FaCalendarAlt, FaPrint, FaCog, FaPlus, FaUserClock } from 'react-icons/fa';
import Link from 'next/link';
import { exportToExcel, formatPayrollForExport } from '../../utils/excelExport';

// Type definitions
interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  hourlySalary: number;
  email: string;
}

interface PayrollEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  period: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  adjustments: number;
  status: string;
}

export default function PayrollPage() {
  // State for payroll entries
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');

  useEffect(() => {
    // Fetch employees from API
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        const result = await response.json();
        
        if (result.success) {
          setEmployees(result.data);
          console.log('Loaded employees:', result.data);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    // Fetch payroll data
    const fetchPayrollData = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, fetch actual payroll data
        const response = await fetch('/api/payroll');
        const result = await response.json();
        
        if (result.success && result.data) {
          setPayrollEntries(result.data.map((entry: any) => ({
            id: entry._id || entry.id,
            employeeId: entry.employeeId,
            employeeName: entry.employeeName || 'Unknown Employee',
            department: entry.department || 'Unassigned',
            period: `${formatDate(new Date(entry.periodStart))} - ${formatDate(new Date(entry.periodEnd))}`,
            regularHours: entry.regularHours || 0,
            overtimeHours: entry.overtimeHours || 0,
            hourlyRate: entry.hourlyRate || 0,
            overtimeRate: entry.overtimeRate || 0,
            adjustments: entry.adjustments || 0,
            status: entry.status || 'Draft'
          })));
        } else {
          // If no payroll data yet, initialize with empty array
          setPayrollEntries([]);
        }
      } catch (error) {
        console.error('Error fetching payroll data:', error);
        setPayrollEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
    fetchPayrollData();
  }, [selectedPeriod]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPeriodDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let startDate, endDate;
    
    if (selectedPeriod === 'current') {
      // Current month
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
    } else if (selectedPeriod === 'previous') {
      // Previous month
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    } else if (selectedPeriod === 'next') {
      // Next month
      startDate = new Date(currentYear, currentMonth + 1, 1);
      endDate = new Date(currentYear, currentMonth + 2, 0);
    }
    
    return {
      start: formatDate(startDate!),
      end: formatDate(endDate!)
    };
  };

  const getSelectedPeriodName = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (selectedPeriod === 'current') {
      return new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (selectedPeriod === 'previous') {
      return new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (selectedPeriod === 'next') {
      return new Date(currentYear, currentMonth + 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return '';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter payroll entries based on search term and filters
  const filteredPayrollEntries = payrollEntries.filter(entry => {
    // Check if entry matches search term
    const matchesSearch = 
      entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if entry matches status filter
    const matchesStatus = filterStatus === 'All' || entry.status === filterStatus;
    
    // Check if entry matches department filter
    const matchesDepartment = filterDepartment === 'All' || entry.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const period = getPeriodDates();

  // Add a function to handle Excel export
  const handleExportToExcel = () => {
    if (payrollEntries.length === 0) {
      alert('No payroll data to export');
      return;
    }
    
    exportToExcel(formatPayrollForExport(payrollEntries), 'Bizznex_Payroll', 'Payroll');
  };

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage your employee payroll and time tracking</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/payroll/process" 
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" /> Process Payroll
          </Link>
          <button className="btn-outline flex items-center" onClick={handleExportToExcel}>
            <FaFileExport className="mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Period selection and filters */}
      <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Period</label>
            <div className="relative">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button 
                  onClick={() => setSelectedPeriod('previous')}
                  className={`px-4 py-2 text-sm ${selectedPeriod === 'previous' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setSelectedPeriod('current')}
                  className={`px-4 py-2 text-sm ${selectedPeriod === 'current' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-50'}`}
                >
                  Current
                </button>
                <button 
                  onClick={() => setSelectedPeriod('next')}
                  className={`px-4 py-2 text-sm ${selectedPeriod === 'next' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <FaCalendarAlt className="mr-2 text-gray-400" />
                <span>{getSelectedPeriodName()}: {period.start} - {period.end}</span>
              </div>
            </div>
          </div>

          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              className="form-select block w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select 
              className="form-select block w-full"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="Landscape">Landscape</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Administration">Administration</option>
            </select>
          </div>

          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="form-input block w-full pl-10"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Regular Hours</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Overtime Hours</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Payroll</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">$0.00</p>
        </div>
      </div>

      {/* Payroll entries table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Employee Payroll</h2>
          <div className="flex space-x-2">
            <button className="text-gray-400 hover:text-gray-500 p-2">
              <FaPrint className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-500 p-2">
              <FaCog className="h-5 w-5" />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm transition ease-in-out duration-150">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading payroll data...
            </div>
          </div>
        ) : filteredPayrollEntries.length === 0 ? (
          <div className="p-8 text-center">
            <FaUserClock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No payroll entries</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no payroll entries for this period. Start by processing payroll for your employees.
            </p>
            <Link 
              href="/payroll/process" 
              className="btn-primary inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Process Payroll
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regular Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overtime Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hourly Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayrollEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.employeeName}
                      <div className="text-xs text-gray-500">{entry.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {entry.regularHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {entry.overtimeHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(entry.hourlyRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(entry.overtimeRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${entry.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                          entry.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/payroll/entry/${entry.id}`} className="text-green-600 hover:text-green-900 mr-3">
                        View
                      </Link>
                      <Link href={`/payroll/edit/${entry.id}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 