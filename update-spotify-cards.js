/**
 * Script to update the ChoreAndRewardAdminTab component to use Spotify-style cards
 */

const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'src/components/dashboard/tabs/ChoreAndRewardAdminTab.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Update the chore card section
content = content.replace(
  /<div\s+key=\{chore\.id\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g,
  `<div 
    key={chore.id} 
    className={\`relative rounded-lg overflow-hidden \${
      !chore.isActive && 'opacity-60'
    }\`}
  >
    {/* SpotifyChoreCard */}
    <SpotifyChoreCard 
      chore={{
        ...chore,
        title: chore.title,
        bucksAwarded: chore.bucksReward || chore.rewardValue,
        status: 'pending'
      }}
      disabled={true}
    />
    
    {/* Admin controls overlay */}
    <div className="absolute top-2 right-2 z-20 flex space-x-1 bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-md">
      <button
        onClick={() => {
          setChoreToEdit(chore);
          setShowEditChoreModal(true);
        }}
        className="p-1.5 bg-white rounded-full text-gray-600 hover:text-blue-700 shadow-sm"
        title="Edit"
      >
        <Edit3 size={14} />
      </button>
      <button
        onClick={() => toggleChoreActive(chore.id, !chore.isActive)}
        className={\`p-1.5 rounded-full shadow-sm \${
          chore.isActive
            ? 'bg-white text-green-500 hover:text-green-700' 
            : 'bg-white text-gray-400 hover:text-gray-600'
        }\`}
        title={chore.isActive ? 'Deactivate' : 'Activate'}
      >
        {chore.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
      </button>
    </div>
  </div>`
);

// Update the reward card section
content = content.replace(
  /<div\s+key=\{reward\.id\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g,
  `<div 
    key={reward.id} 
    className={\`relative rounded-lg overflow-hidden \${
      !reward.isActive && 'opacity-60'
    }\`}
  >
    {/* SpotifyRewardCard */}
    <SpotifyRewardCard 
      reward={{
        ...reward,
        title: reward.title,
        price: reward.bucksPrice || reward.price
      }}
      disabled={true}
    />
    
    {/* Admin controls overlay */}
    <div className="absolute top-2 right-2 z-20 flex space-x-1 bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-md">
      <button
        onClick={() => {
          setRewardToEdit(reward);
          setShowEditRewardModal(true);
        }}
        className="p-1.5 bg-white rounded-full text-gray-600 hover:text-blue-700 shadow-sm"
        title="Edit"
      >
        <Edit3 size={14} />
      </button>
      <button
        onClick={() => toggleRewardActive(reward.id, !reward.isActive)}
        className={\`p-1.5 rounded-full shadow-sm \${
          reward.isActive
            ? 'bg-white text-green-500 hover:text-green-700' 
            : 'bg-white text-gray-400 hover:text-gray-600'
        }\`}
        title={reward.isActive ? 'Deactivate' : 'Activate'}
      >
        {reward.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
      </button>
    </div>
  </div>`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated ChoreAndRewardAdminTab.jsx with Spotify-style cards!');