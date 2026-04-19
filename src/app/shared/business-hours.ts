/**
 * Retorna true si la hora actual está dentro del horario del negocio.
 * Horario: 3:45 PM – 12:00 AM (15:45 – 00:00)
 */
export function isBusinessHours(): boolean {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const open  = 15 * 60 + 45; // 15:45
  const close = 24 * 60;      // 24:00 = medianoche (fin del día)
  return totalMinutes >= open && totalMinutes < close;
}
