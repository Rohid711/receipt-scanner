import React, { useState, useEffect } from 'react';
import { 
  FaCheck, FaTrash, FaClock, FaUserClock, FaCalendarAlt, 
  FaMoneyBill, FaUserEdit, FaUndo, FaPlus, FaTimes, FaPrint 
} from 'react-icons/fa';

// Define types
interface Employee {
  id: string;
  name: string;
  position: string;
  hourlyRate: number;
  department: string;
  email: string;
}

interface PayrollEntry {
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  adjustments: number;
  adjustmentNotes: string;
  totalPay: number;
}

export default function ProcessPayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<Record<string, PayrollEntry>>({});
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showCheckPreview, setShowCheckPreview] = useState<boolean>(false);

  // Fetch employees from the API
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/employees');
        const result = await response.json();
        
        if (result.success) {
          // Map the API response to our Employee interface
          const mappedEmployees = result.data.map((emp: any) => ({
            id: emp.id || emp._id,
            name: emp.name,
            position: emp.position,
            hourlyRate: emp.hourlySalary || 0, // Use hourlySalary field from JSON DB
            department: emp.department || 'Unassigned',
            email: emp.email || ''
          }));
          
          setEmployees(mappedEmployees);
          console.log('Loaded employees:', mappedEmployees);
        } else {
          setError(result.message || 'Failed to fetch employees');
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  // Get today's date in YYYY-MM-DD format
  const getDefaultDate = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Initialize period dates
  useEffect(() => {
    // Set default period to current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday)
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
    
    setPeriodStart(startDate.toISOString().split('T')[0]);
    setPeriodEnd(endDate.toISOString().split('T')[0]);
  }, []);

  const handleEmployeeSelection = (employeeId: string) => {
    if (selectedEmployeeIds.includes(employeeId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== employeeId));
      
      // Remove from payroll entries
      const newEntries = { ...payrollEntries };
      delete newEntries[employeeId];
      setPayrollEntries(newEntries);
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, employeeId]);
      
      // Initialize entry
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        setPayrollEntries({
          ...payrollEntries,
          [employeeId]: {
            employeeId,
            regularHours: 40, // Default to 40 hours
            overtimeHours: 0,
            adjustments: 0,
            adjustmentNotes: '',
            totalPay: 40 * employee.hourlyRate
          }
        });
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployeeIds.length === employees.length) {
      // Deselect all
      setSelectedEmployeeIds([]);
      setPayrollEntries({});
    } else {
      // Select all
      const allIds = employees.map(emp => emp.id);
      setSelectedEmployeeIds(allIds);
      
      // Initialize entries for all
      const newEntries: Record<string, PayrollEntry> = {};
      employees.forEach(emp => {
        newEntries[emp.id] = {
          employeeId: emp.id,
          regularHours: 40, // Default to 40 hours
          overtimeHours: 0,
          adjustments: 0,
          adjustmentNotes: '',
          totalPay: 40 * emp.hourlyRate
        };
      });
      setPayrollEntries(newEntries);
    }
  };

  const handleEntryChange = (employeeId: string, field: keyof PayrollEntry, value: number | string) => {
    const entry = payrollEntries[employeeId];
    if (!entry) return;

    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const updatedEntry = { ...entry, [field]: value };
    
    // Calculate total pay
    if (field === 'regularHours' || field === 'overtimeHours' || field === 'adjustments') {
      const regularPay = updatedEntry.regularHours * employee.hourlyRate;
      const overtimePay = updatedEntry.overtimeHours * employee.hourlyRate * 1.5;
      updatedEntry.totalPay = regularPay + overtimePay + (typeof updatedEntry.adjustments === 'number' ? updatedEntry.adjustments : 0);
    }
    
    setPayrollEntries({
      ...payrollEntries,
      [employeeId]: updatedEntry
    });
  };

  const getTotalPayroll = (): number => {
    return Object.values(payrollEntries).reduce((sum, entry) => sum + entry.totalPay, 0);
  };

  const handleSavePayroll = async () => {
    if (!periodStart || !periodEnd) {
      alert('Please select a valid pay period');
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setLoading(true);
    
    try {
      // Convert the payroll entries to the format expected by the API
      const payrollData = {
        periodStart,
        periodEnd,
        entries: Object.values(payrollEntries).map(entry => {
          const employee = employees.find(emp => emp.id === entry.employeeId);
          return {
            employeeId: entry.employeeId,
            employeeName: employee?.name || 'Unknown Employee',
            department: employee?.department || 'Unassigned',
            regularHours: entry.regularHours,
            overtimeHours: entry.overtimeHours,
            hourlyRate: employee?.hourlyRate || 0,
            overtimeRate: (employee?.hourlyRate || 0) * 1.5,
            adjustments: entry.adjustments,
            adjustmentNotes: entry.adjustmentNotes,
            totalPay: entry.totalPay,
            status: 'Draft'
          };
        }),
        notes,
        createdAt: new Date().toISOString(),
        status: 'Draft'
      };

      // Send the data to the backend
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payrollData),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Payroll processed successfully!');
        // Optionally redirect to the payroll list page
        window.location.href = '/payroll';
      } else {
        alert(`Error: ${result.message || 'Failed to process payroll'}`);
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('An error occurred while processing payroll');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePreviewChecks = () => {
    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee');
      return;
    }
    
    if (!periodStart || !periodEnd) {
      alert('Please select a valid pay period');
      return;
    }
    
    setShowCheckPreview(true);
  };

  const closeCheckPreview = () => {
    setShowCheckPreview(false);
  };

  const handlePrintChecks = () => {
    // Open a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print checks');
      return;
    }
    
    // Generate the content for each check
    const checksContent = selectedEmployeeIds.map((employeeId) => {
      const employee = employees.find(emp => emp.id === employeeId);
      const entry = payrollEntries[employeeId];
      
      if (!employee || !entry) return '';
      
      const regularPay = entry.regularHours * employee.hourlyRate;
      const overtimePay = entry.overtimeHours * employee.hourlyRate * 1.5;
      const totalAdjustments = entry.adjustments;
      
      return `
        <div style="page-break-after: always; padding: 20px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px;">Bizznex Landscaping</h2>
            <p style="margin: 5px 0;">123 Business St, Suite 100</p>
            <p style="margin: 5px 0;">Business City, BC 12345</p>
          </div>
          
          <div style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 15px 0; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600;">Pay to the order of:</span>
              <span style="font-weight: 700;">${employee.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600;">Check Date:</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600;">Pay Period:</span>
              <span>${periodStart} to ${periodEnd}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">Check Amount:</span>
              <span style="font-size: 20px; font-weight: 700; color: #15803d;">${formatCurrency(entry.totalPay)}</span>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="text-align: left; padding: 8px;">Description</th>
                <th style="text-align: right; padding: 8px;">Hours</th>
                <th style="text-align: right; padding: 8px;">Rate</th>
                <th style="text-align: right; padding: 8px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">Regular Hours</td>
                <td style="text-align: right; padding: 8px;">${entry.regularHours}</td>
                <td style="text-align: right; padding: 8px;">${formatCurrency(employee.hourlyRate)}/hr</td>
                <td style="text-align: right; padding: 8px;">${formatCurrency(regularPay)}</td>
              </tr>
              ${entry.overtimeHours > 0 ? `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">Overtime Hours</td>
                  <td style="text-align: right; padding: 8px;">${entry.overtimeHours}</td>
                  <td style="text-align: right; padding: 8px;">${formatCurrency(employee.hourlyRate * 1.5)}/hr</td>
                  <td style="text-align: right; padding: 8px;">${formatCurrency(overtimePay)}</td>
                </tr>
              ` : ''}
              ${entry.adjustments !== 0 ? `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">
                    Adjustments
                    ${entry.adjustmentNotes ? `
                      <span style="display: block; font-size: 12px; color: #666;">
                        Note: ${entry.adjustmentNotes}
                      </span>
                    ` : ''}
                  </td>
                  <td style="text-align: right; padding: 8px;">-</td>
                  <td style="text-align: right; padding: 8px;">-</td>
                  <td style="text-align: right; padding: 8px;">${formatCurrency(totalAdjustments)}</td>
                </tr>
              ` : ''}
              <tr style="font-weight: 700;">
                <td style="padding: 8px;" colspan="3">Total</td>
                <td style="text-align: right; padding: 8px;">${formatCurrency(entry.totalPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }).join('');
    
    // Write content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payroll Checks - ${periodStart} to ${periodEnd}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${checksContent}
          <script>
            // Automatically trigger print once loaded
            window.onload = function() {
              window.print();
              // Optional: Close the window after printing
              // window.close();
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleReset = () => {
    if (selectedEmployeeIds.length > 0) {
      if (confirm('Are you sure you want to reset? This will clear all selected employees and entries.')) {
        setSelectedEmployeeIds([]);
        setPayrollEntries({});
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Check Preview Modal */}
      {showCheckPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Check Previews</h3>
              <button 
                onClick={closeCheckPreview}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedEmployeeIds.map((employeeId) => {
                const employee = employees.find(emp => emp.id === employeeId);
                const entry = payrollEntries[employeeId];
                
                if (!employee || !entry) return null;
                
                const regularPay = entry.regularHours * employee.hourlyRate;
                const overtimePay = entry.overtimeHours * employee.hourlyRate * 1.5;
                const totalAdjustments = entry.adjustments;
                
                return (
                  <div key={employeeId} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                    <div className="text-center mb-4">
                      <h4 className="text-xl font-semibold text-gray-900">Bizznex Landscaping</h4>
                      <p className="text-gray-600">123 Business St, Suite 100</p>
                      <p className="text-gray-600">Business City, BC 12345</p>
                    </div>
                    
                    <div className="border-t border-b border-gray-300 py-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Pay to the order of:</span>
                        <span className="font-semibold">{employee.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Check Date:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Pay Period:</span>
                        <span>{periodStart} to {periodEnd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Check Amount:</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(entry.totalPay)}</span>
                      </div>
                    </div>
                    
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="py-2 text-left">Description</th>
                          <th className="py-2 text-right">Hours</th>
                          <th className="py-2 text-right">Rate</th>
                          <th className="py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-2">Regular Hours</td>
                          <td className="py-2 text-right">{entry.regularHours}</td>
                          <td className="py-2 text-right">{formatCurrency(employee.hourlyRate)}/hr</td>
                          <td className="py-2 text-right">{formatCurrency(regularPay)}</td>
                        </tr>
                        {entry.overtimeHours > 0 && (
                          <tr className="border-b border-gray-200">
                            <td className="py-2">Overtime Hours</td>
                            <td className="py-2 text-right">{entry.overtimeHours}</td>
                            <td className="py-2 text-right">{formatCurrency(employee.hourlyRate * 1.5)}/hr</td>
                            <td className="py-2 text-right">{formatCurrency(overtimePay)}</td>
                          </tr>
                        )}
                        {entry.adjustments !== 0 && (
                          <tr className="border-b border-gray-200">
                            <td className="py-2">
                              Adjustments
                              {entry.adjustmentNotes && (
                                <span className="text-sm text-gray-500 block">
                                  Note: {entry.adjustmentNotes}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right">-</td>
                            <td className="py-2 text-right">-</td>
                            <td className="py-2 text-right">{formatCurrency(totalAdjustments)}</td>
                          </tr>
                        )}
                        <tr className="font-bold">
                          <td className="py-2" colSpan={3}>Total</td>
                          <td className="py-2 text-right">{formatCurrency(entry.totalPay)}</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="mt-4 pt-4 border-t border-gray-300 text-sm text-gray-600">
                      <p>This is a preview only. Actual pay stub may differ.</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button 
                onClick={closeCheckPreview}
                className="btn-outline mr-3"
              >
                Close
              </button>
              <button 
                className="btn-primary flex items-center"
                onClick={handlePrintChecks}
              >
                <FaPrint className="mr-2" /> Print Checks
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FaUserClock className="mr-2 text-green-600" /> 
              Process Payroll
            </h1>
            <p className="text-gray-500">Create and review employee payroll entries</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleSavePayroll}
              className="btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" /> 
                  Process Payroll
                </>
              )}
            </button>
            <button 
              className="btn-outline flex items-center"
              disabled={loading}
              onClick={handleReset}
            >
              <FaUndo className="mr-2" /> 
              Reset
            </button>
          </div>
        </div>

        {/* Pay Period Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pay Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  className="form-input pl-10"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  className="form-input pl-10"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Select Employees</h2>
            <button 
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-500 mb-2"></div>
              <p className="text-gray-500">Loading employees...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-500"
              >
                Retry
              </button>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center">
              <FaUserClock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No employees found</p>
              <p className="text-gray-400 mb-4">Add employees to process payroll</p>
              <a href="/employees/new" className="btn-primary inline-flex items-center">
                <FaPlus className="mr-2" /> Add Employee
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr 
                      key={employee.id} 
                      className={`hover:bg-gray-50 ${selectedEmployeeIds.includes(employee.id) ? 'bg-green-50' : ''}`}
                      onClick={() => handleEmployeeSelection(employee.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onChange={() => handleEmployeeSelection(employee.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(employee.hourlyRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payroll Entries */}
        {selectedEmployeeIds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Payroll Entries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Regular Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overtime Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adjustments
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedEmployeeIds.map((employeeId) => {
                    const employee = employees.find(emp => emp.id === employeeId);
                    const entry = payrollEntries[employeeId];
                    
                    if (!employee || !entry) return null;
                    
                    return (
                      <tr key={employeeId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {employee.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            className="form-input w-24"
                            value={entry.regularHours}
                            onChange={(e) => handleEntryChange(
                              employeeId, 
                              'regularHours', 
                              parseFloat(e.target.value) || 0
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            className="form-input w-24"
                            value={entry.overtimeHours}
                            onChange={(e) => handleEntryChange(
                              employeeId, 
                              'overtimeHours', 
                              parseFloat(e.target.value) || 0
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            className="form-input w-24"
                            value={entry.adjustments}
                            onChange={(e) => handleEntryChange(
                              employeeId, 
                              'adjustments', 
                              parseFloat(e.target.value) || 0
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className="form-input w-48"
                            value={entry.adjustmentNotes}
                            placeholder="Adjustment reason..."
                            onChange={(e) => handleEntryChange(
                              employeeId, 
                              'adjustmentNotes', 
                              e.target.value
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(entry.totalPay)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Total Payroll:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(getTotalPayroll())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            className="form-textarea w-full"
            rows={4}
            placeholder="Enter any additional notes about this payroll period..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        {/* Summary and Actions */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 md:w-1/3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Pay Period:</span>
                <span className="font-medium">
                  {periodStart && periodEnd ? `${periodStart} to ${periodEnd}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Employees:</span>
                <span className="font-medium">{selectedEmployeeIds.length}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-800 font-medium">Total Payroll:</span>
                <span className="text-green-600 font-bold">{formatCurrency(getTotalPayroll())}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 md:w-2/3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleSavePayroll}
                className="btn-primary flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" /> 
                    Process Payroll
                  </>
                )}
              </button>
              <button 
                className="btn-outline flex items-center" 
                disabled={loading}
                onClick={handlePreviewChecks}
              >
                <FaMoneyBill className="mr-2" /> 
                Preview Checks
              </button>
              <button 
                className="btn-outline flex items-center" 
                disabled={loading}
                onClick={handleReset}
              >
                <FaTrash className="mr-2" /> 
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 