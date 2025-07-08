import React, { useState } from 'react';
import { 
  FaChartBar, 
  FaChartPie, 
  FaChartLine, 
  FaDownload, 
  FaCalendarAlt,
  FaFileExport
} from 'react-icons/fa';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [dateRange, setDateRange] = useState('month');
  
  // Sample data for different reports (all zeroed out)
  const revenueData = [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 },
    { month: 'Jul', amount: 0 },
    { month: 'Aug', amount: 0 },
    { month: 'Sep', amount: 0 },
    { month: 'Oct', amount: 0 },
    { month: 'Nov', amount: 0 },
    { month: 'Dec', amount: 0 }
  ];
  
  const expenseData = [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 },
    { month: 'Jul', amount: 0 },
    { month: 'Aug', amount: 0 },
    { month: 'Sep', amount: 0 },
    { month: 'Oct', amount: 0 },
    { month: 'Nov', amount: 0 },
    { month: 'Dec', amount: 0 }
  ];
  
  const clientData = [
    { type: 'Residential', count: 0 },
    { type: 'Commercial', count: 0 },
    { type: 'Government', count: 0 },
    { type: 'Non-profit', count: 0 }
  ];
  
  const jobTypeData = [
    { type: 'Lawn Mowing', count: 0 },
    { type: 'Landscaping', count: 0 },
    { type: 'Tree Trimming', count: 0 },
    { type: 'Garden Design', count: 0 },
    { type: 'Irrigation', count: 0 },
    { type: 'Other', count: 0 }
  ];
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate max value for chart scaling
  const getMaxValue = (data: { month: string, amount: number }[]): number => {
    return Math.max(...data.map(item => item.amount)) * 1.1 || 10; // Add 10% for padding, default to 10 if all zeros
  };
  
  // Calculate total value for a dataset
  const calculateTotal = (data: { month: string, amount: number }[]): number => {
    return data.reduce((sum, item) => sum + item.amount, 0);
  };
  
  // Calculate profit (revenue - expenses)
  const calculateProfit = (): number => {
    return calculateTotal(revenueData) - calculateTotal(expenseData);
  };
  
  // Calculate percentage for a value out of total
  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };
  
  // Get color based on index
  const getChartColor = (index: number): string => {
    const colors = [
      'bg-primary-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };
  
  // Get text color based on index
  const getTextColor = (index: number): string => {
    const colors = [
      'text-primary-700', 'text-blue-700', 'text-green-700', 'text-yellow-700', 
      'text-red-700', 'text-purple-700', 'text-pink-700', 'text-indigo-700'
    ];
    return colors[index % colors.length];
  };
  
  // Render based on selected report
  const renderChart = () => {
    switch (selectedReport) {
      case 'revenue':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Revenue (Year)</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(calculateTotal(revenueData))}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Expenses (Year)</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{formatCurrency(calculateTotal(expenseData))}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Net Profit (Year)</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(calculateProfit())}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Revenue vs Expenses</h3>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-primary-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-600">Revenue</span>
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                    <span className="text-xs text-gray-600">Expenses</span>
                  </span>
                </div>
              </div>
              
              <div className="h-60 flex items-end space-x-2">
                {revenueData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full h-full flex flex-col justify-end">
                      <div 
                        className="w-full bg-primary-500 rounded-t"
                        style={{ 
                          height: `${(item.amount / getMaxValue(revenueData)) * 100}%`,
                        }}
                      >
                      </div>
                      <div 
                        className="w-full bg-red-500 absolute bottom-0 left-0 rounded-t"
                        style={{ 
                          height: `${(expenseData[index].amount / getMaxValue(revenueData)) * 100}%`,
                          opacity: 0.8
                        }}
                      >
                      </div>
                    </div>
                    <span className="text-xs mt-1 text-gray-600">{item.month}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Top Revenue Month</h4>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(Math.max(...revenueData.map(d => d.amount)))} 
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      ({revenueData.find(d => d.amount === Math.max(...revenueData.map(d => d.amount)))?.month || 'N/A'})
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Average Monthly Revenue</h4>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(calculateTotal(revenueData) / revenueData.length)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'clients':
        const totalClients = clientData.reduce((sum, item) => sum + item.count, 0);
        
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{totalClients}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Most Common Type</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {totalClients > 0 ? clientData.sort((a, b) => b.count - a.count)[0].type : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Average Revenue/Client</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {totalClients > 0 ? formatCurrency(calculateTotal(revenueData) / totalClients) : '$0'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Client Distribution</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-60 flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="w-40 h-40 rounded-full border-8 border-gray-100 relative">
                      {totalClients > 0 ? (
                        clientData.map((item, index) => {
                          // Calculate the segment angle
                          const percentage = item.count / totalClients;
                          const previousSegments = clientData
                            .slice(0, index)
                            .reduce((sum, i) => sum + i.count / totalClients, 0);
                          
                          return (
                            <div
                              key={index}
                              className={`absolute inset-0 ${getChartColor(index)}`}
                              style={{
                                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(2 * Math.PI * previousSegments - Math.PI/2)}% ${50 + 50 * Math.sin(2 * Math.PI * previousSegments - Math.PI/2)}%, ${50 + 50 * Math.cos(2 * Math.PI * (previousSegments + percentage) - Math.PI/2)}% ${50 + 50 * Math.sin(2 * Math.PI * (previousSegments + percentage) - Math.PI/2)}%)`
                              }}
                            ></div>
                          );
                        })
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          No data
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-white" style={{ transform: 'scale(0.7)' }}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-3">
                    {clientData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 ${getChartColor(index)} rounded-full mr-2`}></span>
                          <span className="text-sm text-gray-700">{item.type}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${getTextColor(index)} mr-2`}>
                            {item.count}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({calculatePercentage(item.count, totalClients)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="text-primary-500 mr-1">•</span>
                        <span>No client data available yet.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-500 mr-1">•</span>
                        <span>Start by adding your first client to see analytics.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'jobs':
        const totalJobs = jobTypeData.reduce((sum, item) => sum + item.count, 0);
        
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{totalJobs}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Most Common Service</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {totalJobs > 0 ? jobTypeData.sort((a, b) => b.count - a.count)[0].type : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-500">Average Revenue/Job</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {totalJobs > 0 ? formatCurrency(calculateTotal(revenueData) / totalJobs) : '$0'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Job Distribution</h3>
              
              <div className="h-60">
                {jobTypeData.map((item, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.type}</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${getTextColor(index)} mr-2`}>
                          {item.count}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({calculatePercentage(item.count, totalJobs)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getChartColor(index)} rounded-full`}
                        style={{ width: totalJobs > 0 ? `${(item.count / totalJobs) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-1">•</span>
                    <span>No job data available yet.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-1">•</span>
                    <span>Start by scheduling your first job to see analytics.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Select a report to view</div>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-500">View detailed insights about your business</p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="btn-outline flex items-center"
            onClick={() => alert('Export functionality would be implemented here')}
          >
            <FaFileExport className="mr-2" />
            Export
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                selectedReport === 'revenue' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedReport('revenue')}
            >
              <FaChartLine className="inline-block mr-2" />
              Revenue & Expenses
            </button>
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                selectedReport === 'clients' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedReport('clients')}
            >
              <FaChartPie className="inline-block mr-2" />
              Client Analysis
            </button>
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                selectedReport === 'jobs' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedReport('jobs')}
            >
              <FaChartBar className="inline-block mr-2" />
              Job Analysis
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedReport === 'revenue' ? 'Revenue & Expense Analysis' : 
               selectedReport === 'clients' ? 'Client Analysis' : 
               'Job Analysis'}
            </h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
          </div>
          
          {renderChart()}
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Data shown is for demonstration purposes only.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 