import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const countries = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+44', country: 'UK', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+380', country: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+40', country: 'RO', flag: '🇷🇴', name: 'Romania' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+93', country: 'AF', flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '+376', country: 'AD', flag: '🇦🇩', name: 'Andorra' },
  { code: '+244', country: 'AO', flag: '🇦🇴', name: 'Angola' },
  { code: '+374', country: 'AM', flag: '🇦🇲', name: 'Armenia' },
  { code: '+994', country: 'AZ', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+375', country: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: '+501', country: 'BZ', flag: '🇧🇿', name: 'Belize' },
  { code: '+229', country: 'BJ', flag: '🇧🇯', name: 'Benin' },
  { code: '+975', country: 'BT', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+387', country: 'BA', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
  { code: '+267', country: 'BW', flag: '🇧🇼', name: 'Botswana' },
  { code: '+673', country: 'BN', flag: '🇧🇳', name: 'Brunei' },
  { code: '+359', country: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+226', country: 'BF', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+257', country: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: '+855', country: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+237', country: 'CM', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+385', country: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+357', country: 'CY', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+372', country: 'EE', flag: '🇪🇪', name: 'Estonia' },
  { code: '+251', country: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+679', country: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: '+995', country: 'GE', flag: '🇬🇪', name: 'Georgia' },
  { code: '+233', country: 'GH', flag: '🇬🇭', name: 'Ghana' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+852', country: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '+354', country: 'IS', flag: '🇮🇸', name: 'Iceland' },
  { code: '+98', country: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: '+964', country: 'IQ', flag: '🇮🇶', name: 'Iraq' },
  { code: '+876', country: 'JM', flag: '🇯🇲', name: 'Jamaica' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '+7', country: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+996', country: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+856', country: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: '+371', country: 'LV', flag: '🇱🇻', name: 'Latvia' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+231', country: 'LR', flag: '🇱🇷', name: 'Liberia' },
  { code: '+218', country: 'LY', flag: '🇱🇾', name: 'Libya' },
  { code: '+423', country: 'LI', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+370', country: 'LT', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+352', country: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+853', country: 'MO', flag: '🇲🇴', name: 'Macao' },
  { code: '+389', country: 'MK', flag: '🇲🇰', name: 'North Macedonia' },
  { code: '+261', country: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+960', country: 'MV', flag: '🇲🇻', name: 'Maldives' },
  { code: '+356', country: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: '+373', country: 'MD', flag: '🇲🇩', name: 'Moldova' },
  { code: '+377', country: 'MC', flag: '🇲🇨', name: 'Monaco' },
  { code: '+976', country: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+382', country: 'ME', flag: '🇲🇪', name: 'Montenegro' },
  { code: '+95', country: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panama' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+381', country: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: '+386', country: 'SI', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+963', country: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: '+886', country: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+992', country: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+255', country: 'TZ', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+216', country: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+993', country: 'TM', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+256', country: 'UG', flag: '🇺🇬', name: 'Uganda' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+998', country: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+967', country: 'YE', flag: '🇾🇪', name: 'Yemen' },
  { code: '+260', country: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', country: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' }
];

const CountryCodePicker = ({ value = '+1', onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  const selectedCountry = countries.find(c => c.code === value) || countries[0];

  // Filter countries based on search
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery) ||
    country.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-0 py-2 bg-transparent border-0 border-b border-b-gray-200 text-gray-700 font-roboto focus:outline-none focus:border-b-2 focus:border-black transition-all hover:border-b-gray-400"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="font-medium">{selectedCountry.code}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Country or code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code + country.country}
                  onClick={() => handleSelect(country)}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="font-medium text-gray-900">{country.code}</span>
                  <span className="text-gray-600">{country.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodePicker;