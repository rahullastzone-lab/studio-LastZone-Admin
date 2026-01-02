'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
    date?: Date;
    setDate: (date?: Date) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
    const [dateInputValue, setDateInputValue] = React.useState<string>(
        date ? format(date, 'dd/MM/yy') : ''
    );
    const [timeValue, setTimeValue] = React.useState<string>(
        date ? format(date, 'HH:mm') : '00:00'
    );

    React.useEffect(() => {
        if (date) {
            setSelectedDate(date);
            setDateInputValue(format(date, 'dd/MM/yy'));
            setTimeValue(format(date, 'HH:mm'));
        }
    }, [date]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return;

        const [hours, minutes] = timeValue.split(':').map(Number);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);

        setSelectedDate(newDate);
        setDateInputValue(format(newDate, 'dd/MM/yy'));
        setDate(newDate);
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDateInputValue(val);

        // Try parsing DD/MM/YY or DD/MM/YYYY
        // Simple regex check or just let date-fns parse
        // date-fns v2 parse: parse(dateString, formatString, referenceDate)
        // We'll try strictly parsing 'dd/MM/yy'
        try {
            // Using a simple regex to check format before parsing helps avoid partial matches
            if (/^\d{2}\/\d{2}\/\d{2}$/.test(val)) {
                const parsed = new Date(`20${val.split('/')[2]}-${val.split('/')[1]}-${val.split('/')[0]}T${timeValue}:00`);
                if (!isNaN(parsed.getTime())) {
                    setSelectedDate(parsed);
                    setDate(parsed);
                }
            }
        } catch (err) {
            // Ignore parse errors while typing
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTimeValue(newTime);

        if (selectedDate) {
            const [hours, minutes] = newTime.split(':').map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            setSelectedDate(newDate);
            setDate(newDate);
        }
    };

    return (
        <div className="flex gap-2">
            <div className="relative w-[160px]">
                <Input
                    value={dateInputValue}
                    onChange={handleDateInputChange}
                    placeholder="DD/MM/YY"
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'ghost'}
                            size="icon"
                            className="absolute right-0 top-0 h-full w-9 text-muted-foreground hover:text-foreground"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="w-[140px]">
                <Input
                    type="time"
                    value={timeValue}
                    onChange={handleTimeChange}
                />
            </div>
        </div>
    );
}
