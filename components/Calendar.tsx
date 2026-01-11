import React, { useMemo } from 'react';
import type { Memo } from '../types';
import { isSameDay, isToday } from '../utils';

interface CalendarProps {
    memos: Memo[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    activeTag: string | null;
} 

export const Calendar = ({ memos, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, activeTag }: CalendarProps) => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysWithMemos = useMemo(() => new Set(memos.map(memo => new Date(memo.timestamp).toDateString())), [memos]);
  const changeMonth = (offset: number) => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));

  const renderCalendarGrid = () => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(name => grid.push(<div key={name} className="day-name">{name}</div>));
    for (let i = 0; i < firstDay; i++) grid.push(<div key={`empty-start-${i}`} className="day other-month"></div>);
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const classNames = ['day'];
        if (isToday(date)) classNames.push('today');
        if (isSameDay(date, selectedDate) && !activeTag) classNames.push('selected');
        grid.push(<div key={i} className={classNames.join(' ')} onClick={() => setSelectedDate(date)}><span>{i}</span>{daysWithMemos.has(date.toDateString()) && <div className="memo-dot"></div>}</div>);
    }
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for(let i=0; i<remainingCells; i++) grid.push(<div key={`empty-end-${i}`} className="day other-month"></div>);
    return grid;
  };

  return (
    <>
      <div className="calendar-header">
        <h2>{`${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}</h2>
        <div className="calendar-nav">
          <button onClick={() => changeMonth(-1)}>&lt;</button>
          <button onClick={() => changeMonth(1)}>&gt;</button>
        </div>
      </div>
      <div className="calendar-grid">{renderCalendarGrid()}</div>
    </>
  );
};
