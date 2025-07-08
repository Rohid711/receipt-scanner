import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaTrash,
  FaArrowLeft,
  FaPlus
} from 'react-icons/fa';

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
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ClientDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/clients?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
          setClient(result.data);
        } else {
          setError(result.message || 'Failed to fetch client details');
        }
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClient();
  }, [id]);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'Never';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };
  
  // Handle client deletion
  const handleDelete = async () => {
    if (!client) return;
    
    try {
      const response = await fetch(`/api/clients?id=${client.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        router.push('/clients');
      } else {
        setError(result.message || 'Failed to delete client');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Error connecting to the server');
    }
  };
  
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
        <Link href="/clients" className="btn-primary">
          Back to Clients
        </Link>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Client not found</p>
        <Link href="/clients" className="btn-primary">
          Back to Clients
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Link href="/clients" className="text-gray-500 hover:text-gray-700">
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Client Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/jobs/new?client=${client.id}`}
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            New Job
          </Link>
          <Link 
            href={`/clients/${client.id}/edit`}
            className="btn-secondary flex items-center"
          >
            <FaEdit className="mr-2" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger flex items-center"
          >
            <FaTrash className="mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Client Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              <FaUser className="w-8 h-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-semibold text-gray-900">{client.name}</h2>
              <p className="text-gray-500">{client.type}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <FaPhone className="w-5 h-5 mr-3" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaEnvelope className="w-5 h-5 mr-3" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="w-5 h-5 mr-3" />
                  <span>{client.address}</span>
                </div>
              </div>
            </div>
            
            {/* Account Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Account Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Jobs</span>
                  <span className="font-medium">{client.active_jobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="font-medium">{formatCurrency(client.total_spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Service</span>
                  <span className="font-medium">{formatDate(client.last_service || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client Since</span>
                  <span className="font-medium">{formatDate(client.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {client.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Client</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {client.name}? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 