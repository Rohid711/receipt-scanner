import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaCalendar, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Job {
  id: string;
  clientId: number;
  clientName: string;
  address: string;
  service: string;
  date: string;
  scheduledDate?: string;
  timeSlot: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  notes?: string;
  totalAmount: number;
  crew?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { client: clientIdParam } = router.query;
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Fetch jobs data from API
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        
        // Construct URL with optional filters
        let url = '/api/jobs';
        const queryParams = [];
        
        if (clientIdParam) {
          queryParams.push(`clientId=${clientIdParam}`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
          setJobs(result.data);
        } else {
          setError(result.message || 'Failed to fetch jobs');
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
    
    // Filter by client ID if provided in the URL query
    if (clientIdParam) {
      setActiveTab('all');
    }
  }, [clientIdParam]);
  
  // Handle job deletion
  const handleDeleteJob = async (jobId: string) => {
    if (!jobId || !window.confirm('Are you sure you want to delete this job?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/jobs?id=${jobId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setJobs(jobs.filter(job => job.id !== jobId));
        alert('Job deleted successfully');
      } else {
        alert(result.message || 'Failed to delete job');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Error connecting to the server');
    }
  };
  
  // Handle job status update
  const handleUpdateJobStatus = async (jobId: string, newStatus: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress') => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/jobs?id=${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the job in the state
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
        
        // Update selected job if it's the one being modified
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob({ ...selectedJob, status: newStatus });
        }
        
        alert(`Job marked as ${newStatus}`);
      } else {
        alert(result.message || 'Failed to update job status');
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      alert('Error connecting to the server');
    }
  };
  
  // Filter jobs based on search query, status, and clientId
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || job.status === selectedStatus;
    
    const matchesClient = !clientIdParam || job.clientId.toString() === clientIdParam;
    
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'upcoming' ? (job.status === 'Scheduled' || job.status === 'In Progress') :
      activeTab === 'completed' ? job.status === 'Completed' :
      activeTab === 'cancelled' ? job.status === 'Cancelled' : 
      true;
    
    return matchesSearch && matchesStatus && matchesClient && matchesTab;
  });
  
  // Sort jobs by date (newest first)
  const sortedJobs = [...filteredJobs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get unique statuses for the filter dropdown
  const jobStatuses = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];
  
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
  
  // Get status icon based on job status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case 'Cancelled':
        return <FaTimesCircle className="w-4 h-4 text-red-500" />;
      case 'In Progress':
        return <FaExclamationTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <FaCalendar className="w-4 h-4 text-blue-500" />;
    }
  };
  
  // Get status color based on job status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {clientIdParam ? 
              `Jobs for ${filteredJobs[0]?.clientName || 'Client'}` : 
              'Jobs'
            }
          </h1>
          <p className="text-gray-500">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/jobs/new" 
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            Schedule Job
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'upcoming' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'completed' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'cancelled' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cancelled
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'all' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Jobs
          </button>
        </nav>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search jobs by client, service, or address..."
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
            {jobStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Jobs List */}
      {sortedJobs.length > 0 ? (
        <div className="space-y-4">
          {sortedJobs.map(job => (
            <div 
              key={job.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              onClick={() => setSelectedJob(job)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-medium text-gray-900 mr-3">{job.service}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status}</span>
                      </span>
                    </div>
                    <Link 
                      href={`/clients/${job.clientId}`}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {job.clientName}
                    </Link>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(job.totalAmount)}</p>
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FaCalendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span>{formatDate(job.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span>{job.timeSlot}</span>
                  </div>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{job.address}</span>
                  </div>
                </div>
                
                {job.crew && job.crew.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Assigned Crew</p>
                    <div className="flex flex-wrap gap-2">
                      {job.crew.map((member, idx) => (
                        <div key={idx} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-800">
                          <FaUser className="w-3 h-3 mr-1 text-gray-500" />
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                <button
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                  }}
                >
                  View Details
                </button>
                <Link 
                  href={`/jobs/${job.id}/edit`}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FaCalendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedStatus !== 'All' ? 
              'Try changing your search criteria or status filter' : 
              'Schedule your first job to get started'}
          </p>
          <Link
            href="/jobs/new"
            className="btn-primary inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Schedule Job
          </Link>
        </div>
      )}
      
      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Job Details</h2>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedJob.service}</h3>
                  <Link 
                    href={`/clients/${selectedJob.clientId}`}
                    className="text-primary-600 hover:text-primary-800 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedJob.clientName}
                  </Link>
                </div>
                
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${getStatusColor(selectedJob.status)}`}>
                    {getStatusIcon(selectedJob.status)}
                    <span className="ml-1">{selectedJob.status}</span>
                  </span>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedJob.totalAmount)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Schedule</p>
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <FaCalendar className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-900">{formatDate(selectedJob.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaClock className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-900">{selectedJob.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                        <span className="text-gray-900">{selectedJob.address}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedJob.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900">{selectedJob.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {selectedJob.crew && selectedJob.crew.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Assigned Crew</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.crew.map((member, idx) => (
                            <div key={idx} className="flex items-center bg-white px-2 py-1 rounded-full text-sm text-gray-800 border border-gray-200">
                              <FaUser className="w-3 h-3 mr-1 text-gray-500" />
                              {member}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedJob.status === 'Scheduled' && (
                        <>
                          <button 
                            className="btn-secondary text-sm text-center"
                            onClick={() => handleUpdateJobStatus(selectedJob.id || '', 'Completed')}
                          >
                            Mark Completed
                          </button>
                          <button 
                            className="btn-outline text-sm text-center text-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateJobStatus(selectedJob.id || '', 'Cancelled')}
                          >
                            Cancel Job
                          </button>
                        </>
                      )}
                      
                      {selectedJob.status === 'Completed' && (
                        <>
                          <Link 
                            href={`/invoices/new?job=${selectedJob.id}`}
                            className="btn-secondary text-sm text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Create Invoice
                          </Link>
                          <button 
                            className="btn-outline text-sm text-center"
                            onClick={() => alert('Duplicate job functionality would be implemented here')}
                          >
                            Duplicate Job
                          </button>
                        </>
                      )}
                      
                      {selectedJob.status === 'Cancelled' && (
                        <button 
                          className="btn-secondary text-sm text-center col-span-2"
                          onClick={() => alert('Reschedule job functionality would be implemented here')}
                        >
                          Reschedule Job
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)} 
                className="btn-secondary mr-2"
              >
                Close
              </button>
              <Link
                href={`/jobs/${selectedJob.id}/edit`}
                className="btn-primary"
                onClick={(e) => e.stopPropagation()}
              >
                Edit Job
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 