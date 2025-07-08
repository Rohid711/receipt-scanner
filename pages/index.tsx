import Head from 'next/head';
import Link from 'next/link';
import { 
  FaReceipt, 
  FaChartLine, 
  FaFileExport, 
  FaSearch, 
  FaMobileAlt, 
  FaCloud,
  FaShieldAlt,
  FaRegLightbulb,
  FaRegClock,
  FaRegChartBar,
  FaBuilding
} from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
import PricingSection from '../components/PricingSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Head>
        <title>Bizznex - Smart Business Management</title>
        <meta name="description" content="Powerful software to manage and track your business operations with advanced analytics, receipt scanning, and smart categorization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <FaBuilding className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white font-display">Bizznex</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="#pricing" className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light">
                Pricing
              </Link>
              <ThemeToggle />
              <Link href="/signin" className="btn-primary bg-green-600 hover:bg-green-700">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Expense Management <span className="text-green-600">Made Easy</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your expense tracking with our powerful receipt scanner. Automate data extraction, 
              gain insights, and manage your finances effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="btn-primary bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link href="#features" className="btn-outline border-green-600 text-green-600 hover:bg-green-600 hover:text-white text-lg px-8 py-3">
                See Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Powerful Features for Complete Expense Management
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Everything you need to manage receipts and track expenses efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaReceipt />}
              title="Smart Receipt Scanning"
              description="Advanced OCR technology automatically extracts vendor, date, and amount information from your receipts."
            />
            <FeatureCard
              icon={<FaChartLine />}
              title="Expense Analytics"
              description="Get detailed insights into your spending patterns with interactive charts and reports."
            />
            <FeatureCard
              icon={<FaFileExport />}
              title="Export Capabilities"
              description="Export your data to Excel, PDF, or CSV formats for accounting and tax purposes."
            />
            <FeatureCard
              icon={<FaSearch />}
              title="Smart Search"
              description="Quickly find receipts using advanced search filters by date, vendor, category, or amount."
            />
            <FeatureCard
              icon={<FaMobileAlt />}
              title="Mobile Friendly"
              description="Scan and manage receipts on the go with our responsive mobile interface."
            />
            <FeatureCard
              icon={<FaCloud />}
              title="Cloud Storage"
              description="Securely store and access your receipts from anywhere, anytime."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Why Choose Bizznex?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BenefitCard
              icon={<FaShieldAlt />}
              title="Secure"
              description="Bank-level security for your financial data"
            />
            <BenefitCard
              icon={<FaRegLightbulb />}
              title="Smart"
              description="AI-powered categorization and data extraction"
            />
            <BenefitCard
              icon={<FaRegClock />}
              title="Time-Saving"
              description="Reduce manual data entry by 90%"
            />
            <BenefitCard
              icon={<FaRegChartBar />}
              title="Insightful"
              description="Detailed analytics and spending insights"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <PricingSection />
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Transform Your Business Management?
          </h2>
          <Link href="/signup" className="btn-primary bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <FaBuilding className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Bizznex</span>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Making business management simple and efficient for everyone.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Features</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Receipt Scanning</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Business Analytics</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Data Export</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Cloud Storage</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Company</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">About Us</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Contact</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Bizznex. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
} 