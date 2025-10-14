const defaultChores = [
  {
    title: "Feed doggies",
    description: "Feed the dogs their morning meal and refresh their water",
    timeOfDay: "morning",
    rewardValue: 1,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Leave for school 15 min before class starts",
    description: "Be ready and out the door 15 minutes before school starts",
    timeOfDay: "morning",
    rewardValue: 1,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  {
    title: "Brush teeth for 120 seconds",
    description: "Brush teeth thoroughly for a full 120 seconds with toothpaste",
    timeOfDay: "morning",
    rewardValue: 1,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "30 minutes of art or music",
    description: "Spend 30 minutes practicing art or playing a musical instrument",
    timeOfDay: "afternoon",
    rewardValue: 3,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "30 minutes of homework",
    description: "Complete at least 30 minutes of assigned homework",
    timeOfDay: "afternoon",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  {
    title: "Take a dog for a walk",
    description: "Take one of the dogs for a 15-minute walk outside",
    timeOfDay: "afternoon",
    rewardValue: 2,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "15 minutes of Swedish",
    description: "Practice Swedish language skills for 15 minutes",
    timeOfDay: "afternoon",
    rewardValue: 3,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Tidy room before bed",
    description: "Clean up room, put away toys and belongings before bedtime",
    timeOfDay: "evening",
    rewardValue: 2,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Cook dinner",
    description: "Prepare dinner for the family with supervision",
    timeOfDay: "evening",
    rewardValue: 5,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Help Papa with dinner",
    description: "Assist with meal preparation for dinner",
    timeOfDay: "evening",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Help set the table",
    description: "Set the table with plates, utensils, and cups for family dinner",
    timeOfDay: "evening",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Clear the table after dinner",
    description: "Clear dishes and clean the table after the family meal",
    timeOfDay: "evening",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Bathe dog",
    description: "Help bathe one of the family dogs",
    timeOfDay: "anytime",
    rewardValue: 3,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Put clothes away",
    description: "Fold clean clothes and put them in the proper drawers/closet",
    timeOfDay: "anytime",
    rewardValue: 2,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Recycling",
    description: "Sort and take out recyclable items",
    timeOfDay: "anytime",
    rewardValue: 3,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "ParentLoad Survey",
    description: "Complete the family survey about the week",
    timeOfDay: "anytime",
    rewardValue: 2,
    isRequired: true,
    recurrence: "weekly",
    daysOfWeek: ["Friday"]
  },
  {
    title: "Read for 15 min with Tegner",
    description: "Read together with Tegner for at least 15 minutes",
    timeOfDay: "afternoon",
    rewardValue: 3,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Book Report",
    description: "Write a short report about a book you've read",
    timeOfDay: "anytime",
    rewardValue: 20,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Write a letter to a family member",
    description: "Write and prepare a letter to send to a relative",
    timeOfDay: "anytime",
    rewardValue: 5,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Run errand",
    description: "Help with a specific errand or task",
    timeOfDay: "anytime",
    rewardValue: 5,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Shower",
    description: "Take a complete shower",
    timeOfDay: "anytime",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "One hour of sports or music lesson",
    description: "Participate in an hour-long class or practice session",
    timeOfDay: "afternoon",
    rewardValue: 2,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Clean a room",
    description: "Thoroughly clean and organize a room in the house",
    timeOfDay: "anytime",
    rewardValue: 4,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Yard cleanup",
    description: "Help tidy the yard, garden, or outdoor space",
    timeOfDay: "anytime",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Match socks",
    description: "Sort and match all the clean socks from laundry",
    timeOfDay: "anytime",
    rewardValue: 3,
    isRequired: true,
    recurrence: "daily",
    daysOfWeek: []
  },
  {
    title: "Load the dishwasher and clean the sink",
    description: "Load dirty dishes into the dishwasher and clean the kitchen sink",
    timeOfDay: "evening",
    rewardValue: 2,
    isRequired: false,
    recurrence: "daily",
    daysOfWeek: []
  }
];

export default defaultChores;