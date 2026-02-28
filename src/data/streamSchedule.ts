export interface ScheduleEntry {
  day: string;
  time: string;
  game: string;
  type: 'live' | 'scheduled' | 'special';
  description?: string;
}

export const streamSchedule: ScheduleEntry[] = [
  {
    day: 'Monday',
    time: '7:00 PM EST',
    game: 'Variety Night',
    type: 'scheduled',
    description: 'Community picks what we play!',
  },
  {
    day: 'Wednesday',
    time: '7:00 PM EST',
    game: 'Competitive Wednesday',
    type: 'scheduled',
    description: 'Ranked games & viewer challenges',
  },
  {
    day: 'Friday',
    time: '8:00 PM EST',
    game: 'New Release Friday',
    type: 'special',
    description: 'First looks at new games',
  },
  {
    day: 'Saturday',
    time: '3:00 PM EST',
    game: 'Chill Stream',
    type: 'scheduled',
    description: 'Story games & hangout vibes',
  },
  {
    day: 'Saturday',
    time: '9:00 PM EST',
    game: 'Late Night Gaming',
    type: 'special',
    description: 'Horror games & chaos',
  },
];

export const getNextStream = (): ScheduleEntry | null => {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[now.getDay()];
  
  // Find next scheduled stream
  const todayStreams = streamSchedule.filter(s => s.day === currentDay);
  const futureStreams = streamSchedule.filter(s => {
    const dayIndex = dayNames.indexOf(s.day);
    return dayIndex > now.getDay();
  });
  
  return todayStreams[0] || futureStreams[0] || streamSchedule[0];
};
