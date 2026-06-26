export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";

  try {
    const isTimezoneAware = /([zZ]|[+-]\d{2}:\d{2})$/.test(iso);
    const date = new Date(isTimezoneAware ? iso : `${iso}Z`);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}
