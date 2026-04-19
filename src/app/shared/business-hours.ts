const TIME_ZONE = 'America/Bogota';
const OPEN_HOUR = 16;
const CLOSE_HOUR = 23;

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getBogotaParts(date = new Date()): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find(p => p.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  };
}

function toApiDateTime(date: Date): string {
  return date.toISOString().substring(0, 19);
}

function getCurrentBusinessDayBounds(): { start: string; end: string } {
  const now = getBogotaParts();
  const startUtc = new Date(Date.UTC(now.year, now.month - 1, now.day, OPEN_HOUR + 5, 0, 0));
  const endUtc = new Date(Date.UTC(now.year, now.month - 1, now.day, CLOSE_HOUR + 5, 0, 0));
  return {
    start: toApiDateTime(startUtc),
    end: toApiDateTime(endUtc),
  };
}

export function isBusinessHours(): boolean {
  const now = getBogotaParts();
  const totalMinutes = now.hour * 60 + now.minute;
  const open = OPEN_HOUR * 60;
  const close = CLOSE_HOUR * 60;
  return totalMinutes >= open && totalMinutes < close;
}

export function getCurrentBusinessDayStartParam(): string {
  return getCurrentBusinessDayBounds().start;
}

export function isCurrentBusinessDayOrder(createdAt: string): boolean {
  const value = createdAt.substring(0, 19);
  const { start, end } = getCurrentBusinessDayBounds();
  return value >= start && value < end;
}
