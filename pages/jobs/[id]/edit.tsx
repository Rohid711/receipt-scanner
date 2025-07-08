import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaUser, 
  FaCalendar, 
  FaClock, 
  FaMapMarkerAlt, 
  FaCheck, 
  FaTimes, 
  FaDollarSign 
} from 'react-icons/fa';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  type?: 'Residential' | 'Commercial' | 'Municipal';
  active_jobs?: number;
  total_spent?: number;
  last_service?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface CrewMember {
  id: number;
  name: string;
}

export default function EditJobPage() {
  const router = useRouter();
  const { id } = router.query;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [recurringType, setRecurringType] = useState<string>('none');
  const [recurringDay, setRecurringDay] = useState<string>('1');

  // Fetch job data
  useEffect(() => {
    if (id) {
      const fetchJobData = async () => {
        try {
          const response = await fetch(`/api/jobs?id=${id}`);
          const result = await response.json();

          if (result.success) {
            const job = result.data;
            setClientId(job.client_id.toString());
            setService(job.service);
            setDate(job.date.split('T')[0]); // Format date for input
            setTimeSlot(job.time_slot || '');
            setDescription(job.description || '');
            setTotalAmount(job.total_amount ? job.total_amount.toString() : '');
            setStatus(job.status);
            setRecurringType(job.recurring_type || 'none');
            setRecurringDay(job.recurring_day ? job.recurring_day.toString() : '1');
          } else {
            setServerError(result.message || 'Failed to fetch job data');
          }
        } catch (err) {
          console.error('Error fetching job:', err);
          setServerError('Error connecting to the server');
        }
      };

      fetchJobData();
    }
  }, [id]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const result = await response.json();

        if (result.success) {
          setClients(result.data);
        } else {
          setServerError(result.message || 'Failed to fetch clients');
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };

    fetchClients();
  }, []);

  // Update address when client changes
  useEffect(() => {
    if (clientId) {
      const selectedClient = clients.find(c => c.id.toString() === clientId);
      if (selectedClient) {
        setAddress(selectedClient.address || '');
      }
    }
  }, [clientId, clients]);

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })
      .format(numAmount)
      .replace(/^\$/, ''); // Remove dollar sign
  };

  const validateForm = () => {
    if (!clientId) {
      setServerError('Please select a client');
      return false;
    }
    
    if (!service) {
      setServerError('Please select a service');
      return false;
    }
    
    if (!date) {
      setServerError('Please select a date');
      return false;
    }
    
    if (!timeSlot) {
      setServerError('Please select a time slot');
      return false;
    }
    
    if (totalAmount && isNaN(parseFloat(totalAmount))) {
      setServerError('Please enter a valid amount');
      return false;
    }

    if (recurringType === 'monthly' && (!recurringDay || isNaN(parseInt(recurringDay)))) {
      setServerError('Please enter a valid day of month for recurring jobs');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);

      // Prepare job date with the correct timezone
      const jobDate = new Date(date);
      
      // Create description with time slot
      const fullDescription = `Time: ${timeSlot}\\n\\n${description}`;
      
      const jobData = {
        client_id: parseInt(clientId),
        service,
        status: status,
        date: jobDate.toISOString(),
        description: fullDescription,
        total_amount: parseFloat(totalAmount),
        recurring_type: recurringType,
        recurring_day: recurringType === 'monthly' ? parseInt(recurringDay) : null
      };

      console.log('Submitting job data:', jobData);

      const response = await fetch(`/api/jobs?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (result.success) {
        router.push('/jobs');
      } else {
        setServerError(result.message || 'Failed to update job');
      }
    } catch (err) {
      console.error('Error updating job:', err);
      setServerError('Error connecting to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/jobs" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
        </div>
      </div>
      
      {serverError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimes className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-red-700">{serverError}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 space-y-6">
            {/* Client and Service Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCheck className="text-gray-400" />
                  </div>
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    required
                  >
                    <option value="">Select a service</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Installation">Installation</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Repair">Repair</option>
                    <option value="Design">Design</option>
                    <option value="Training">Training</option>
                    <option value="Support">Support</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Custom Project">Custom Project</option>
                    <option value="Emergency Service">Emergency Service</option>
                    <option value="Regular Service">Regular Service</option>
                    <option value="Assessment">Assessment</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaClock className="text-gray-400" />
                  </div>
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    required
                  >
                    <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</option>
                    <option value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                    <option value="1:00 PM - 3:00 PM">1:00 PM - 3:00 PM</option>
                    <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                    <option value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</option>
                    <option value="8:00 AM - 4:00 PM (Full Day)">8:00 AM - 4:00 PM (Full Day)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCheck className="text-gray-400" />
                  </div>
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaDollarSign className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Type</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={recurringType}
                  onChange={(e) => setRecurringType(e.target.value)}
                >
                  <option value="none">None (One time job)</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {recurringType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={recurringDay}
                    onChange={(e) => setRecurringDay(e.target.value)}
                    min="1"
                    max="31"
                    placeholder="Day of month (1-31)"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-100"
                    value={address}
                    readOnly
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Address is automatically pulled from client data</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Add any special instructions or notes here..."
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4">
            <Link href="/jobs" className="btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 