import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaSearch, FaFilter, FaUser, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Residential' | 'Commercial' | 'Municipal';
  active_jobs: number;
  total_spent: number;
  last_service?: string;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Fetch clients data
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        const result = await response.json();
        
        if (result.success) {
          setClients(result.data);
        } else {
          setError(result.message || 'Failed to fetch clients');
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClients();
  }, []);
  
  // Filter clients based on search query and type
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'All' || client.type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Sort clients by name
  const sortedClients = [...filteredClients].sort((a, b) => 
    a.name.localeCompare(b.name)
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
    if (!dateStr) return 'Never';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };
  
  // Client type options
  const clientTypes = ['All', 'Residential', 'Commercial', 'Municipal'];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="text-gray-500">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/clients/new" className="btn-primary flex items-center">
          <FaPlus className="mr-2" />
          Add Client
        </Link>
      </div>
      
      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {clientTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      {/* Clients List */}
      {sortedClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClients.map(client => (
            <div 
              key={client.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedClient(client)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <FaUser className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                    <span className="text-sm text-gray-500">{client.type}</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FaPhoneAlt className="w-4 h-4 mr-2" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                    <span>{client.address}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Active Jobs</p>
                    <p className="font-medium text-gray-900">{client.active_jobs}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="font-medium text-gray-900">{formatCurrency(client.total_spent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Service</p>
                    <p className="font-medium text-gray-900">{formatDate(client.last_service || '')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <Link 
                  href={`/jobs?client=${client.id}`}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Jobs
                </Link>
                <Link 
                  href={`/clients/${client.id}`}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedType !== 'All' ? 
              'Try adjusting your search or filter' : 
              'Get started by adding a new client'}
          </p>
          {!searchQuery && selectedType === 'All' && (
            <div className="mt-6">
              <Link href="/clients/new" className="btn-primary">
                <FaPlus className="mr-2" />
                Add Client
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedClient.name}</h2>
                  <p className="text-gray-500">{selectedClient.type}</p>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaPhoneAlt className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <FaEnvelope className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Account Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Jobs</span>
                      <span className="font-medium">{selectedClient.active_jobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-medium">{formatCurrency(selectedClient.total_spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Service</span>
                      <span className="font-medium">{formatDate(selectedClient.last_service || '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client Since</span>
                      <span className="font-medium">{formatDate(selectedClient.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Link 
                    href={`/jobs/new?client=${selectedClient.id}`}
                    className="btn-primary flex-1 text-center"
                  >
                    Schedule Job
                  </Link>
                  <Link 
                    href={`/clients/${selectedClient.id}/edit`}
                    className="btn-outline flex-1 text-center"
                  >
                    Edit Client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 