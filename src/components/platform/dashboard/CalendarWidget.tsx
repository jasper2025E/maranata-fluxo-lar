import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarWidgetProps {
  highlightedDates?: Date[];
}

export function CalendarWidget({ highlightedDates = [] }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"];

  const isHighlighted = (date: Date) => {
    return highlightedDates.some(d => isSameDay(d, date));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">Calendário</h3>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-foreground text-sm capitalize">
          {format(currentMonth, "MMM yyyy", { locale: ptBR })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isTodayDate = isToday(date);
          const highlighted = isHighlighted(date);
          
          return (
            <button
              key={i}
              className={cn(
                "h-7 w-7 rounded-full text-[11px] font-medium transition-all",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isTodayDate && "text-foreground hover:bg-muted",
                isTodayDate && "bg-primary text-primary-foreground",
                highlighted && !isTodayDate && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background"
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
