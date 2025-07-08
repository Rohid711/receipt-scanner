import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

// Department options
const departmentOptions = [
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Service',
  'IT',
  'Administration',
  'Management',
  'Other'
];

// Common skill options
const skillOptions = [
  'Customer Service',
  'Project Management',
  'Team Leadership',
  'Sales',
  'Marketing',
  'Technical Support',
  'Data Analysis',
  'Communication',
  'Problem Solving',
  'Time Management',
  'Organization',
  'Software Proficiency'
];

export default function NewEmployeePage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    startDate: new Date().toISOString().split('T')[0],
    hourlySalary: '',
    status: 'Active',
    skillTags: [] as string[],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    address: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [newSkill, setNewSkill] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (emergency contact)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as Record<string, unknown>,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle skill tag toggle
  const toggleSkill = (skill: string) => {
    if (formData.skillTags.includes(skill)) {
      setFormData({
        ...formData,
        skillTags: formData.skillTags.filter(s => s !== skill)
      });
    } else {
      setFormData({
        ...formData,
        skillTags: [...formData.skillTags, skill]
      });
    }
  };
  
  // Add custom skill
  const addCustomSkill = () => {
    if (newSkill.trim() && !formData.skillTags.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skillTags: [...formData.skillTags, newSkill.trim()]
      });
      setNewSkill('');
    }
  };
  
  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const phoneDigits = value.replace(/\D/g, '');
    
    // Format the phone number as (XXX) XXX-XXXX
    if (phoneDigits.length <= 3) {
      return phoneDigits;
    } else if (phoneDigits.length <= 6) {
      return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3)}`;
    } else {
      return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;
    }
  };
  
  // Handle phone input change with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatPhoneNumber(value);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as Record<string, unknown>,
          [child]: formattedValue
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.position.trim()) newErrors.position = 'Position is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.hourlySalary.trim()) newErrors.hourlySalary = 'Hourly rate is required';
    if (isNaN(Number(formData.hourlySalary))) newErrors.hourlySalary = 'Hourly rate must be a number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Convert hourly salary to a number
      const employeeData = {
        ...formData,
        hourlySalary: parseFloat(formData.hourlySalary)
      };
      
      // Submit the data to the API
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to employees page after successful creation
        router.push('/employees');
      } else {
        setServerError(result.message || 'Failed to create employee');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      setServerError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/employees" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <FaArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Add New Employee</h1>
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
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="john.doe@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                className={`input ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
                placeholder="123 Main St, City, State"
              />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Employment Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={`input ${errors.position ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Landscape Technician"
              />
              {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`input ${errors.department ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="">Select Department</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hourlySalary"
                value={formData.hourlySalary}
                onChange={handleChange}
                className={`input ${errors.hourlySalary ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="20.00"
              />
              {errors.hourlySalary && <p className="text-red-500 text-sm mt-1">{errors.hourlySalary}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Skills & Expertise</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.skillTags.includes(skill)
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="input"
                placeholder="Add custom skill"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
              />
              <button
                type="button"
                className="btn-outline whitespace-nowrap"
                onClick={addCustomSkill}
              >
                Add Skill
              </button>
            </div>
          </div>
          
          {formData.skillTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.skillTags.map(skill => (
                  <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {skill}
                    <button
                      type="button"
                      className="ml-1.5 text-green-600 hover:text-green-800"
                      onClick={() => toggleSkill(skill)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Emergency Contact</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                className="input"
                placeholder="Jane Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <input
                type="text"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleChange}
                className="input"
                placeholder="Spouse, Parent, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handlePhoneChange}
                className="input"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Additional Notes</h2>
          
          <div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows={4}
              placeholder="Any additional information about the employee..."
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Link href="/employees" className="btn-outline flex items-center">
            <FaTimes className="mr-2" /> Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save Employee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 