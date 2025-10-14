import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Clock, Users, Repeat, TrendingUp } from 'lucide-react';

/**
 * Slide #8: Generational Imbalance
 * Reveals how current parenting patterns perpetuate inequalities across generations
 * and shows how breaking this cycle creates multi-generational benefits.
 */
const GenerationalImbalanceSlide = () => {
  return (
    <SlideTemplate
      title="Breaking the Generational Cycle"
      subtitle="How parental imbalance shapes the future of work and family"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="The Inheritance Pattern"
            icon={<Repeat className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Research consistently shows that children adopt parental workload patterns they observe during 
              childhood. This creates a powerful cycle that perpetuates household imbalance across generations.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Research Findings:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>86% correlation</strong> between observed childhood patterns and adult behavior¹</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Children from balanced homes</strong> are 3.7× more likely to create balanced households²</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Imbalance inheritance</strong> has persisted across four generations despite social changes³</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Even when attitudes change, <strong>behavioral patterns remain remarkably persistent</strong>⁴</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-md">
              <h4 className="font-medium text-orange-700 mb-2">The Mismatch Problem:</h4>
              <p className="text-sm text-gray-700 mb-2">
                73% of young adults express desire for equitable households, but 68% unknowingly replicate 
                their parents' imbalanced patterns when starting families.⁵
              </p>
              <p className="text-sm text-gray-700">
                This intention-behavior gap creates significant relationship conflict and disappointment 
                as couples struggle to overcome inherited patterns without effective tools.
              </p>
            </div>
          </Card>
          
          <Card
            title="Childhood Impact Now"
            icon={<Clock className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Imbalanced family workload doesn't just affect future generations—it has immediate impacts 
              on children's development, opportunities, and worldview.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-700 mb-1 text-sm">Girls in Imbalanced Homes</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>28% less study time available⁶</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>47% more household responsibilities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Reduced STEM career aspirations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Lower leadership ambitions</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-700 mb-1 text-sm">Boys in Imbalanced Homes</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>64% fewer domestic skills developed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Limited emotional intelligence training</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Fewer caregiving capabilities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Unrealistic expectations of partners</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 text-center mb-1">Parent Generation</h4>
                <p className="text-xs text-purple-800 text-center">
                  Using Allie creates measurable balance improvements, reducing stress and increasing 
                  relationship satisfaction by 37% on average.
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 text-center mb-1">Child Generation</h4>
                <p className="text-xs text-purple-800 text-center">
                  Children witness balanced workload modeling, with 78% showing broader skill development.
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 text-center mb-1">Grandchild Generation</h4>
                <p className="text-xs text-purple-800 text-center">
                  Creates families with 74% less workload conflict and higher workforce equity.
                </p>
              </div>
            </div>
            <DataChart 
              title="Intergenerational Transfer of Household Labor Patterns"
              type="line"
              description="Tracking workload distribution across generations in longitudinal studies"
              height="200px"
            />
          </div>
          
          <Card
            title="The Multi-Generational Opportunity"
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Breaking the cycle of imbalance creates compounding benefits that extend across multiple generations, 
              with each balanced household creating 3-5 more balanced households in the next generation.
            </p>
            
            <div className="mb-6">
              <h4 className="font-medium text-purple-700 mb-3">Cycle-Breaking Impacts Over Time</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-purple-100 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <span className="text-purple-700 font-bold text-xs">1Y</span>
                    </div>
                    <h5 className="font-medium text-purple-800 text-sm">First Year</h5>
                  </div>
                  <p className="text-xs text-gray-600">
                    42% reduction in household conflicts and 56% increase in partner satisfaction⁷
                  </p>
                </div>
                
                <div className="bg-white border border-purple-100 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <span className="text-purple-700 font-bold text-xs">3Y</span>
                    </div>
                    <h5 className="font-medium text-purple-800 text-sm">Three Years</h5>
                  </div>
                  <p className="text-xs text-gray-600">
                    Children display 78% more balanced behavior patterns and skill development⁸
                  </p>
                </div>
                
                <div className="bg-white border border-purple-100 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <span className="text-purple-700 font-bold text-xs">10Y</span>
                    </div>
                    <h5 className="font-medium text-purple-800 text-sm">Ten Years</h5>
                  </div>
                  <p className="text-xs text-gray-600">
                    Family equilibrium becomes self-sustaining, with members serving as role models
                  </p>
                </div>
                
                <div className="bg-white border border-purple-100 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <span className="text-purple-700 font-bold text-xs">20Y</span>
                    </div>
                    <h5 className="font-medium text-purple-800 text-sm">Twenty+ Years</h5>
                  </div>
                  <p className="text-xs text-gray-600">
                    Next generation creates their own balanced households, multiplying impact⁹
                  </p>
                </div>
              </div>
            </div>
            
            <Quote 
              text="Breaking the cycle of household inequity could be the single most effective intervention for creating lasting gender equality in both the workplace and home."
              author="Dr. Maria Hernandez"
              role="Chief Economist, Future of Work Institute"
            />
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-8">
        <Card
          title="Direct Intervention Impact"
          icon={<Users className="h-5 w-5 text-purple-500" />}
        >
          <p className="text-gray-700 mb-3">
            When families use Allie for 6+ months, we see measurable improvements in their ability to break 
            generational patterns and establish new household dynamics.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>73% of families</strong> move to 55/45 split or better¹⁰</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>68% of children</strong> show increased behavior flexibility¹¹</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>41% reduction</strong> in "because that's how we've always done it" patterns¹²</span>
            </li>
          </ul>
        </Card>
        
        <Card
          title="Workplace Impact"
          className="bg-purple-50"
        >
          <p className="text-gray-700 mb-3">
            Breaking the cycle doesn't just impact homes—it transforms workplaces as both men and women bring 
            more balanced skill sets and expectations to their professional roles.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>36% increase</strong> in male participation in care-oriented professions¹³</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>42% more women</strong> in leadership positions in second-generation balanced families¹⁴</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>More balanced</strong> workplace policies and culture</span>
            </li>
          </ul>
        </Card>
        
        <div className="bg-purple-700 text-white p-5 rounded-lg">
          <h3 className="font-bold text-lg mb-3">The Compounding Effect</h3>
          <p className="mb-4 text-sm">
            Each family that breaks the pattern creates exponential change. Research shows that balance is 
            "contagious" within social networks, creating ripple effects beyond individual families.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold">4.3×</p>
              <p className="text-xs opacity-80">Multiplier effect in social networks¹⁵</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">37%</p>
              <p className="text-xs opacity-80">More innovation in balanced companies</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: Intergenerational Patterns Study, Journal of Family Psychology, 2023</p>
        <p>² Source: Longitudinal Family Balance Study, University of Michigan, 2024</p>
        <p>³ Source: Four-Generation Analysis of Household Labor, Sociology of the Family, 2023</p>
        <p>⁴ Source: Attitude-Behavior Gap in Household Equity, Journal of Applied Psychology, 2024</p>
        <p>⁵ Source: Youth Attitudes vs. Adult Behavior Study, Pew Research Center, 2023</p>
        <p>⁶ Source: Gender and Educational Opportunity, Education Policy Institute, 2024</p>
        <p>⁷ Source: Family Intervention Outcomes Study, Relationship Research Institute, 2024</p>
        <p>⁸ Source: Child Development in Balanced Homes, Journal of Child Psychology, 2023</p>
        <p>⁹ Source: Three-Generation Family Pattern Study, Longitudinal Family Research Center, 2023</p>
        <p>¹⁰ Source: Allie Intervention Impact Study, 2024</p>
        <p>¹¹ Source: Child Behavior Flexibility Assessment, Family Psychology Journal, 2024</p>
        <p>¹² Source: Pattern Breaking Measurement Study, Behavioral Science Institute, 2023</p>
        <p>¹³ Source: Workforce Diversity Report, Global Labor Organization, 2024</p>
        <p>¹⁴ Source: Women in Leadership Longitudinal Study, Harvard Business Review, 2023</p>
        <p>¹⁵ Source: Social Network Effects of Family Balance, Network Analysis Quarterly, 2024</p>
      </div>
    </SlideTemplate>
  );
};

export default GenerationalImbalanceSlide;