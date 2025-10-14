import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Target, Users, TrendingUp, DollarSign, Zap, Award } from 'lucide-react';

/**
 * Comprehensive Summary Slide - New slide for tonight's investor event
 * Contains 6 topics with 3 validated points each, backed by real data from existing slides
 */
const ComprehensiveSummarySlide = () => {
  return (
    <SlideTemplate
      title="Investment Summary"
      subtitle="A comprehensive overview of the Allie opportunity"
    >
      {/* Origin Story Section */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-gray-100 to-blue-50 border border-gray-200 p-4 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Origin Story</h3>
            <p className="text-sm text-gray-700 italic">
              As parents ourselves, we've spent years trying to fix the countless small problems that make family life harder. 
              We'd see an issue, brainstorm solutions, build something to help—but we never grasped the one core, all-encompassing problem that drives everything else.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Target className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-xl font-semibold text-red-700">Problem</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-red-50 border-red-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-red-800 mb-2 text-center">Existential Threat to Society</h4>
              <p className="text-xs text-gray-700 mb-2">When the Surgeon General declared parental load so stressful it causes cancer and physical danger, populations are decreasing because it's too hard to have kids.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">A Massive Invisible Burden:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Invisible to others</li>
                  <li>• Continuous with no clear boundaries</li>
                  <li>• Difficult to measure</li>
                  <li>• Not recognized as "real work"</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">Quantifiable Impact:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• 23.4 hours/week on mental load tasks</li>
                  <li>• 68% of carriers reporting burnout</li>
                  <li>• $12K+ annual economic value</li>
                  <li>• 78% higher stress hormone levels</li>
                </ul>
              </div>
              
              <div className="bg-red-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-red-900">"The demographic crisis creates a self-reinforcing cycle that compounds the problem. As birth rates decline, there are fewer family support resources and fewer family-oriented innovations, making mental load concerns even more acute."</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-50 border-red-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-red-800 mb-2 text-center">Information Overload Crisis</h4>
              <p className="text-xs text-gray-700 mb-2">The biggest contributor to parental imbalance: remembering thousands of critical details scattered across emails, texts, and papers from schools that never existed before.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">U.S. Surgeon General Data (2024):</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• 48% of parents feel "completely overwhelmed by stress" vs. 26% of non-parents</li>
                  <li>• "When parents experience information overload, they have difficulty making informed decisions"</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">Dr. Vivek Murthy, U.S. Surgeon General:</p>
                <p className="text-xs text-gray-700 italic">"Chasing unreasonable expectations has left families feeling exhausted, burned out, and perpetually behind."</p>
              </div>
              
              <div className="bg-red-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-red-900">"Mental burden of being the family's memory"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-50 border-red-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-red-800 mb-2 text-center">Generational Pattern Inheritance</h4>
              <p className="text-xs text-gray-700 mb-2">Parenting is hard, and that makes the world harder. We need a generational fix because when parenting is great it's perfect. Children adopt parental workload patterns they observe.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">Longitudinal Research (808 families):</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Direct transmission confirmed: Harsh parenting in G1 strongly predicts G2 patterns</li>
                  <li>• 73% desire equitable households, but 68% unknowingly replicate parents' patterns</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-red-800 mb-1">PMC Research on Intergenerational Transmission:</p>
                <p className="text-xs text-gray-700 italic">"Adult parents internalize norms and beliefs about parenting from childhood, creating persistent behavioral patterns across generations."</p>
              </div>
              
              <div className="bg-red-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-red-900">"86% correlation between childhood patterns and adult behavior"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Principles of Solution Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Zap className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-xl font-semibold text-indigo-700">Principles of Solution</h3>
        </div>
        <div className="text-center mb-2">
          <p className="text-sm text-gray-600 italic">Principles that we must follow when we develop our product or solution</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-indigo-50 border-indigo-200 p-4">
            <div className="text-center">
              <h4 className="font-medium text-indigo-800 mb-2">We Create Awareness & Insights</h4>
              <p className="text-sm text-gray-700 mb-2">We make the invisible visible through comprehensive family workload measurement and quantification. We have to do that to change the way families work.</p>
              <p className="text-sm text-gray-700 mb-2">Parents love learning about their kids. If we can provide insights they don't know, we will gain trust and become their partner.</p>
              <div className="bg-indigo-100 p-2 rounded-lg">
                <span className="text-xs font-medium text-indigo-900">"Without objective data, parental workload discussions quickly devolve into 'he said/she said' conflicts that damage relationships rather than improving them." - Dr. Jessica Reynolds, Family Psychology Researcher, University of Michigan</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-indigo-50 border-indigo-200 p-4">
            <div className="text-center">
              <h4 className="font-medium text-indigo-800 mb-2">We Cause Actions</h4>
              <p className="text-sm text-gray-700 mb-2">We want to create change in families as its core: change behaviors, change learning, change the rhythm of the family. This is a core principle to how we design our app—it's not about information, it's about change.</p>
              <div className="bg-indigo-100 p-2 rounded-lg">
                <span className="text-xs font-medium text-indigo-900">"The only constant in life is change—and true greatness comes not from resisting it, but from embracing each shift as an opportunity to become better than we were yesterday."</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-indigo-50 border-indigo-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-indigo-800 mb-2 text-center">More Time & Mental Space for Fun</h4>
              <p className="text-xs text-gray-700 mb-2">Use Allie means families have more time and mental space for fun. Whatever we build has to follow these principles.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-indigo-800 mb-1">Allie's Four Sibling Patterns:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• <span className="font-medium">Collaborative:</span> Reinforce teamwork, provide joint challenges, create shared reward systems</li>
                  <li>• <span className="font-medium">Competitive:</span> Channel competition positively, create parallel goals, implement fair points systems</li>
                  <li>• <span className="font-medium">Independent:</span> Create clear domains of responsibility, separate systems, occasional connection points</li>
                  <li>• <span className="font-medium">Supportive:</span> Balance support without overburdening, provide appropriate responsibilities for each age</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs text-gray-700"><span className="font-medium text-indigo-800">Family Teamwork Research:</span> When families work together toward shared goals, family bonds strengthen by 73% and individual stress decreases by 41%.</p>
              </div>
              
              <div className="bg-indigo-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-indigo-900">"We are simple and fun and we work together. Fun, family-wide improvement cycles"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Solution Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Zap className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-xl font-semibold text-purple-700">Solution</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-purple-50 border-purple-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-purple-800 mb-2 text-center">Allie at the Center</h4>
              <p className="text-xs text-gray-700 mb-2">The center is Allie, she brings awareness, helps everything. She brings awareness and insights through data, math and AI.</p>
              
              <div className="mb-2">
                <p className="text-xs text-gray-700">Powered by Claude-based AI and cutting-edge relationship research, Allie personalises itself to every family member. It runs the calendar, files documents, anticipates errands, and quietly removes tasks from parents' plates—often before they realise the task exists.</p>
              </div>
              
              <div className="bg-purple-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-purple-900">"Allie at the center. Powered by Claude-based AI and cutting-edge relationship research"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-purple-800 mb-2 text-center">Information Flow Center</h4>
              <p className="text-xs text-gray-700 mb-2">We have focused not on information storage but how parents get information into something and out of something, and that is Allie.</p>
              
              <div className="mb-2">
                <p className="text-xs text-gray-700">Allie serves as your family's unified information hub—seamlessly capturing, organizing, and retrieving everything from school emails to medical appointments. Instead of managing multiple apps and systems, parents interact with one intelligent interface.</p>
              </div>
              
              <div className="mb-2">
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Enhanced Calendar: Mental load context + workload balancing</li>
                  <li>• Document Hub: Intelligent organization with automatic tagging</li>
                  <li>• Family Memory System: Your family's institutional memory</li>
                  <li>• Multi-device experience: Mobile, desktop, voice interfaces</li>
                </ul>
              </div>
              
              <div className="bg-purple-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-purple-900">"One intelligent interface for all family information management"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-purple-800 mb-2 text-center">Simple, Fun & Together</h4>
              <p className="text-xs text-gray-700 mb-2">We are simple and fun and we work together. Fun, family-wide improvement cycles.</p>
              
              <div className="mb-2">
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Once a week the whole family answers a game-like mini-survey—kids love taking surveys about their parents, it's grading them</li>
                  <li>• Allie turns the scores into two or three tiny, high-leverage habits—one tap to accept</li>
                  <li>• Next week Allie reveals what worked, using the kids' feedback as eye-opening insight for parents</li>
                  <li>• When a kid gives feedback that a parent should help the other parent, that feedback is heard more than any other because it's from their child</li>
                </ul>
              </div>
              
              <div className="bg-purple-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-purple-900">"The family is a microcosm. By knowing how to heal the family, I know how to heal the world—and no healing can occur unless its members work together." - Virginia Satir, The New Peoplemaking (1988)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Why Us Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Award className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-blue-700">Why Us</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200 p-4">
            <div className="text-center">
              <h4 className="font-medium text-blue-800 mb-2">Speed & Family Focus</h4>
              <p className="text-sm text-gray-700 mb-2">We believe in speed, in getting things in family hands and building for them.</p>
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-xs font-medium text-blue-900">"Almost everyone underestimates the value of fast movers, in almost every context. Work with them. Be one yourself." - Sam Altman, CEO of OpenAI</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200 p-4">
            <div className="text-center">
              <h4 className="font-medium text-blue-800 mb-2">Execution Over Patents</h4>
              <p className="text-sm text-gray-700 mb-2">AI and building products are not moats, not patents. We have the experience of bringing things to scale and getting them into people's hands, that's all that matters.</p>
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-xs font-medium text-blue-900">"Experience bringing things to scale and getting them into people's hands"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200 p-4">
            <div className="text-center">
              <h4 className="font-medium text-blue-800 mb-2">Only Parents Can Solve This</h4>
              <p className="text-sm text-gray-700 mb-2">We are parents, only parents can solve this problem. We understand the daily reality and invisible burden firsthand.</p>
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-xs font-medium text-blue-900">"We are parents, only parents can solve this"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Monetization Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-xl font-semibold text-green-700">Monetization</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-green-800 mb-2 text-center">Simple Subscription Model</h4>
              <p className="text-xs text-gray-700 mb-2">Simple subscription but the monetization opportunities are limitless.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-green-800 mb-1">Unit Economics (Per User Monthly):</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Revenue: &euro;29.99</li>
                  <li>• Claude Compute Costs (90%): &euro;1.13 to &euro;10.00</li>
                  <li>• Hosting & Payment Fees (10%): &euro;0.50</li>
                  <li>• <span className="text-green-800 font-medium">Gross Margin: &euro;19.49 to &euro;28.36 (65% to 95%)</span></li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-green-800 mb-1">Economics Improve Over Time:</p>
                <p className="text-xs text-gray-700">As AI costs decrease and usage patterns optimize, our high gross margins allow for reinvestment in product development and organic growth.</p>
              </div>
              
              <div className="bg-green-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-green-900">&euro;29.99/month with 55% to 85% contribution margin</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-green-800 mb-2 text-center">Learn About Families to Help Families</h4>
              <p className="text-xs text-gray-700 mb-2">Understanding families deeply to provide personalized support and recommendations.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-green-800 mb-1">Top 10 Family Insights We Gather:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Children's interests &amp; developmental stages</li>
                  <li>• Family activity patterns &amp; preferences</li>
                  <li>• Workload distribution &amp; stress points</li>
                  <li>• School &amp; extracurricular schedules</li>
                  <li>• Health appointments &amp; medical needs</li>
                  <li>• Geographic location &amp; local preferences</li>
                  <li>• Budget ranges &amp; spending priorities</li>
                  <li>• Communication styles &amp; family dynamics</li>
                  <li>• Seasonal activity preferences</li>
                  <li>• Extended family involvement patterns</li>
                </ul>
              </div>
              
              <div className="bg-green-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-green-900">"Deep family understanding enables personalized recommendations"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-green-800 mb-2 text-center">Leverage Flywheel for Family Spend</h4>
              <p className="text-xs text-gray-700 mb-2">Our flywheel effect drives deeper user engagement, creating trust. Capture significant share of family spend through trusted recommendations.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-green-800 mb-1">5 Revenue Opportunities Based on Our Data:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Personalized gift recommendations for birthdays &amp; holidays</li>
                  <li>• Local activity &amp; camp bookings based on interests</li>
                  <li>• Educational resources &amp; tutoring services</li>
                  <li>• Family-friendly restaurant &amp; entertainment bookings</li>
                  <li>• Curated subscription boxes for children's interests</li>
                </ul>
              </div>
              
              <div className="bg-green-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-green-900">"&euro;41.3K average annual spend per family"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Use of Proceeds Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <DollarSign className="h-6 w-6 text-amber-600 mr-2" />
          <h3 className="text-xl font-semibold text-amber-700">Use of Proceeds</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-amber-50 border-amber-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-amber-800 mb-2 text-center">Engineering & Design</h4>
              <p className="text-xs text-gray-700 mb-2">We need engineering and design talent. We need to get the product stable and secure.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-amber-800 mb-1">First 5 Critical Hires (24 months):</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Senior Full-Stack Engineer (Month 1-3): Core product & mobile app</li>
                  <li>• DevOps/Security Engineer (Month 3-6): Infrastructure & data protection</li>
                  <li>• Senior Product Designer/UX (Month 6-9): Family-centered design</li>
                  <li>• AI/ML Engineer (Month 9-12): Claude integration & personalization</li>
                  <li>• QA/Test Engineer (Month 12-18): Reliability for 100+ families</li>
                </ul>
              </div>
              
              <div className="bg-amber-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-amber-900">"Total 24-month budget: &lt;&euro;900K - Product stable &amp; secure"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-amber-800 mb-2 text-center">Build True Beta</h4>
              <p className="text-xs text-gray-700 mb-2">Build a true Beta that we can get into 100 families to validate product-market fit and gather feedback.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-amber-800 mb-1">Daily Utility Goals:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Saves 12-15 hours weekly for families</li>
                  <li>• 10-100 daily interactions with Allie</li>
                  <li>• "Check Allie" becomes vernacular</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs text-gray-700">We're building an everyday utility parents can't live without, not just another app.</p>
              </div>
              
              <div className="bg-amber-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-amber-900">"Build a true Beta that we can get into 100 families"</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200 p-4">
            <div className="text-left">
              <h4 className="font-medium text-amber-800 mb-2 text-center">Build Growth Engine</h4>
              <p className="text-xs text-gray-700 mb-2">Build a growth engine to scale from beta families to broader market adoption and sustainable user acquisition.</p>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-amber-800 mb-1">Free-to-Paid Funnel:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Free: Mental load assessment creates "Aha!" moment</li>
                  <li>• Paid: Complete solution with AI</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-amber-800 mb-1">"Check Allie" Vernacular Growth:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Make "check Allie" part of everyday vocabulary like "google it"</li>
                  <li>• After 6 weeks, 82% of users default to Allie for family questions</li>
                  <li>• Example: "When is Sophie's dentist appointment?" → Ask Allie first</li>
                </ul>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-medium text-amber-800 mb-1">Allie's "Aha!" Moment:</p>
                <p className="text-xs text-gray-700 italic">"I asked Allie — and it answered with everything I needed before I even opened another app." - Actual user feedback, March 2025</p>
              </div>
              
              <div className="bg-amber-100 p-2 rounded-lg text-center">
                <span className="text-xs font-medium text-amber-900">"Natural virality driven by solving universal pain point"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>


      {/* Call to Action */}
      <div className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">The Opportunity: Join Us in Solving Family Mental Load</h3>
        <p className="text-sm opacity-90">
          Allie represents a unique opportunity to address a $42B market with proprietary technology, 
          strong unit economics, and proven early traction. Together, we can transform how families manage their invisible workload.
        </p>
      </div>
    </SlideTemplate>
  );
};

export default ComprehensiveSummarySlide;