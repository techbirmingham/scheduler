import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// Import dayjs and extend it with comparison plugins
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore); // enables .isSameOrBefore()
dayjs.extend(isSameOrAfter);  // enables .isSameOrAfter()

// Props for navigating dates between optional min and max bounds
interface DateNavigatorProps {
  date: string; // current date in 'YYYY-MM-DD' format
  onDateChange: (newDate: string) => void; // function to update selected date
  minDate?: string; // optional lower limit
  maxDate?: string; // optional upper limit
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  date,
  onDateChange,
  minDate,
  maxDate,
}) => {
  // Navigate back one day (only if still within minDate range)
  const handlePrevDay = () => {
    const newDate = dayjs(date).subtract(1, 'day');
    if (!minDate || newDate.isSameOrAfter(dayjs(minDate))) {
      onDateChange(newDate.format('YYYY-MM-DD'));
    }
  };

  // Navigate forward one day (only if still within maxDate range)
  const handleNextDay = () => {
    const newDate = dayjs(date).add(1, 'day');
    if (!maxDate || newDate.isSameOrBefore(dayjs(maxDate))) {
      onDateChange(newDate.format('YYYY-MM-DD'));
    }
  };

  // Handle manual change via the <input type="date" /> field
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = dayjs(e.target.value);
    if ((!minDate || newDate.isSameOrAfter(dayjs(minDate))) && 
        (!maxDate || newDate.isSameOrBefore(dayjs(maxDate)))) {
      onDateChange(newDate.format('YYYY-MM-DD'));
    }
  };

  // Disable nav buttons when already at date limits
  const isPrevDisabled = minDate && dayjs(date).isSameOrBefore(dayjs(minDate));
  const isNextDisabled = maxDate && dayjs(date).isSameOrAfter(dayjs(maxDate));

  return (
    <div className="flex items-center space-x-4 bg-white p-3 rounded-lg shadow">
      {/* Previous day button */}
      <button 
        onClick={handlePrevDay}
        disabled={isPrevDisabled}
        className={`p-2 rounded-md ${
          isPrevDisabled 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Previous day"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Date input with calendar icon */}
      <div className="flex items-center">
        <Calendar size={20} className="text-gray-400 mr-2" />
        <input
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={handleDateChange}
          className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Next day button */}
      <button 
        onClick={handleNextDay}
        disabled={isNextDisabled}
        className={`p-2 rounded-md ${
          isNextDisabled 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Next day"
      >
        <ChevronRight size={20} />
      </button>

      {/* Human-readable formatted date */}
      <div className="text-sm text-gray-500">
        {dayjs(date).format('dddd, MMMM D, YYYY')}
      </div>
    </div>
  );
};