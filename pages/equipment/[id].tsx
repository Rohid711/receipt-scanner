import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaArrowLeft, FaEdit, FaTrash, FaCheck, FaWrench, FaExclamationTriangle, 
         FaHistory, FaPlus, FaCalendarAlt, FaPrint, FaFileDownload } from 'react-icons/fa';

// Type definitions
interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  status: 'Available' | 'In Use' | 'In Repair' | 'Retired';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  assignedTo?: string;
  location: string;
  maintenanceHistory: MaintenanceRecord[];
  nextMaintenanceDate?: string;
  notes?: string;
  warrantyExpiration?: string;
  manufacturer?: string;
  supplier?: string;
  imageUrl?: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Routine' | 'Repair' | 'Inspection';
  description: string;
  cost: number;
  performedBy: string;
  notes?: string;
}

export default function EquipmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  // State
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedPerson, setAssignedPerson] = useState('');
  
  // Load equipment data
  useEffect(() => {
    if (!id) return;
    
    const fetchEquipmentDetails = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from an API with the ID
        // Simulating API response with mock data
        setTimeout(() => {
          // Mock data based on ID
          const mockEquipment: Equipment = {
            id: id as string,
            name: 'Commercial Lawn Mower',
            type: 'Mower',
            model: 'John Deere Z930M',
            serialNumber: 'JD9301234',
            purchaseDate: '2022-03-15',
            purchasePrice: 5299.99,
            status: 'Available',
            condition: 'Excellent',
            location: 'Main Warehouse',
            manufacturer: 'John Deere',
            supplier: 'Green Valley Equipment',
            warrantyExpiration: '2024-03-15',
            maintenanceHistory: [
              {
                id: 'mnt1',
                date: '2022-09-10',
                type: 'Routine',
                description: 'Oil change, blade sharpening',
                cost: 120,
                performedBy: 'Mike Johnson',
                notes: 'Equipment in good condition, blades were moderately worn'
              },
              {
                id: 'mnt2',
                date: '2022-06-15',
                type: 'Inspection',
                description: 'Regular inspection, air filter replacement',
                cost: 85,
                performedBy: 'Service Center',
                notes: 'All systems operating normally'
              }
            ],
            nextMaintenanceDate: '2023-03-10',
            notes: 'High-performance commercial mower, purchased for the main crew',
            imageUrl: 'https://placehold.co/600x400?text=Lawn+Mower'
          };
          
          setEquipment(mockEquipment);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching equipment details:', error);
        setLoading(false);
      }
    };
    
    fetchEquipmentDetails();
  }, [id]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Check if equipment needs maintenance soon (within 30 days)
  const needsMaintenance = (nextMaintenanceDate?: string) => {
    if (!nextMaintenanceDate) return false;
    
    const today = new Date();
    const maintenanceDate = new Date(nextMaintenanceDate);
    const diffTime = maintenanceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 30;
  };
  
  // Calculate age of equipment in years and months
  const calculateAge = (purchaseDate: string) => {
    const today = new Date();
    const purchase = new Date(purchaseDate);
    
    let years = today.getFullYear() - purchase.getFullYear();
    let months = today.getMonth() - purchase.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months };
  };
  
  // Calculate total maintenance cost
  const calculateTotalMaintenanceCost = (history: MaintenanceRecord[]) => {
    return history.reduce((total, record) => total + record.cost, 0);
  };
  
  // Handle equipment assignment
  const handleAssign = () => {
    if (!assignedPerson.trim()) return;
    
    // In a real app, you would make an API call to update the equipment
    setEquipment(prev => prev ? {
      ...prev,
      status: 'In Use',
      assignedTo: assignedPerson
    } : null);
    
    setShowAssignModal(false);
    setAssignedPerson('');
  };
  
  // Handle equipment return
  const handleReturn = () => {
    // In a real app, you would make an API call to update the equipment
    setEquipment(prev => prev ? {
      ...prev,
      status: 'Available',
      assignedTo: undefined
    } : null);
  };
  
  // Handle equipment service/repair status
  const handleServiceStatus = () => {
    // In a real app, you would make an API call to update the equipment
    setEquipment(prev => prev ? {
      ...prev,
      status: prev.status === 'In Repair' ? 'Available' : 'In Repair',
      location: prev.status === 'In Repair' ? 'Main Warehouse' : 'Service Center'
    } : null);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (!equipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Equipment not found.</p>
        <Link href="/equipment" className="btn-primary mt-4 inline-flex items-center gap-2">
          <FaArrowLeft /> Back to Equipment
        </Link>
      </div>
    );
  }
  
  const { years, months } = calculateAge(equipment.purchaseDate);
  const totalMaintenanceCost = calculateTotalMaintenanceCost(equipment.maintenanceHistory);
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/equipment" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{equipment.name}</h1>
            <p className="text-gray-600 mt-1">
              {equipment.model} • {equipment.type}
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button className="btn-outline flex items-center gap-2">
            <FaPrint /> Print
          </button>
          
          <Link href={`/equipment/edit/${equipment.id}`} className="btn-outline flex items-center gap-2">
            <FaEdit /> Edit
          </Link>
          
          <button className="btn-danger flex items-center gap-2">
            <FaTrash /> Delete
          </button>
        </div>
      </div>
      
      {/* Status indicators */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          equipment.status === 'Available' 
            ? 'bg-green-100 text-green-800' 
            : equipment.status === 'In Use' 
            ? 'bg-blue-100 text-blue-800'
            : equipment.status === 'In Repair'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {equipment.status}
        </span>
        
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          equipment.condition === 'Excellent' 
            ? 'bg-green-100 text-green-800' 
            : equipment.condition === 'Good' 
            ? 'bg-green-50 text-green-700'
            : equipment.condition === 'Fair'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {equipment.condition} Condition
        </span>
        
        {equipment.assignedTo && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
            Assigned to: {equipment.assignedTo}
          </span>
        )}
        
        {needsMaintenance(equipment.nextMaintenanceDate) && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FaExclamationTriangle className="mr-1" /> Maintenance Due Soon
          </span>
        )}
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Maintenance History
          </button>
          
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Usage Log
          </button>
          
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main info */}
            <div className="card p-6 lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Equipment Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Serial Number:</span>
                      <span className="text-gray-900 font-mono">{equipment.serialNumber}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Purchase Date:</span>
                      <span className="text-gray-900">{formatDate(equipment.purchaseDate)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age:</span>
                      <span className="text-gray-900">{years} years, {months} months</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Purchase Price:</span>
                      <span className="text-gray-900">{formatCurrency(equipment.purchasePrice)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Location:</span>
                      <span className="text-gray-900">{equipment.location}</span>
                    </div>
                    
                    {equipment.manufacturer && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Manufacturer:</span>
                        <span className="text-gray-900">{equipment.manufacturer}</span>
                      </div>
                    )}
                    
                    {equipment.supplier && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Supplier:</span>
                        <span className="text-gray-900">{equipment.supplier}</span>
                      </div>
                    )}
                    
                    {equipment.warrantyExpiration && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Warranty Until:</span>
                        <span className="text-gray-900">{formatDate(equipment.warrantyExpiration)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Maintenance Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Maintenance Cost:</span>
                      <span className="text-gray-900">{formatCurrency(totalMaintenanceCost)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Maintenance:</span>
                      <span className="text-gray-900">
                        {equipment.maintenanceHistory.length > 0 
                          ? formatDate(equipment.maintenanceHistory[0].date)
                          : 'None'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Scheduled:</span>
                      <span className={`${needsMaintenance(equipment.nextMaintenanceDate) ? 'text-yellow-600 font-medium' : 'text-gray-900'}`}>
                        {equipment.nextMaintenanceDate
                          ? formatDate(equipment.nextMaintenanceDate)
                          : 'None scheduled'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Maintenance Count:</span>
                      <span className="text-gray-900">{equipment.maintenanceHistory.length}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link href={`/equipment/maintenance/new/${equipment.id}`} className="btn-outline w-full flex items-center justify-center gap-2">
                      <FaWrench /> Schedule Maintenance
                    </Link>
                  </div>
                </div>
              </div>
              
              {equipment.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{equipment.notes}</p>
                </div>
              )}
              
              <div className="mt-6 flex flex-wrap gap-3">
                {equipment.status === 'Available' && (
                  <button 
                    onClick={() => setShowAssignModal(true)} 
                    className="btn-primary flex items-center gap-2"
                  >
                    <FaCheck /> Assign Equipment
                  </button>
                )}
                
                {equipment.status === 'In Use' && (
                  <button 
                    onClick={handleReturn} 
                    className="btn-primary flex items-center gap-2"
                  >
                    <FaCheck /> Return Equipment
                  </button>
                )}
                
                <button 
                  onClick={handleServiceStatus} 
                  className={`${equipment.status === 'In Repair' ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
                >
                  <FaWrench /> {equipment.status === 'In Repair' ? 'Mark as Repaired' : 'Send for Service'}
                </button>
              </div>
            </div>
            
            {/* Image and quick actions */}
            <div className="space-y-6">
              <div className="card p-6">
                {equipment.imageUrl ? (
                  <img 
                    src={equipment.imageUrl} 
                    alt={equipment.name} 
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md mb-4">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
                
                <Link href={`/equipment/upload-image/${equipment.id}`} className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
                  <FaPlus /> Upload Image
                </Link>
              </div>
              
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <Link href={`/equipment/maintenance/new/${equipment.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <FaCalendarAlt className="text-green-600" />
                    <span>Schedule Maintenance</span>
                  </Link>
                  
                  <Link href={`/equipment/edit/${equipment.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <FaEdit className="text-green-600" />
                    <span>Edit Equipment</span>
                  </Link>
                  
                  <button className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <FaFileDownload className="text-green-600" />
                    <span>Download Manual</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'maintenance' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Maintenance History</h3>
              
              <Link href={`/equipment/maintenance/new/${equipment.id}`} className="btn-primary flex items-center gap-2">
                <FaPlus /> Add Maintenance Record
              </Link>
            </div>
            
            {equipment.maintenanceHistory.length === 0 ? (
              <div className="text-center py-8">
                <FaHistory className="mx-auto text-gray-400 text-4xl mb-2" />
                <p className="text-gray-500">No maintenance records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="th-cell">Date</th>
                      <th className="th-cell">Type</th>
                      <th className="th-cell">Description</th>
                      <th className="th-cell">Performed By</th>
                      <th className="th-cell text-right">Cost</th>
                      <th className="th-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {equipment.maintenanceHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="td-cell font-medium">{formatDate(record.date)}</td>
                        <td className="td-cell">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.type === 'Routine' 
                              ? 'bg-blue-100 text-blue-800' 
                              : record.type === 'Repair' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="td-cell">{record.description}</td>
                        <td className="td-cell">{record.performedBy}</td>
                        <td className="td-cell text-right">{formatCurrency(record.cost)}</td>
                        <td className="td-cell text-right">
                          <Link href={`/equipment/maintenance/${record.id}`} className="text-green-600 hover:text-green-900">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="td-cell font-medium">Total</td>
                      <td className="td-cell text-right font-medium">{formatCurrency(totalMaintenanceCost)}</td>
                      <td className="td-cell"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'usage' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Usage Log</h3>
              
              <Link href={`/equipment/usage/new/${equipment.id}`} className="btn-primary flex items-center gap-2">
                <FaPlus /> Add Usage Record
              </Link>
            </div>
            
            <div className="text-center py-8">
              <FaHistory className="mx-auto text-gray-400 text-4xl mb-2" />
              <p className="text-gray-500">No usage records found.</p>
              <p className="text-gray-500 text-sm mt-2">Track when equipment is checked out and returned</p>
            </div>
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Documents</h3>
              
              <Link href={`/equipment/documents/upload/${equipment.id}`} className="btn-primary flex items-center gap-2">
                <FaPlus /> Upload Document
              </Link>
            </div>
            
            <div className="text-center py-8">
              <FaFileDownload className="mx-auto text-gray-400 text-4xl mb-2" />
              <p className="text-gray-500">No documents found.</p>
              <p className="text-gray-500 text-sm mt-2">Upload manuals, warranties, or other related documents</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Assign modal */}
      {showAssignModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Equipment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <input
                type="text"
                value={assignedPerson}
                onChange={(e) => setAssignedPerson(e.target.value)}
                className="input w-full"
                placeholder="Enter person or team name"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              
              <button
                onClick={handleAssign}
                className="btn-primary"
                disabled={!assignedPerson.trim()}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 