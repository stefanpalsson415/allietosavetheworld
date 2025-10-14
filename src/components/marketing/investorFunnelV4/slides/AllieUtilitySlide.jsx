import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Stat } from './components';
import { Zap, Activity, BarChart2, Clock } from 'lucide-react';

const AllieUtilitySlide = () => {
  const usageData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Daily Active Users',
        data: [42, 68, 76, 83, 87, 91, 93, 95],
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Sessions Per Day (Avg)',
        data: [1.8, 2.7, 3.5, 4.2, 4.6, 4.8, 5.2, 5.3],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        type: 'line',
        yAxisID: 'y1',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Allie as a Daily Utility"
      subtitle="Becoming an indispensable part of family life through everyday usefulness"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat 
          value="10-100" 
          label="expected daily interactions per family"
          icon={<Activity className="text-indigo-500" />}
        />
        <Stat 
          value="Daily" 
          label="utility use pattern from our research"
          icon={<Zap className="text-amber-500" />}
        />
        <Stat 
          value="Essential" 
          label="position in family information ecosystem"
          icon={<Clock className="text-emerald-500" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <BarChart2 className="mr-2 text-indigo-600" size={24} />
            Why "Everyday Apps" Evolve Into Utilities
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Allie is following the proven trajectory from app to essential utility that families rely on every day.
          </p>
          
          <div className="space-y-3">
            <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <h4 className="font-medium text-gray-800 text-sm">Core Job is Perennial</h4>
              </div>
              <p className="text-xs text-gray-600 ml-7">
                Parenting logistics never stop. Allie off-loads the perpetual tasks of remembering, planning and coordinating family life.
              </p>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <h4 className="font-medium text-gray-800 text-sm">Friction → 0</h4>
              </div>
              <p className="text-xs text-gray-600 ml-7">
                Snap a school flyer or forward an email → Allie auto-creates events, reminders, document links. Parents do zero manual entry.
              </p>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <h4 className="font-medium text-gray-800 text-sm">Becomes Invisible Scaffolding</h4>
              </div>
              <p className="text-xs text-gray-600 ml-7">
                Allie ingests, organizes, reminds—even when parents forget to open the app. The family feels the loss if it's turned off.
              </p>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">4</span>
                </div>
                <h4 className="font-medium text-gray-800 text-sm">Self-Reinforcing Data Loop</h4>
              </div>
              <p className="text-xs text-gray-600 ml-7">
                Each document/survey augments the Family Knowledge Graph → smarter suggestions → more usage → richer graph.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <Zap className="mr-2" size={24} />
            Utility-First Approach
          </h3>
          
          <p className="text-gray-700 mb-4">
            Unlike task apps that get occasional use or "nice-to-have" family tools, Allie is designed to become
            an indispensable daily utility through our multi-pronged approach:
          </p>
          
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">1. Information Hub Strategy</h4>
              <p className="text-sm text-gray-700">
                By centralizing all critical family information (calendars, documents, activities, contacts)
                in one place with rich context, Allie becomes the go-to source for daily questions.
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">10-20×</p>
                  <p className="text-xs text-indigo-500">daily access</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">First</p>
                  <p className="text-xs text-indigo-500">information source</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Single</p>
                  <p className="text-xs text-indigo-500">source of truth</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Essential</p>
                  <p className="text-xs text-indigo-500">family tool</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">2. Proactive Notifications</h4>
              <p className="text-sm text-gray-700">
                Intelligent, contextual alerts delivered at the right moment drive habitual usage
                and create dependence on Allie's awareness of family needs.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Habitual</p>
                  <p className="text-xs text-indigo-500">usage pattern</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Context</p>
                  <p className="text-xs text-indigo-500">aware alerts</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">5-15</p>
                  <p className="text-xs text-indigo-500">daily interactions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">3. Conversational Interface</h4>
              <p className="text-sm text-gray-700">
                The AI chat interface makes interaction frictionless and handles complex requests
                that would require multiple steps in traditional apps.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Frictionless</p>
                  <p className="text-xs text-indigo-500">interactions</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">20-40</p>
                  <p className="text-xs text-indigo-500">chat messages/day</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Natural</p>
                  <p className="text-xs text-indigo-500">language interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card 
          title="More Utility Patterns" 
          icon={<Activity size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-gray-800 text-sm mb-1">Platform for Add-on Value</h4>
              <p className="text-xs text-gray-700">
                The same graph powers wardrobe audits, prescription re-fills, curated kid-gear commerce—driving LTV without extra CAC.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-gray-800 text-sm mb-1">Habit Frequency ≥ Daily</h4>
              <p className="text-xs text-gray-700">
                Parents interact with Allie for calendar glances, chat queries, habit nudges, doc capture—multiple times a day.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-gray-800 text-sm mb-1">Trust Compounded by Reliability</h4>
              <p className="text-xs text-gray-700">
                Proactive reminders, encrypted storage, explainable AI recommendations: reliability builds the "trusted third parent" persona.
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Precedent = Proof" 
          icon={<Zap size={24} />} 
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        >
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 text-sm mb-1">Calendars → Infrastructure</h4>
              <p className="text-xs text-gray-700">
                Google Calendar started as a tool; today 500M+ people rely on it hourly for notifications, shared scheduling, flight/pass sync.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 text-sm mb-1">Fin-tech apps → Utilities</h4>
              <p className="text-xs text-gray-700">
                Venmo/Cash App began as p2p novelties; now wage payouts, bill-split, crypto trades all flow through the same pipe.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 text-sm mb-1">Smart home hubs</h4>
              <p className="text-xs text-gray-700">
                Alexa/Google Home shifted from "cool voice toy" to always-on household interface for lighting, shopping, reminders.
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Allie's Thesis" 
          icon={<BarChart2 size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            Whenever a digital service removes high-frequency cognitive friction, aggregates unique user data, and reinvests that data into proactive help, it crosses the line from "app" to "utility."
          </p>
          <p className="text-gray-700 font-medium">
            Family mental-load management matches that pattern perfectly—and no incumbent has captured it.
          </p>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">The Utility Playbook in Action</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-medium flex items-center justify-center mr-2">1</div>
              <h4 className="font-medium text-indigo-700">Phase I – Daily Relief</h4>
            </div>
            <p className="text-sm text-indigo-900">
              Allie removes 5-10 micro-tasks/day (auto-filing docs, smart calendar layers). Parents feel immediate cognitive relief → high day-7 retention.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white font-medium flex items-center justify-center mr-2">2</div>
              <h4 className="font-medium text-purple-700">Phase II – Data Fly-wheel</h4>
            </div>
            <p className="text-sm text-purple-900">
              Continuous capture (voice, photo, email) populates the Knowledge Graph, letting Allie anticipate needs: shoe-size alerts, vaccine follow-ups, load-balance nudges.
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-medium flex items-center justify-center mr-2">3</div>
              <h4 className="font-medium text-amber-700">Phase III – Platform Monetization</h4>
            </div>
            <p className="text-sm text-amber-900">
              Once embedded, Allie can route commerce (second-hand clothing via Vinted, sports-gear bundles, tutoring bookings) directly inside chat—monetizing the trust and data without new acquisition spend.
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-indigo-700 font-medium">
            <Zap size={18} className="mr-1" />
            <span>Product-market fit isn't our goal. Daily necessity is.</span>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default AllieUtilitySlide;