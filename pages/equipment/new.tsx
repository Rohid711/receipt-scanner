import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';

// Equipment types for business
const equipmentTypes = [
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

// Condition options
const conditionOptions = [
  'Excellent',
  'Good',
  'Fair',
  'Poor'
];

// Location options
const locationOptions = [
  'Main Warehouse',
  'Tool Shed',
  'Garage',
  'Service Center',
  'Storage',
  'Office'
];

export default function NewEquipmentPage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    warrantyExpiration: '',
    location: 'Main Warehouse',
    status: 'Available',
    condition: 'Excellent',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Equipment name is required';
    if (!formData.type) newErrors.type = 'Equipment type is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
    if (!formData.purchasePrice.trim()) newErrors.purchasePrice = 'Purchase price is required';
    if (isNaN(Number(formData.purchasePrice))) newErrors.purchasePrice = 'Purchase price must be a number';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would submit to an API
      console.log('Submitting equipment data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to equipment page
      router.push('/equipment');
    } catch (error) {
      console.error('Error saving equipment data:', error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/equipment" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Add New Equipment</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Office Printer"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`input ${errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="">Select Type</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`input ${errors.model ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="John Deere Z930M"
              />
              {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="input"
                placeholder="JD9301234"
              />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Purchase Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="input"
                placeholder="John Deere"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="input"
                placeholder="Green Valley Equipment"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className={`input ${errors.purchaseDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.purchaseDate && <p className="text-red-500 text-sm mt-1">{errors.purchaseDate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                className={`input ${errors.purchasePrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="5299.99"
              />
              {errors.purchasePrice && <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warranty Expiration Date
              </label>
              <input
                type="date"
                name="warrantyExpiration"
                value={formData.warrantyExpiration}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Status & Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
              >
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="In Repair">In Repair</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="input"
              >
                {conditionOptions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input"
              >
                {locationOptions.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Additional Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows={4}
              placeholder="Enter any important details about this equipment..."
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Link href="/equipment" className="btn-outline flex items-center">
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
                <FaSave className="mr-2" /> Save Equipment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 