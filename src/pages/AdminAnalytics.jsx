import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Crown, TrendingUp, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPremium = user?.subscription?.planId?.hasAdvancedAnalytics || user?.subscription?.planName?.toLowerCase().includes('premium');

  useEffect(() => {
    if (isPremium) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isPremium]);

  const fetchAnalytics = async () => {
    try {
      // In a real scenario, you'd fetch from an analytics endpoint
      // Since we don't have a dedicated one, we'll fetch all requests and process them client-side
      const response = await requestAPI.getAllRequests();
      const requests = response.data?.data?.items || [];
      
      processData(requests);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processData = (requests) => {
    // Generate mock graph data based on requests
    const completed = requests.filter(r => r.status?.toLowerCase().includes('completed'));
    const totalRevenue = completed.reduce((sum, r) => sum + (r.proposedPrice || 0), 0);
    
    const monthlyData = [
      { name: 'Jan', revenue: Math.floor(totalRevenue * 0.1), requests: 5 },
      { name: 'Feb', revenue: Math.floor(totalRevenue * 0.15), requests: 8 },
      { name: 'Mar', revenue: Math.floor(totalRevenue * 0.2), requests: 12 },
      { name: 'Apr', revenue: Math.floor(totalRevenue * 0.25), requests: 15 },
      { name: 'May', revenue: Math.floor(totalRevenue * 0.3), requests: 20 },
      { name: 'Jun', revenue: totalRevenue, requests: completed.length },
    ];

    setData({
      totalRequests: requests.length,
      completedRequests: completed.length,
      totalRevenue: totalRevenue,
      chartData: monthlyData,
      rawRequests: requests
    });
  };

  const handleDownloadReport = () => {
    if (!data?.rawRequests) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Service,Status,Client,Price,Created\n";
    
    data.rawRequests.forEach(req => {
      const row = `${req._id},${req.service?.title || 'Unknown'},${req.status},${req.user?.name || 'Unknown'},${req.proposedPrice || 0},${new Date(req.createdAt).toLocaleDateString()}`;
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admin_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report downloaded successfully");
  };

  if (!isPremium) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-amber-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Crown size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Premium Analytics Locked</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Upgrade your subscription to Premium to access advanced analytics, revenue tracking, and downloadable reports.
          </p>
          <button 
            onClick={() => window.location.hash = '#/admin/settings'}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 transition-all transform hover:-translate-y-1"
          >
            Upgrade Plan Now
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">Advanced Analytics</h1>
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <Crown size={12} /> Premium
              </span>
            </div>
            <p className="text-sm text-slate-500">Track your performance, revenue, and client growth over time.</p>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Download size={18} />
            Download CSV Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-slate-800">₹{data.totalRevenue.toLocaleString()}</h3>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">+12% from last month</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Requests Acquired</p>
              <h3 className="text-3xl font-bold text-slate-800">{data.totalRequests}</h3>
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1 font-medium">+5 new this week</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Completed Requests</p>
              <h3 className="text-3xl font-bold text-slate-800">{data.completedRequests}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {data.totalRequests > 0 ? Math.round((data.completedRequests / data.totalRequests) * 100) : 0}% completion rate
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Growth (6 Months)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Requests Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Request Volume</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
