import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaPlus, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { Meeting, TimeSlot } from '../types';
import './ModernCalendar.css';

interface ModernCalendarProps {
  meetings: Meeting[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  onMeetingSelect: (meeting: Meeting) => void;
}

const ModernCalendar: React.FC<ModernCalendarProps> = ({
  meetings,
  selectedDate,
  onDateSelect,
  onTimeSlotSelect,
  onMeetingSelect,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(selectedDate), i)
  );

  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    time: `${i.toString().padStart(2, '0')}:00`,
  }));

  const getMeetingsForSlot = useCallback((date: Date, hour: number) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      const meetingHour = meetingDate.getHours();
      return isSameDay(meetingDate, date) && meetingHour === hour;
    });
  }, [meetings]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    // Handle meeting reordering logic here
    console.log('Meeting moved:', result);
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const timeSlot: TimeSlot = {
      date,
      startTime: new Date(date.setHours(hour, 0, 0, 0)),
      endTime: new Date(date.setHours(hour + 1, 0, 0, 0)),
    };
    onTimeSlotSelect(timeSlot);
  };

  return (
    <div className="modern-calendar">
      <div className="calendar-header">
        <motion.div 
          className="view-toggle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
        </motion.div>
        
        <div className="calendar-actions">
          <motion.button
            className="add-meeting-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTimeSlotSelect({
              date: selectedDate,
              startTime: new Date(),
              endTime: new Date(Date.now() + 60 * 60 * 1000),
            })}
          >
            <FaPlus />
            New Meeting
          </motion.button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="calendar-grid">
          {/* Time column */}
          <div className="time-column">
            <div className="time-header">Time</div>
            {timeSlots.map(({ hour, time }) => (
              <div key={hour} className="time-slot">
                {time}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((date, dayIndex) => (
            <div key={dayIndex} className="day-column">
              <motion.div 
                className={`day-header ${isToday(date) ? 'today' : ''}`}
                whileHover={{ backgroundColor: '#f0f0f0' }}
              >
                <div className="day-name">{format(date, 'EEE')}</div>
                <div className="day-date">{format(date, 'd')}</div>
              </motion.div>

              <Droppable droppableId={`day-${dayIndex}`}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="day-slots"
                  >
                    {timeSlots.map(({ hour }, slotIndex) => {
                      const slotMeetings = getMeetingsForSlot(date, hour);
                      const slotId = `${dayIndex}-${hour}`;
                      
                      return (
                        <div
                          key={slotIndex}
                          className={`time-slot-cell ${
                            hoveredSlot === slotId ? 'hovered' : ''
                          }`}
                          onClick={() => handleSlotClick(date, hour)}
                          onMouseEnter={() => setHoveredSlot(slotId)}
                          onMouseLeave={() => setHoveredSlot(null)}
                        >
                          <AnimatePresence>
                            {slotMeetings.map((meeting, meetingIndex) => (
                              <Draggable
                                key={meeting._id || meeting.id}
                                draggableId={meeting._id || meeting.id}
                                index={meetingIndex}
                              >
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`meeting-item ${snapshot.isDragging ? 'dragging' : ''}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMeetingSelect(meeting);
                                    }}
                                  >
                                    <div className="meeting-title">{meeting.title}</div>
                                    <div className="meeting-time">
                                      {format(new Date(meeting.startTime), 'HH:mm')} - 
                                      {format(new Date(meeting.endTime), 'HH:mm')}
                                    </div>
                                    <div className="meeting-room">{meeting.room}</div>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default ModernCalendar;
