import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Scale, AlertTriangle, Heart, BarChart2 } from 'lucide-react';

const TaskInequalitySlide = () => {
  const chartData = {
    labels: ['Task Planning', 'Calendar Mgmt', 'School Coordination', 'Social Planning'],
    datasets: [
      {
        label: 'Primary Caregiver',
        data: [85, 78, 92, 65],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
      {
        label: 'Supporting Partner',
        data: [15, 22, 8, 35],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Task Inequality in Relationships"
      subtitle="Addressing the uneven distribution of mental load in families"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-5">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <BarChart2 className="mr-2 text-indigo-600" size={24} />
            Mental Load Distribution
          </h3>
          <div className="h-64">
            <DataChart 
              type="bar"
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      padding: 10,
                      boxWidth: 12,
                      usePointStyle: true
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.raw}%`;
                      }
                    }
                  },
                  title: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    stacked: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Percentage of Mental Load'
                    }
                  },
                  y: {
                    stacked: true,
                    ticks: {
                      font: {
                        size: 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-6 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Research shows a significant imbalance in who carries the mental load in families, 
              often leading to relationship strain and burnout.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">What Research Tells Us</h3>
          <p className="text-gray-700 italic mb-4">
            "One of the most consistent findings in the literature is the continued inequity in the 
            division of household labor—even when both partners are employed full-time and even in 
            couples who express egalitarian beliefs about gender."
          </p>
          <div className="text-right">
            <p className="font-medium text-indigo-700">Journal of Family Psychology</p>
            <p className="text-sm text-gray-600">Coltrane & Adams, "Work–Family Imagery and Gender Stereotypes"</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="The Relationship Impact" 
          icon={<Heart size={24} />} 
          className="bg-gradient-to-br from-pink-50 to-rose-100"
        >
          <p className="text-gray-700">
            78% of couples report relationship tension from uneven mental load distribution. 
            This invisible inequality is a leading factor in relationship dissatisfaction.
          </p>
        </Card>
        
        <Card 
          title="Beyond Task Execution" 
          icon={<AlertTriangle size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700">
            Traditional solutions focus only on task completion, ignoring the mental burden of 
            planning, coordination, and emotional labor.
          </p>
        </Card>
        
        <Card 
          title="Rebalancing the Load" 
          icon={<Scale size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700">
            Allie creates awareness of invisible work and provides tools to redistribute 
            responsibility more equitably between partners.
          </p>
        </Card>
      </div>
    </SlideTemplate>
  );
};

export default TaskInequalitySlide;