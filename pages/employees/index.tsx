import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaSort, FaUserEdit, FaTrash, FaEye, FaCalendarCheck, FaIdCard, FaFileAlt, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { exportToExcel, formatEmployeesForExport } from '../../utils/excelExport';

// Define the Employee interface
interface Employee {
  _id?: string;
  id?: number;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  startDate: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  hourlySalary: number;
  skillTags: string[];
  avatarUrl?: string;
}

export default function EmployeesPage() {
  // State for managing employees and filters
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees data
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/employees');
        const result = await response.json();
        
        if (result.success) {
          setEmployees(result.data);
        } else {
          setError(result.message || 'Failed to fetch employees');
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Error connecting to the server');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEmployees();
  }, []);

  // Get unique departments for filter dropdown
  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

  // Filter employees based on search term and filters
  const filteredEmployees = employees.filter(employee => {
    // Apply search filter
    if (searchTerm && !employee.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !employee.position.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !employee.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply department filter
    if (departmentFilter !== 'All' && employee.department !== departmentFilter) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'All' && employee.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Add a function to handle Excel export
  const handleExportToExcel = () => {
    if (employees.length === 0) {
      alert('No employees to export');
      return;
    }
    
    const formattedData = formatEmployeesForExport(employees);
    exportToExcel(formattedData, 'Bizznex_Employees', 'Employees');
  };

  // Handle deleting an employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const response = await fetch(`/api/employees?id=${employeeId}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Remove from state
          setEmployees(employees.filter(emp => emp._id !== employeeId));
          alert('Employee deleted successfully');
        } else {
          alert(result.message || 'Failed to delete employee');
        }
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Error connecting to the server');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">Employees</h1>
          <p className="text-gray-600 text-lg">Manage and track your team members</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn-outline flex items-center" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="w-4 h-4 mr-2" /> 
            Filters
          </button>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search employees..." 
              className="input pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button 
            className="btn-outline flex items-center"
            onClick={handleExportToExcel}
          >
            <FaFileAlt className="w-4 h-4 mr-2" /> 
            Export
          </button>
          <Link href="/employees/new" className="btn-primary flex items-center">
            <FaPlus className="w-4 h-4 mr-2" /> 
            Add Employee
          </Link>
        </div>
      </div>
      
      {showFilters && (
        <div className="card p-6">
          <div className="flex flex-wrap gap-6">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select 
                className="input py-2.5" 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                className="input py-2.5"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="section-title">Team Members</h2>
        
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-green-500 mb-3"></div>
            <p className="text-gray-500 text-lg">Loading employees...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p className="text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 btn-outline border-red-300 text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 text-center">
            <FaIdCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-xl mb-2">No employees found</p>
            {searchTerm || departmentFilter !== 'All' || statusFilter !== 'All' ? (
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            ) : (
              <p className="text-gray-400 mb-6">Add your first employee to get started</p>
            )}
            <Link href="/employees/new" className="btn-primary inline-flex items-center">
              <FaPlus className="w-4 h-4 mr-2" /> 
              Add Your First Employee
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header">
                      <div className="flex items-center cursor-pointer">
                        EMPLOYEE
                        <FaSort className="ml-1 h-3 w-3 text-blue-300" />
                      </div>
                    </th>
                    <th className="table-header">POSITION</th>
                    <th className="table-header">DEPARTMENT</th>
                    <th className="table-header">
                      <div className="flex items-center cursor-pointer">
                        RATE
                        <FaSort className="ml-1 h-3 w-3 text-blue-300" />
                      </div>
                    </th>
                    <th className="table-header">STATUS</th>
                    <th className="table-header">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee, index) => (
                    <tr key={employee._id || index} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="table-cell text-blue-700 font-medium">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`} 
                              alt={employee.name} 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-blue-700">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">{employee.position}</td>
                      <td className="table-cell">{employee.department}</td>
                      <td className="table-cell text-blue-700 font-medium">
                        {formatCurrency(employee.hourlySalary)}/hr
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          employee.status === 'Active' ? 'badge-success' :
                          employee.status === 'On Leave' ? 'badge-pending' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button 
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                            onClick={() => setSelectedEmployee(employee)}
                            title="View Employee"
                          >
                            <FaEye />
                          </button>
                          <Link 
                            href={`/employees/${employee._id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full"
                            title="Edit Employee"
                          >
                            <FaUserEdit />
                          </Link>
                          <Link 
                            href={`/employees/${employee._id}/schedule`}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full"
                            title="Employee Schedule"
                          >
                            <FaCalendarCheck />
                          </Link>
                          <button 
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                            onClick={() => employee._id && handleDeleteEmployee(employee._id)}
                            title="Delete Employee"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">{selectedEmployee.name}</h3>
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-shrink-0">
                  <img 
                    className="h-24 w-24 rounded-full object-cover border-4 border-blue-100" 
                    src={selectedEmployee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee.name)}&size=96&background=random`} 
                    alt={selectedEmployee.name} 
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                  <p className="text-blue-600 font-medium">{selectedEmployee.position}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`badge ${
                      selectedEmployee.status === 'Active' ? 'badge-success' :
                      selectedEmployee.status === 'On Leave' ? 'badge-pending' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedEmployee.status}
                    </span>
                    <span className="badge badge-secondary">{selectedEmployee.department}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p className="text-gray-900">{selectedEmployee.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                  <p className="text-gray-900">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Start Date</h4>
                  <p className="text-gray-900">{new Date(selectedEmployee.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Hourly Rate</h4>
                  <p className="text-gray-900">{formatCurrency(selectedEmployee.hourlySalary)}/hour</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.skillTags && selectedEmployee.skillTags.length > 0 ? (
                    selectedEmployee.skillTags.map((skill, index) => (
                      <span key={index} className="badge bg-blue-50 text-blue-700">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No skills listed</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="btn-outline"
              >
                Close
              </button>
              <Link 
                href={`/employees/${selectedEmployee._id}/edit`}
                className="btn-primary"
              >
                Edit Employee
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 