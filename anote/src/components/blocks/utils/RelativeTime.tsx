import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

const RelativeTime = ({ date, className = "" }) => {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(formatDistanceToNow(new Date(date), { addSuffix: true }));
    };

    updateTime();
    // Update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return (
    <span className={className} title={new Date(date).toLocaleString()}>
      {relativeTime}
    </span>
  );
};

export default RelativeTime;