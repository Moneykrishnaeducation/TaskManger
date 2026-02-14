import { BarChart3 } from 'lucide-react';

const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">System analytics and reports</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <p className="text-gray-600">Analytics page - coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
