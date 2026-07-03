import dayjs, { Dayjs } from 'dayjs';

export const DATE_FORMAT = 'YYYY-MM-DD';

export function toDayjs(value?: string | null): Dayjs | null {
  if (!value || !String(value).trim()) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

export function formatDate(value?: string | null) {
  const parsed = toDayjs(value);
  return parsed ? parsed.format(DATE_FORMAT) : '—';
}

export function dateFormItemProps() {
  return {
    getValueProps: (value?: string | null) => ({ value: toDayjs(value) }),
    normalize: (value: Dayjs | string | null | undefined) => {
      if (dayjs.isDayjs(value)) {
        return value.isValid() ? value.format(DATE_FORMAT) : '';
      }
      return value ?? '';
    },
  };
}
