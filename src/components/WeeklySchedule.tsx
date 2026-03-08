/**
 * Weekly schedule component displaying 7 themed days
 * Source: specs/001-unified-minimal-ui/spec.md FR-I01, FR-I02, FR-I03
 */

import React from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import { DEFAULT_SCHEDULE_THEMES, DAY_NAMES, getCurrentDayNumber } from '../utils/constants';
import './WeeklySchedule.css';

interface ScheduleDay {
  dayNumber: number;
  theme: string;
  description?: string;
}

/**
 * Weekly schedule grid with current day highlighted (FR-I03)
 */
export function WeeklySchedule() {
  const [scheduleData, isLoading] = useTable(tables.stream_schedule_day);
  const currentDay = getCurrentDayNumber();
  
  // Build schedule array, using defaults if no data
  const schedule: ScheduleDay[] = React.useMemo(() => {
    if (isLoading) {
      return DEFAULT_SCHEDULE_THEMES.map((item) => ({
        dayNumber: item.day,
        theme: item.theme,
        description: item.description,
      }));
    }
    
    // If we have real data, use it
    if (scheduleData && scheduleData.length > 0) {
      return DAY_NAMES.map((_, index) => {
        const dayNum = index + 1;
        const saved = scheduleData.find(d => d.dayNumber === dayNum);
        const defaultItem = DEFAULT_SCHEDULE_THEMES[index];
        return {
          dayNumber: dayNum,
          theme: saved?.theme || defaultItem.theme,
          description: saved?.description || defaultItem.description,
        };
      });
    }
    
    // Otherwise use defaults
    return DEFAULT_SCHEDULE_THEMES.map((item) => ({
      dayNumber: item.day,
      theme: item.theme,
      description: item.description,
    }));
  }, [scheduleData, isLoading]);
  
  return (
    <div className="weekly-schedule">
      <div className="schedule-grid">
        {schedule.map((day) => {
          const dayName = DAY_NAMES[day.dayNumber - 1];
          const isToday = day.dayNumber === currentDay;
          
          return (
            <div 
              key={day.dayNumber} 
              className={`schedule-day ${isToday ? 'current' : ''}`}
            >
              <div className="day-header">
                <span className="day-name">{dayName}</span>
                {isToday && <span className="today-badge">Today</span>}
              </div>
              <div className="day-theme">{day.theme}</div>
              {day.description && (
                <div className="day-description">{day.description}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
