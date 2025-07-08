import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { 
  FaReceipt, 
  FaUsers, 
  FaCalendarAlt, 
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaTractor,
  FaClipboardList,
  FaTools,
  FaChartLine,
  FaExclamationTriangle,
  FaHome,
  FaEnvelope,
  FaSearch
} from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

// Define types for our data structures
interface Job {
  id: number;
  client: string;
  date: string;
  status: string;
  amount: string;
}

interface Expense {
  id: number;
  vendor: string;
  date: string;
  category: string;
  amount: string;
}

interface ReceiptItem {
  name: string;
  price: string;
}

interface Receipt {
  id: number;
  vendor: string;
  date: string;
  totalAmount: string;
  category: string;
  items: ReceiptItem[];
  status?: 'Reconciled' | 'Pending';
  notes?: string;
}

interface MaintenanceTask {
  id: number;
  equipment: string;
  dueDate: string;
  type: string;
  priority: string;
}

// Define props types for helper components
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  bgColor?: string;
  iconColor?: string;
}

interface QuickActionProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: formatCurrency(0),
    pendingJobs: 0,
    totalExpenses: formatCurrency(0),
    activeClients: 0
  });
  
  // Empty recent jobs data with proper typing
  const recentJobs: Job[] = [];
  
  // Recent expenses data loaded from receipts
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Empty upcoming maintenance tasks with proper typing
  const upcomingMaintenance: MaintenanceTask[] = [];

  // Load receipts from localStorage on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        setStats(prev => ({
          ...prev,
          totalExpenses: formatCurrency(data.totalExpenses),
          pendingJobs: data.pendingReceiptCount
        }));
        
        setRecentExpenses(data.recentReceipts);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's an overview of your business.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-grow max-w-xs">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input 
                type="search" 
                className="input pl-10" 
                placeholder="Search..." 
              />
            </div>
            <Link 
              href="/jobs/new" 
              className="btn-primary"
            >
              <FaPlus className="mr-2 h-4 w-4" /> New Job
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Revenue This Month" 
            value={stats.totalRevenue}
            icon={<FaDollarSign className="h-6 w-6" />}
            change="0% from last month"
            changeType="neutral"
            bgColor="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            iconColor="text-primary"
          />
          <StatCard 
            title="Active Clients" 
            value={stats.activeClients.toString()}
            icon={<FaUsers className="h-6 w-6" />}
            change="0 from last month"
            changeType="neutral"
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard 
            title="Pending Jobs" 
            value={stats.pendingJobs.toString()}
            icon={<FaCalendarAlt className="h-6 w-6" />}
            change="0 from last month"
            changeType="neutral"
            bgColor="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <StatCard 
            title="Expenses This Month" 
            value={stats.totalExpenses}
            icon={<FaReceipt className="h-6 w-6" />}
            change="0% from last month"
            changeType="neutral"
            bgColor="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
            iconColor="text-orange-600 dark:text-orange-400"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAction 
            title="Schedule Job"
            icon={<FaCalendarAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            href="/jobs/schedule"
            description="Create and manage job schedules"
          />
          <QuickAction 
            title="Create Invoice"
            icon={<FaReceipt className="w-5 h-5 text-primary dark:text-primary-light" />}
            href="/invoices/new"
            description="Generate new client invoices"
          />
          <QuickAction 
            title="Add Client"
            icon={<FaUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            href="/clients/new"
            description="Register new client information"
          />
          <QuickAction 
            title="Track Expense"
            icon={<FaDollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            href="/receipts"
            description="Record business expenses"
          />
        </div>

        {/* Recent Jobs and Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
              <Link href="/jobs" className="text-primary dark:text-primary-light hover:underline text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="p-5">
              {recentJobs.length > 0 ? (
                <div className="overflow-x-auto -mx-5">
                  <table className="table-style">
                    <thead className="table-header">
                      <tr>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="table-cell text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentJobs.map(job => (
                        <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="table-cell text-sm font-medium text-gray-900 dark:text-white">
                            {job.client}
                          </td>
                          <td className="table-cell text-sm text-gray-500 dark:text-gray-400">
                            {new Date(job.date).toLocaleDateString()}
                          </td>
                          <td className="table-cell">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="table-cell text-sm text-gray-900 dark:text-white text-right">
                            {job.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaClipboardList className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No jobs yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new job.</p>
                  <div className="mt-6">
                    <Link href="/jobs/new" className="btn-primary">
                      <FaPlus className="mr-2 h-4 w-4" /> New Job
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
              <Link href="/receipts" className="text-primary dark:text-primary-light hover:underline text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="p-5">
              {recentExpenses.length > 0 ? (
                <div className="overflow-x-auto -mx-5">
                  <table className="table-style">
                    <thead className="table-header">
                      <tr>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="table-cell text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentExpenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="table-cell text-sm font-medium text-gray-900 dark:text-white">
                            {expense.vendor}
                          </td>
                          <td className="table-cell text-sm text-gray-500 dark:text-gray-400">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="table-cell">
                            <span className="badge badge-info">
                              {expense.category}
                            </span>
                          </td>
                          <td className="table-cell text-sm text-gray-900 dark:text-white text-right">
                            {expense.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaReceipt className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No expenses yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start tracking your business expenses.</p>
                  <div className="mt-6">
                    <Link href="/receipts" className="btn-primary">
                      <FaPlus className="mr-2 h-4 w-4" /> Add Expense
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Maintenance & Quick Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Maintenance</h2>
              <Link href="/equipment" className="text-primary dark:text-primary-light hover:underline text-sm font-medium">
                View Equipment
              </Link>
            </div>
            <div className="p-5">
              {upcomingMaintenance.length > 0 ? (
                <div className="overflow-x-auto -mx-5">
                  <table className="table-style">
                    <thead className="table-header">
                      <tr>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Equipment
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {upcomingMaintenance.map(maintenance => (
                        <tr key={maintenance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="table-cell text-sm font-medium text-gray-900 dark:text-white">
                            {maintenance.equipment}
                          </td>
                          <td className="table-cell text-sm text-gray-500 dark:text-gray-400">
                            {new Date(maintenance.dueDate).toLocaleDateString()}
                          </td>
                          <td className="table-cell text-sm text-gray-500 dark:text-gray-400">
                            {maintenance.type}
                          </td>
                          <td className="table-cell">
                            <PriorityBadge priority={maintenance.priority} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaTools className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No maintenance scheduled</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your equipment in top shape.</p>
                  <div className="mt-6">
                    <Link href="/equipment" className="btn-primary">
                      <FaPlus className="mr-2 h-4 w-4" /> Add Equipment
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="card">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Business Tips</h2>
              </div>
              <div className="p-5">
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 rounded-full bg-primary-light/20 dark:bg-primary/20 p-3">
                      <FaClipboardList className="h-5 w-5 text-primary dark:text-primary-light" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Scheduled Maintenance</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Regular maintenance prevents costly equipment breakdowns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                      <FaUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Client Relationships</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Maintaining current client information improves communication.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/20 p-3">
                      <FaChartLine className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Track Metrics</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Regularly review reports to understand business performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon, change, changeType, bgColor = "bg-white dark:bg-gray-800", iconColor = "text-gray-500 dark:text-gray-400" }: StatCardProps) {
  return (
    <div className={`${bgColor} overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${iconColor}`}>
                {icon}
              </div>
              <p className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </p>
            </div>
            <div className="mt-1">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            {changeType === 'increase' && (
              <FaArrowUp className="text-green-500 dark:text-green-400 mr-1 flex-shrink-0 h-4 w-4" />
            )}
            {changeType === 'decrease' && (
              <FaArrowDown className="text-red-500 dark:text-red-400 mr-1 flex-shrink-0 h-4 w-4" />
            )}
            <p className={`text-sm ${
              changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 
              changeType === 'decrease' ? 'text-red-600 dark:text-red-400' : 
              'text-gray-500 dark:text-gray-400'
            }`}>
              {change}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let bgColor = 'badge-neutral';
  
  switch (status.toLowerCase()) {
    case 'completed':
      bgColor = 'badge-success';
      break;
    case 'pending':
      bgColor = 'badge-warning';
      break;
    case 'scheduled':
      bgColor = 'badge-info';
      break;
    case 'cancelled':
      bgColor = 'badge-error';
      break;
  }
  
  return (
    <span className={`badge ${bgColor}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  let bgColor = 'badge-neutral';
  
  switch (priority.toLowerCase()) {
    case 'high':
      bgColor = 'badge-error';
      break;
    case 'medium':
      bgColor = 'badge-warning';
      break;
    case 'low':
      bgColor = 'badge-success';
      break;
  }
  
  return (
    <span className={`badge ${bgColor}`}>
      {priority}
    </span>
  );
}

function QuickAction({ title, icon, href, description }: QuickActionProps) {
  return (
    <Link 
      href={href}
      className="block bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 