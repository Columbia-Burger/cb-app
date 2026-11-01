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

export function toBogotaDateKey(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const plainIsoMatch = value.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (plainIsoMatch) {
      return plainIsoMatch[1];
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** El día de operación va de 5:00 a. m. a 5:00 a. m.: lo vendido después de medianoche es del día anterior. */
const BUSINESS_DAY_START_HOUR = 5;

function getCurrentBogotaDayBounds(): { start: string; end: string } {
  const now = getBogotaParts();
  // Entre medianoche y las 5 a. m. sigue siendo el día de operación de ayer
  const day = now.hour < BUSINESS_DAY_START_HOUR ? now.day - 1 : now.day;
  // Los timestamps se guardan en hora de Bogotá: se arma "AAAA-MM-DDT05:00:00" con Date.UTC
  // solo para formatear la fecha sin que interfiera la zona horaria del dispositivo
  const startUtc = new Date(Date.UTC(now.year, now.month - 1, day, BUSINESS_DAY_START_HOUR, 0, 0));
  const endUtc = new Date(Date.UTC(now.year, now.month - 1, day + 1, BUSINESS_DAY_START_HOUR, 0, 0));
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
  return getCurrentBogotaDayBounds().start;
}

export function isCurrentBusinessDayOrder(createdAt: string): boolean {
  const value = createdAt.substring(0, 19);
  const { start, end } = getCurrentBogotaDayBounds();
  return value >= start && value < end;
}
