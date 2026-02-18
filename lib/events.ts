export interface Event {
  id: string
  name: string
  category: 'technical' | 'non-technical'
  description: string
  longDescription: string
  image: string
  date: string
  time: string
  venue: string
  /**
   * Per-person registration fee (used for both solo and team events).
   */
  registrationFee: number
  prizePool: number
  maxParticipants: number
  registeredCount: number
  rules: string[]
  prizes: {
    position: string
    amount: number
  }[]

  /**
   * Team registration metadata.
   * If false/undefined, event is treated as a solo event.
   */
  isTeamEvent?: boolean
  /**
   * Minimum allowed team size (including leader) for team events.
   */
  teamSizeMin?: number
  /**
   * Maximum allowed team size (including leader) for team events.
   */
  teamSizeMax?: number
}

export const events: Event[] = [
  {
    id: '1',
    name: 'CodeStorm Hackathon',
    category: 'technical',
    description: '24-hour hackathon to build innovative solutions',
    longDescription:
      "Join our flagship 24-hour hackathon where innovation meets execution. Collaborate with talented developers, designers, and innovators to build the next big thing. With a prize pool of ₹2,00,000 and mentorship from industry experts, this is your chance to showcase your skills.",
    image: '/images/hackathon.jpg',
    date: 'March 15-16, 2024',
    time: '10:00 AM - 10:00 AM (Next Day)',
    venue: 'Main Auditorium',
    registrationFee: 67,
    prizePool: 200000,
    maxParticipants: 150,
    registeredCount: 87,
    // Teams must consist of 2-4 members
    isTeamEvent: true,
    teamSizeMin: 2,
    teamSizeMax: 4,
    rules: [
      'Teams must consist of 2-4 members',
      'Code must be original and developed during the hackathon',
      'All source code must be submitted on GitHub',
      'Presentation should not exceed 5 minutes',
    ],
    prizes: [
      { position: '1st Prize', amount: 100000 },
      { position: '2nd Prize', amount: 60000 },
      { position: '3rd Prize', amount: 40000 },
    ],
  },
  {
    id: '2',
    name: 'BattleBots Arena',
    category: 'technical',
    description: 'Design and battle your autonomous robots',
    longDescription:
      "Build and battle your custom robots in our arena! Compete in multiple weight categories and showcase your robotics and programming expertise. Whether it's combat or sumo wrestling, test your engineering skills against the best.",
    image: '/images/robotics.jpg',
    date: 'March 14, 2024',
    time: '2:00 PM onwards',
    venue: 'Engineering Courtyard',
    registrationFee: 89,
    prizePool: 150000,
    maxParticipants: 60,
    registeredCount: 32,
    rules: [
      'Robot weight must be within specified limits',
      'Only standard components allowed',
      'Safety inspection is mandatory',
      'Match duration: 5 minutes per battle',
    ],
    prizes: [
      { position: '1st Prize', amount: 75000 },
      { position: '2nd Prize', amount: 50000 },
      { position: '3rd Prize', amount: 25000 },
    ],
  },
  {
    id: '3',
    name: 'Gaming Tournament',
    category: 'non-technical',
    description: 'Compete in multiple gaming titles for glory',
    longDescription:
      "Test your gaming skills in our multi-game tournament. From competitive FPS to strategy games, participate in your favorite titles and win prizes. Both individual and team events available.",
    image: '/images/gaming.jpg',
    date: 'March 14-15, 2024',
    time: '11:00 AM onwards',
    venue: 'Gaming Arena',
    registrationFee: 55,
    prizePool: 100000,
    maxParticipants: 200,
    registeredCount: 145,
    rules: [
      'Standard gaming mouse and keyboard allowed',
      'No external controllers unless specified',
      'Fair play is mandatory',
      'Final match will be streamed live',
    ],
    prizes: [
      { position: '1st Prize', amount: 50000 },
      { position: '2nd Prize', amount: 30000 },
      { position: '3rd Prize', amount: 20000 },
    ],
  },
  {
    id: '4',
    name: 'UI/UX Design Challenge',
    category: 'technical',
    description: 'Design innovative user experiences',
    longDescription:
      "Showcase your design prowess by solving real-world design challenges. Create beautiful, functional interfaces that users will love. Bring your creativity and user empathy to the design table.",
    image: '/images/design.jpg',
    date: 'March 16, 2024',
    time: '9:00 AM onwards',
    venue: 'Design Studio',
    registrationFee: 72,
    prizePool: 80000,
    maxParticipants: 80,
    registeredCount: 54,
    rules: [
      'Individual participation only',
      'Designs must be original',
      'Adobe XD or Figma files required',
      'Submission deadline: 2 hours from start',
    ],
    prizes: [
      { position: '1st Prize', amount: 40000 },
      { position: '2nd Prize', amount: 25000 },
      { position: '3rd Prize', amount: 15000 },
    ],
  },
  {
    id: '5',
    name: 'Web Development Sprint',
    category: 'technical',
    description: 'Build full-stack web applications',
    longDescription:
      "Race against the clock to build a complete web application. From frontend to backend, database to deployment - showcase your full-stack development skills in this fast-paced competition.",
    image: '/images/web-dev.jpg',
    date: 'March 15, 2024',
    time: '12:00 PM onwards',
    venue: 'Tech Lab',
    registrationFee: 94,
    prizePool: 120000,
    maxParticipants: 100,
    registeredCount: 67,
    // Teams of 1-3 allowed (treat as team event with min 1, max 3)
    isTeamEvent: true,
    teamSizeMin: 1,
    teamSizeMax: 3,
    rules: [
      'Teams of 1-3 allowed',
      'Any framework or technology allowed',
      'Working demo required',
      'Code must be deployed online',
    ],
    prizes: [
      { position: '1st Prize', amount: 60000 },
      { position: '2nd Prize', amount: 40000 },
      { position: '3rd Prize', amount: 20000 },
    ],
  },
  {
    id: '6',
    name: 'Esports Championship',
    category: 'non-technical',
    description: 'Battle for supremacy in MOBA tournaments',
    longDescription:
      "Compete in the ultimate esports showdown! Team up and battle it out on the biggest stages. Professional-grade gaming setup and live streaming for all matches.",
    image: '/images/esports.jpg',
    date: 'March 14-15, 2024',
    time: '3:00 PM onwards',
    venue: 'Esports Arena',
    registrationFee: 78,
    prizePool: 180000,
    maxParticipants: 120,
    registeredCount: 98,
    // Teams must have 5 members
    isTeamEvent: true,
    teamSizeMin: 5,
    teamSizeMax: 5,
    rules: [
      'Teams must have 5 members',
      'Standard game client only',
      'No cheating or hacking',
      'Sportsmanship required',
    ],
    prizes: [
      { position: '1st Prize', amount: 100000 },
      { position: '2nd Prize', amount: 60000 },
      { position: '3rd Prize', amount: 20000 },
    ],
  },
];
