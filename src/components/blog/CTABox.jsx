// CTABox.jsx - Call-to-action box for blog posts
// Encourages readers to try Allie after learning about features

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CTABox - Call-to-action box with signup/trial link
 */
function CTABox() {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-8 text-white text-center my-8">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to Reduce Your Mental Load?
        </h3>
        <p className="text-lg mb-6 text-orange-100">
          Experience AI-powered family management that actually works.
          Join thousands of families reclaiming balance with Allie.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="inline-block bg-white text-orange-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your Free Trial →
          </Link>
          <Link
            to="/balance-quiz"
            className="inline-block bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-orange-600 transition-colors"
          >
            Take Balance Quiz
          </Link>
        </div>
        <p className="text-sm mt-4 text-orange-100">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </div>
  );
}

export default CTABox;
