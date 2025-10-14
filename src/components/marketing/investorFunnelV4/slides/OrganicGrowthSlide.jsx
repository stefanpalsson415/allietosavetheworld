import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, Quote } from './components';
import { Clock, MessageSquare, Lightbulb } from 'lucide-react';

/**
 * Slide #25: Organic Growth Bet
 * This slide explains Allie's strategy for organic growth through time savings,
 * becoming part of everyday vocabulary, and creating powerful "Aha!" moments.
 */
const OrganicGrowthSlide = () => {
  return (
    <SlideTemplate
      title="Our Organic Growth Strategy"
      subtitle="Building a utility that parents can't live without"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <Card
          title="Time Value Analysis"
          icon={<Clock className="h-6 w-6 text-purple-600" />}
          className="h-full"
        >
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">We turn usage into measurable time savings</h4>
            <p className="text-gray-700 mb-4">
              Our platform quantifies 12-15 hours of weekly time savings for typical families. This time has 
              both economic value and significant quality-of-life impact.
            </p>
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div>
                <p className="text-sm text-gray-500">Average weekly time saved</p>
                <p className="text-2xl font-bold text-purple-700">13.5 hrs</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Economic value (annually)</p>
                <p className="text-2xl font-bold text-purple-700">€8,450</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quality time increase</p>
                <p className="text-2xl font-bold text-purple-700">+37%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Retention when time tracked</p>
                <p className="text-2xl font-bold text-purple-700">94%</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Calendar "No Surprises" Value</h4>
            <p className="text-gray-700 mb-3">
              When we identify schedule conflicts, double-bookings, or missing calendar items before they happen, 
              we create high-value moments that drive sharing.
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <span className="bg-purple-200 text-purple-800 font-medium px-2.5 py-0.5 rounded-full mr-2">76%</span>
              <span>of users share Allie with others after experiencing a "save" moment¹</span>
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          <Card
            title="The 'Check Allie' Vernacular"
            icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
          >
            <p className="text-gray-700 mb-3">
              We want to make "check Allie" as part of everyday vocabulary like "google it" or "take an uber"
            </p>
            <p className="text-gray-700 mb-4">
              This happens naturally when Allie becomes the trusted source of family information. Our data shows 
              that after 6 weeks, 82% of users default to Allie for family questions instead of asking their partner.
            </p>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600 mb-1">Common "check Allie" questions:</p>
              <ul className="space-y-1 text-gray-700">
                <li className="flex items-start text-sm">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>"When is Sophie's next dentist appointment?"</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>"Do we have any plans this weekend?"</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>"Who's driving the kids to soccer on Thursday?"</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card
            title="Allie's 'Aha!' Moment"
            icon={<Lightbulb className="h-6 w-6 text-purple-600" />}
          >
            <Quote 
              text="I asked Allie — and it answered with everything I needed before I even opened another app."
              className="mb-4"
            />
            
            <div className="border-l-4 border-purple-200 pl-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">What exactly happens?</p>
              <ol className="space-y-2">
                <li className="text-sm text-gray-700">
                  <span className="font-medium text-purple-700 mr-1">1.</span>
                  Parent snaps a photo of a school newsletter in Chat or forwards the e-mail.
                </li>
                <li className="text-sm text-gray-700">
                  <span className="font-medium text-purple-700 mr-1">2.</span>
                  Within seconds Allie:
                  <ul className="pl-5 mt-1 space-y-1">
                    <li className="text-xs text-gray-600">• Extracts event date, cost, permission-slip deadline and what-to-bring list</li>
                    <li className="text-xs text-gray-600">• Creates a calendar event for the right child and attaches the PDF</li>
                    <li className="text-xs text-gray-600">• Sets a smart reminder ("Buy museum-trip lunch 2 days before")</li>
                    <li className="text-xs text-gray-600">• Surfaces a one-tap share link to the co-parent</li>
                  </ul>
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-700 italic">
              "Oh wow, that would have taken me ten minutes and I'd still worry I'd forget something."
            </p>
            <p className="text-right text-xs text-gray-500 mt-1">- Actual user feedback, March 2025</p>
          </Card>
        </div>
      </div>

      <div className="bg-purple-700 text-white p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4">Organic Growth Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold">2.3</p>
            <p className="text-sm opacity-80">Average referrals per paying user²</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">42%</p>
            <p className="text-sm opacity-80">Referral conversion rate to paid</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">€18</p>
            <p className="text-sm opacity-80">Organic customer acquisition cost</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">68%</p>
            <p className="text-sm opacity-80">Of new users come from organic sources</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>¹ Source: Allie User Behavior Analysis, April 2025</p>
        <p>² Based on early user testing in Stockholm and Boston metro areas</p>
      </div>
    </SlideTemplate>
  );
};

export default OrganicGrowthSlide;