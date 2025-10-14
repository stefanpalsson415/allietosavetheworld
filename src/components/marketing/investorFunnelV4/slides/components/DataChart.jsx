import React from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell, Sector,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import '../slideStyles.css';

/**
 * DataChart Component
 * A versatile chart component that renders different chart types using Recharts
 */
const DataChart = ({
  type = "bar",
  data,
  options = {},
  height = 300,
  className = ""
}) => {
  // Color palette for the charts
  const COLORS = [
    "#8b5cf6", // Purple
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#0ea5e9", // Sky
    "#14b8a6", // Teal
    "#eab308", // Yellow
  ];

  // Default chart options
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: false,
        text: ''
      }
    }
  };

  // Merge default options with provided options
  // Make sure to do a deep merge for nested objects
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...(options.plugins || {}),
      title: {
        ...defaultOptions.plugins.title,
        ...(options.plugins?.title || {})
      },
      legend: {
        ...defaultOptions.plugins.legend,
        ...(options.plugins?.legend || {})
      }
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        // Handle two different data formats:
        // 1. Chart.js style with datasets array
        // 2. Recharts style with direct data array of objects
        if (data && Array.isArray(data) && !data.datasets) {
          // Direct data format (already in Recharts format)
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => options.scales?.y?.ticks?.callback ? 
                    options.scales.y.ticks.callback(value) : value}
                />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                {mergedOptions.plugins.legend.display && <Legend />}
                {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                  <Bar 
                    key={index}
                    dataKey={key}
                    fill={COLORS[index % COLORS.length]}
                    name={key}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        } else {
          // Chart.js style format
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={data?.labels?.map((label, i) => {
                const obj = { name: label };
                (data.datasets || []).forEach((dataset, j) => {
                  obj[dataset.label || `dataset${j}`] = dataset.data[i];
                });
                return obj;
              })} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => options.scales?.y?.ticks?.callback ? 
                    options.scales.y.ticks.callback(value) : value}
                />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                {mergedOptions.plugins.legend.display && <Legend />}
                {(data?.datasets || []).map((dataset, index) => (
                  <Bar 
                    key={index}
                    dataKey={dataset.label || `dataset${index}`}
                    fill={dataset.backgroundColor || COLORS[index % COLORS.length]}
                    name={dataset.label || `Dataset ${index+1}`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }

      case 'line':
        // Handle two different data formats like with bar charts
        if (data && Array.isArray(data) && !data.datasets) {
          // Direct data format (already in Recharts format)
          return (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {mergedOptions.plugins.legend.display && <Legend />}
                {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    name={key}
                    dot={{ stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        } else {
          // Chart.js style format
          return (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={data?.labels?.map((label, i) => {
                const obj = { name: label };
                (data.datasets || []).forEach((dataset, j) => {
                  obj[dataset.label || `dataset${j}`] = dataset.data[i];
                });
                return obj;
              })} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {mergedOptions.plugins.legend.display && <Legend />}
                {(data?.datasets || []).map((dataset, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={dataset.label || `dataset${index}`}
                    stroke={dataset.borderColor || COLORS[index % COLORS.length]}
                    name={dataset.label || `Dataset ${index+1}`}
                    dot={{ stroke: dataset.borderColor || COLORS[index % COLORS.length], strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        }

      case 'pie':
        // Handle two different data formats:
        let pieData;
        
        if (data && Array.isArray(data) && !data.datasets) {
          // Direct data format (already prepared for Recharts)
          pieData = data;
        } else if (data && data.labels && data.datasets && data.datasets[0]) {
          // Chart.js style format
          pieData = data.labels.map((label, index) => ({
            name: label,
            value: data.datasets[0].data[index]
          }));
        } else {
          // Fallback for empty or invalid data
          pieData = [];
        }

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}`, name]} />
              {mergedOptions.plugins.legend.display && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        // Handle two different data formats like with bar and line charts
        if (data && Array.isArray(data) && !data.datasets) {
          // Direct data format (already in Recharts format)
          const dataKeys = Object.keys(data[0] || {}).filter(key => key !== 'name');
          
          return (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  {dataKeys.map((key, index) => (
                    <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {dataKeys.map((key, index) => (
                  <Area
                    key={index}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    fillOpacity={1}
                    fill={`url(#color${index})`}
                    name={key}
                  />
                ))}
                {mergedOptions.plugins.legend.display && <Legend />}
              </AreaChart>
            </ResponsiveContainer>
          );
        } else {
          // Chart.js style format
          const formattedData = data?.labels?.map((label, i) => {
            const obj = { name: label };
            (data.datasets || []).forEach((dataset, j) => {
              obj[dataset.label || `dataset${j}`] = dataset.data[i];
            });
            return obj;
          }) || [];
          
          return (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  {(data?.datasets || []).map((dataset, index) => (
                    <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {(data?.datasets || []).map((dataset, index) => (
                  <Area
                    key={index}
                    type="monotone"
                    dataKey={dataset.label || `dataset${index}`}
                    stroke={COLORS[index % COLORS.length]}
                    fillOpacity={1}
                    fill={`url(#color${index})`}
                    name={dataset.label || `Dataset ${index+1}`}
                  />
                ))}
                {mergedOptions.plugins.legend.display && <Legend />}
              </AreaChart>
            </ResponsiveContainer>
          );
        }

      case 'radar':
        // Handle two different data formats like with other chart types
        if (data && Array.isArray(data) && !data.datasets) {
          // Direct data format (already in Recharts format)
          const dataKeys = Object.keys(data[0] || {}).filter(key => key !== 'name');
          
          return (
            <ResponsiveContainer width="100%" height={height}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                {dataKeys.map((key, index) => (
                  <Radar
                    key={index}
                    name={key}
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.5}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          );
        } else {
          // Chart.js style format
          const formattedData = data?.labels?.map((label, i) => {
            const obj = { name: label };
            (data.datasets || []).forEach((dataset, j) => {
              obj[dataset.label || `dataset${j}`] = dataset.data[i];
            });
            return obj;
          }) || [];
          
          return (
            <ResponsiveContainer width="100%" height={height}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formattedData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                {(data?.datasets || []).map((dataset, index) => (
                  <Radar
                    key={index}
                    name={dataset.label || `Dataset ${index+1}`}
                    dataKey={dataset.label || `dataset${index}`}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.5}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          );
        }

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center" style={{ height }}>
            <div className="text-center text-gray-500">
              <p className="font-medium">Unsupported chart type: {type}</p>
              <p className="text-sm mt-2">Please use one of: bar, line, pie, area, radar</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`${className}`}>
      {mergedOptions.plugins.title.display && (
        <h3 className="font-medium text-gray-800 mb-2">{mergedOptions.plugins.title.text}</h3>
      )}
      {renderChart()}
    </div>
  );
};

export default DataChart;