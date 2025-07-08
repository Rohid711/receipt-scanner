import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FaSave, 
  FaTimes, 
  FaCalendar, 
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaCheck,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaArrowLeft
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

export default function NewJobPage() {
  const router = useRouter();
  const { client: preselectedClientId } = router.query;
  
  const [clientId, setClientId] = useState<string>('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [recurringType, setRecurringType] = useState('none');
  const [recurringDay, setRecurringDay] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
  
  // Load clients when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Fetching clients...');
        const response = await fetch('/api/clients');
        const result = await response.json();
        
        if (result.success) {
          console.log('Clients loaded:', result.data);
          setClients(result.data);
        } else {
          console.error('Failed to fetch clients:', result.message);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);
  
  // Handle client selection
  useEffect(() => {
    if (clientId) {
      const selectedClient = clients.find(c => c.id.toString() === clientId.toString());
      if (selectedClient) {
        setAddress(selectedClient.address);
      }
    } else {
      setAddress('');
    }
  }, [clientId, clients]);
  
  // If clientId is passed in URL, pre-select it
  useEffect(() => {
    if (preselectedClientId) {
      const id = Array.isArray(preselectedClientId) 
        ? preselectedClientId[0] 
        : preselectedClientId;
      setClientId(id);
    }
  }, [preselectedClientId]);
  
  // Format currency for display
  const formatCurrency = (amount: number | string): string => {
    const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsed)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parsed);
  };
  
  // Add validation function
  const validateForm = () => {
    if (!clientId) {
      alert('Please select a client');
      return false;
    }
    
    if (!service) {
      alert('Please enter service description');
      return false;
    }
    
    if (!date) {
      alert('Please select a date');
      return false;
    }
    
    if (!timeSlot) {
      alert('Please select a time slot');
      return false;
    }
    
    if (!totalAmount) {
      alert('Please enter a total amount');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Format the date with time
      const timeComponents = timeSlot.split(' - ')[0].split(' ');
      const [hours, minutes] = timeComponents[0].split(':');
      const period = timeComponents[1];
      
      const jobDate = new Date(date);
      const hourNum = parseInt(hours);
      
      if (period === 'PM' && hourNum !== 12) {
        jobDate.setHours(hourNum + 12);
      } else {
        jobDate.setHours(hourNum);
      }
      jobDate.setMinutes(parseInt(minutes));

      // Combine notes and time slot in description
      const fullDescription = `Time: ${timeSlot}${notes ? `\n\nNotes: ${notes}` : ''}`;

      const jobData = {
        client_id: parseInt(clientId),
        service,
        status: 'Scheduled',
        date: jobDate.toISOString(),
        description: fullDescription,
        total_amount: parseFloat(totalAmount),
        recurring_type: recurringType,
        recurring_day: recurringType === 'monthly' ? parseInt(recurringDay) : null
      };

      console.log('Submitting job data:', jobData);

      const response = await fetch('/api/jobs', {
        method: 'POST',
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
        setServerError(result.message || 'Failed to create job');
      }
    } catch (err) {
      console.error('Error creating job:', err);
      setServerError('Error connecting to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNextOccurrence = (startDate: string, type: string, day: number) => {
    if (type === 'none') return null;
    
    const date = new Date(startDate);
    const today = new Date();
    
    switch (type) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        if (day) {
          date.setDate(day);
        }
        break;
    }
    
    // If the calculated date is in the past, keep adding intervals until it's in the future
    while (date < today) {
      switch (type) {
        case 'weekly':
          date.setDate(date.getDate() + 7);
          break;
        case 'biweekly':
          date.setDate(date.getDate() + 14);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + 1);
          break;
      }
    }
    
    return date.toISOString();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/jobs" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Schedule New Job</h1>
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
                <p className="mt-2 text-sm text-gray-500">
                  Can't find your client? <Link href="/clients/new" className="text-primary-600 hover:text-primary-800">Add a new client</Link>
                </p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <textarea
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter job location address"
                    required
                  ></textarea>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                {totalAmount && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(totalAmount)}
                  </p>
                )}
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
                placeholder="Add any additional notes or special instructions for this job"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurring Schedule</label>
              <div className="space-y-4">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={recurringType}
                  onChange={(e) => setRecurringType(e.target.value)}
                >
                  <option value="none">No Recurring Schedule</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                
                {recurringType === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={recurringDay}
                      onChange={(e) => setRecurringDay(e.target.value)}
                      required={recurringType === 'monthly'}
                    />
                  </div>
                )}
                
                {recurringType !== 'none' && (
                  <p className="text-sm text-gray-500">
                    This job will automatically be rescheduled {recurringType === 'weekly' ? 'every week' : recurringType === 'biweekly' ? 'every two weeks' : 'monthly'} after completion.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="sendConfirmationEmail"
                checked={sendConfirmationEmail}
                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sendConfirmationEmail" className="ml-2 text-sm text-gray-700">
                Send confirmation email to client
              </label>
            </div>
            
            <div className="flex justify-between items-center">
              <Link href="/jobs" className="btn-outline">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Create Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 