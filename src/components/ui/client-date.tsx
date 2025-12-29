'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type ClientDateProps = {
  date: string | number | Date;
  formatString: string;
};

export default function ClientDate({ date, formatString }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(format(new Date(date), formatString));
  }, [date, formatString]);

  if (!formattedDate) {
    // You can return a placeholder or null while waiting for client-side render
    return null;
  }

  return <>{formattedDate}</>;
}
