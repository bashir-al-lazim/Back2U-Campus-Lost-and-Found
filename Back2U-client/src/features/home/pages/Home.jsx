import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";

const Home = () => {
  const [analytics, setAnalytics] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("http://localhost:5000/analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      }
    };

    const fetchMonthly = async () => {
      try {
        const res = await fetch("http://localhost:5000/analytics/monthly");
        const data = await res.json();
        setMonthlyData(data);
      } catch (err) {
        console.error("Failed to fetch monthly data", err);
      }
    };

    fetchAnalytics();
    fetchMonthly();
  }, []);

  return (
    <div className="min-h-screen pt-32">
      {/* Analytics Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <h1 className="text-5xl font-semibold text-center mb-8 text-gray-800">
          Analytics
        </h1>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white shadow-md rounded-2xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Active Items</h2>
            <p className="text-3xl font-bold text-blue-600">
              {analytics ? analytics.activeItems : "--"}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Claim / Match Rate</h2>
            <p className="text-3xl font-bold text-green-600">
              {analytics ? `${analytics.claimMatchRate}%` : "--"}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Median Time to Resolution</h2>
            <p className="text-3xl font-bold text-purple-600">
              {analytics ? `${analytics.medianTimeToResolution} days` : "--"}
            </p>
          </div>
        </div>

        {/* Charts */}
        {monthlyData?.months && (
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Monthly Overview</h2>

            {/* Line Chart */}
            <div className="w-full h-80 mb-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData.months.map((month, i) => ({
                    month,
                    Open: monthlyData.series.Open[i],
                    Claimed: monthlyData.series.Claimed[i],
                    Resolved: monthlyData.series.Resolved[i],
                    Unresolved: monthlyData.series.Unresolved[i],
                  }))}
                  margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Open" stroke="#3B82F6" dot={false} />
                  <Line type="monotone" dataKey="Claimed" stroke="#10B981" dot={false} />
                  <Line type="monotone" dataKey="Resolved" stroke="#8B5CF6" dot={false} />
                  <Line type="monotone" dataKey="Unresolved" stroke="#F59E0B" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData.months.map((month, i) => ({
                    month,
                    Open: monthlyData.series.Open[i],
                    Claimed: monthlyData.series.Claimed[i],
                    Resolved: monthlyData.series.Resolved[i],
                    Unresolved: monthlyData.series.Unresolved[i],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Open" fill="#3B82F6" />
                  <Bar dataKey="Claimed" fill="#10B981" />
                  <Bar dataKey="Resolved" fill="#8B5CF6" />
                  <Bar dataKey="Unresolved" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
