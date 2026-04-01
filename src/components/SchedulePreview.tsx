import React from "react";
import { streamSchedule, ScheduleEntry } from "../data/streamSchedule";
import "./SchedulePreview.css";

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getEventsForDay(dayName: string): ScheduleEntry[] {
  return streamSchedule.filter((s) => s.day === dayName);
}

export default function SchedulePreview() {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <aside className="schedule-preview" aria-label="Upcoming schedule">
      <div className="schedule-header">
        <h3>Next 7 Days</h3>
        <div className="schedule-sub">Upcoming streams & events</div>
      </div>

      <ul className="schedule-list">
        {days.map((d) => {
          const name = dayNames[d.getDay()];
          const events = getEventsForDay(name);
          return (
            <li className="schedule-day" key={d.toISOString()}>
              <div className="day-meta">
                <div className="day-name">{formatDate(d)}</div>
                <div className="day-name-small">{name}</div>
              </div>

              <div className="day-events">
                {events.length === 0 ? (
                  <div className="no-event">No events</div>
                ) : (
                  events.map((e, idx) => (
                    <div className={`event ${e.type}`} key={idx}>
                      <div className="event-time">{e.time}</div>
                      <div className="event-game">{e.game}</div>
                      {e.description && (
                        <div className="event-desc">{e.description}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
