import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

function DataCharts({ reportsByDepartment, reportsByMonth }) {
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="mt-4">
      <h2>Reports Analytics</h2>
      
      <div className="row mt-3">
        <div className="col-md-6 mb-4">
          <div className="card shadow h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">Reports by Department</h5>
            </div>
            <div className="card-body">
              {reportsByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={reportsByDepartment}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Number of Reports" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-5">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card shadow h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">Reports by Month (Current Year)</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={reportsByMonth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#82ca9d" 
                    activeDot={{ r: 8 }} 
                    name="Number of Reports"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 offset-md-3 mb-4">
          <div className="card shadow">
            <div className="card-header bg-light">
              <h5 className="mb-0">Department Distribution</h5>
            </div>
            <div className="card-body">
              {reportsByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportsByDepartment}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportsByDepartment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-5">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataCharts;
