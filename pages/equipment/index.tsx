import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaSearch, FaFilter, FaDownload, FaTractor, FaTimes, FaTools, FaExclamationTriangle, FaSortAlphaDown, FaFileAlt, FaBuilding } from 'react-icons/fa';
import { exportToExcel, formatEquipmentForExport } from '../../utils/excelExport';

// Define Equipment interface
interface Equipment {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
  lastServicedDate?: string;
  lastServiced?: string;
  condition: string;
  nextServiceDue: string;
  location: string;
  assignedTo: string | null;
}

// Equipment status options
const statusOptions = [
  'All',
  'Available',
  'In Use',
  'In Repair',
  'Retired'
];

// Equipment types for business
const equipmentTypes = [
  'All',
  'Office Equipment',
  'Electronics',
  'Machinery',
  'Tools',
  'Vehicles',
  'Furniture',
  'Storage',
  'Safety Equipment',
  'Communication Devices',
  'Specialized Equipment',
  'Other'
];

export default function EquipmentPage() {
  // State for equipment data
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch equipment data from API
  useEffect(() => {
    async function fetchEquipment() {
      try {
        setLoading(true);
        const response = await fetch('/api/equipment');
        const result = await response.json();
        
        if (result.success) {
          setEquipment(result.data);
        } else {
          setError(result.message || 'Failed to fetch equipment');
        }
      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEquipment();
  }, []);

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateEquipmentAge = (purchaseDate: string): string => {
    const purchaseTime = new Date(purchaseDate).getTime();
    const now = new Date().getTime();
    const diffInMonths = Math.floor((now - purchaseTime) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffInMonths < 12) {
      return `${diffInMonths} mo${diffInMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;
      return `${years} yr${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} mo${months !== 1 ? 's' : ''}` : ''}`;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
  };

  // Filter equipment based on search term and filters
  const filteredEquipment = equipment.filter((item) => {
    // Check if item matches search term
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if item matches type filter
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    
    // Check if item matches status filter
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle Excel export
  const handleExportToExcel = () => {
    if (equipment.length === 0) {
      alert('No equipment to export');
      return;
    }
    
    // Convert equipment data to the expected format for export
    const formattedData = equipment.map(item => ({
      id: parseInt(item.id || ''),
      name: item.name,
      type: item.type,
      model: item.model,
      serialNumber: item.serialNumber,
      purchaseDate: item.purchaseDate,
      purchasePrice: String(item.purchasePrice),
      status: item.status,
      lastServiced: item.lastServiced,
      condition: item.condition,
      nextServiceDue: item.nextServiceDue,
      location: item.location
    }));
    
    exportToExcel(formattedData, 'Bizznex_Equipment', 'Equipment');
  };

  // Handle deleting equipment
  const handleDeleteEquipment = async (equipmentId: string) => {
    if (window.confirm('Are you sure you want to delete this equipment item?')) {
      try {
        const response = await fetch(`/api/equipment?id=${equipmentId}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Remove from state
          setEquipment(equipment.filter(item => item._id !== equipmentId));
          alert('Equipment deleted successfully');
        } else {
          alert(result.message || 'Failed to delete equipment');
        }
      } catch (err) {
        console.error('Error deleting equipment:', err);
        alert('Error connecting to the server');
      }
    }
  };

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">Track and manage your business equipment and maintenance schedules</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/equipment/new" 
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" /> Add Equipment
          </Link>
          <button className="btn-outline flex items-center" onClick={handleExportToExcel}>
            <FaFileAlt className="mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="md:w-72">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Equipment</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="form-input block w-full pl-10"
                placeholder="Search by name, model, serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="md:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
            <select 
              className="form-select block w-full"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {equipmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="md:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              className="form-select block w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex-shrink-0">
            <button 
              onClick={handleResetFilters} 
              className="btn-outline py-2 px-4 flex items-center"
            >
              <FaTimes className="mr-2" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Equipment table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Equipment Inventory</h2>
          <div className="flex space-x-3">
            <button className="text-gray-400 hover:text-gray-500 p-2">
              <FaFilter />
            </button>
            <button className="text-gray-400 hover:text-gray-500 p-2">
              <FaDownload />
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
              Loading equipment data...
            </div>
          </div>
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center">
            <FaBuilding className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No equipment added yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Start tracking your equipment by adding your first piece of equipment to the inventory.
            </p>
            <Link 
              href="/equipment/new" 
              className="btn-primary inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Add Equipment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            Model: {item.model} | SN: {item.serialNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${item.status === 'Available' ? 'bg-green-100 text-green-800' : 
                          item.status === 'In Use' ? 'bg-blue-100 text-blue-800' : 
                          item.status === 'In Repair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.nextServiceDue)}
                      {new Date(item.nextServiceDue) < new Date() ? (
                        <span className="ml-2 text-red-600">
                          <FaExclamationTriangle className="inline h-3 w-3" /> Overdue
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.purchasePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/equipment/${item.id}`} className="text-green-600 hover:text-green-900 mr-3">
                        View
                      </Link>
                      <Link href={`/equipment/edit/${item.id}`} className="text-blue-600 hover:text-blue-900">
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

      {/* Equipment stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Equipment</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Available Equipment</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Maintenance Due</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">$0.00</p>
        </div>
      </div>

      {/* Maintenance summary */}
      <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Maintenance</h2>
        <div className="text-center p-6">
          <FaTools className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No upcoming maintenance</h3>
          <p className="text-gray-500">
            You have no equipment that requires maintenance in the next 30 days.
          </p>
        </div>
      </div>
    </div>
  );
} 