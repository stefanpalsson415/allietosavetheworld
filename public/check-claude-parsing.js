// Check what Claude is parsing for "next Wednesday"
console.log('🤖 Testing Claude date parsing...');

const today = new Date();
console.log('Today is:', today.toDateString());

// Calculate next Wednesday
const daysUntilWednesday = (3 - today.getDay() + 7) % 7 || 7; // 3 = Wednesday
const nextWednesday = new Date(today);
nextWednesday.setDate(today.getDate() + daysUntilWednesday);

console.log('Next Wednesday should be:', nextWednesday.toDateString());
console.log('Which is:', nextWednesday.toISOString().split('T')[0]);

// Show what the AI processor should be getting
console.log('\n📱 The SMS says: "next Wednesday at 5pm"');
console.log('🤖 Claude should parse this as:', nextWednesday.toISOString().split('T')[0]);
console.log('⏰ With time: 17:00 (5pm)');
console.log('📅 Full ISO string should be:', nextWednesday.toISOString().split('T')[0] + 'T17:00:00');