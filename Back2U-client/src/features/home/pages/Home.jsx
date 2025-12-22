import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";
import { Link } from "react-router-dom";

const ItemCard = ({ item }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transform transition duration-500 hover:scale-[1.02]">
      <img
        src={item.photoUrl || item.photo || "https://via.placeholder.com/400x200?text=No+Image"}
        alt={item.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">{item.title}</h3>
        <p className="text-sm text-gray-600 mb-2 truncate">{item.description}</p>
        <p className="text-sm font-semibold text-gray-700">
          Category: <span className="font-normal">{item.category}</span>
        </p>
        <p className="text-sm font-semibold text-gray-700 mb-4">
          Found at: <span className="font-normal">{item.location || item.locationText}</span>
        </p>

        <Link
          to={`/app/items/${item._id}/claim`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-150"
        >
          Claim This Item
        </Link>
      </div>
    </div>
  );
};

const Home = () => {
  const [analytics, setAnalytics] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  // NEW: items state + loading + error
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);

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

    // Fetch items for the lost & found grid
    const fetchItems = async () => {
      setItemsLoading(true);
      setItemsError(null);
      try {
        const res = await fetch("http://localhost:5000/items");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        setLostFoundItems(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setItemsError(err.message || "Failed to fetch items");
        setLostFoundItems([]);
      } finally {
        setItemsLoading(false);
      }
    };


    fetchAnalytics();
    fetchMonthly();
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen pt-32">
      {/* Analytics Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <h1 className="text-5xl font-semibold text-center mb-8 text-gray-800">Analytics</h1>

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

        {monthlyData?.months && (
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Monthly Overview</h2>

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

      <hr className="my-12 border-t-2 border-gray-200" />
      <div className="container mx-auto px-4 py-12 bg-gray-50">
        <div className="text-center mb-16">
          <p className="text-sm text-gray-500 mb-2">Find your lost possessions</p>
          <Link
            to="/login"
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-200"
          >
            Login to Claim
          </Link>
        </div>

        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800">Recent Found Items</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {itemsLoading ? (
            <p className="col-span-full text-center text-gray-500">Loading items...</p>
          ) : itemsError ? (
            <p className="col-span-full text-center text-red-500">Error loading items: {itemsError}</p>
          ) : lostFoundItems.length > 0 ? (
            lostFoundItems.map((item) => <ItemCard key={item._id} item={item} />)
          ) : (
            <p className="col-span-full text-center text-gray-500">No items currently available to claim.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
