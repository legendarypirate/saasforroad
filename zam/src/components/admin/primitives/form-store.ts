export type FormRule = {
  required?: boolean;
  message?: string;
  type?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (rule: FormRule, value: any) => Promise<void> | void;
  [key: string]: unknown;
};

export type FormFieldConfig = {
  rules?: FormRule[];
  valuePropName?: string;
};

export function pathToKey(path: (string | number)[] | string): string {
  if (typeof path === 'string') return path;
  return path.map(String).join('.');
}

export function getNestedValue(obj: Record<string, unknown>, path: (string | number)[] | string): unknown {
  const parts = typeof path === 'string' ? path.split('.') : path.map(String);
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function setNestedValue(
  obj: Record<string, unknown>,
  path: (string | number)[] | string,
  value: unknown,
): Record<string, unknown> {
  const parts = typeof path === 'string' ? path.split('.') : path.map(String);
  const next = { ...obj };
  let cur: Record<string, unknown> = next;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const child = cur[key];
    const nextChild =
      child !== null && typeof child === 'object'
        ? Array.isArray(child)
          ? [...child]
          : { ...(child as Record<string, unknown>) }
        : /^\d+$/.test(parts[i + 1])
          ? []
          : {};
    cur[key] = nextChild;
    cur = nextChild as Record<string, unknown>;
  }

  cur[parts[parts.length - 1]] = value;
  return next;
}

export class FormValidationError extends Error {
  errors: Record<string, string>;
  errorFields: Array<{ name: string[]; errors: string[] }>;

  constructor(errors: Record<string, string>) {
    super('validation');
    this.name = 'FormValidationError';
    this.errors = errors;
    this.errorFields = Object.entries(errors).map(([name, message]) => ({
      name: name.split('.'),
      errors: [message],
    }));
  }
}

export function isFormValidationError(error: unknown): error is FormValidationError {
  return (
    error instanceof FormValidationError ||
    (typeof error === 'object' &&
      error !== null &&
      'errorFields' in error &&
      Array.isArray((error as { errorFields: unknown }).errorFields))
  );
}

export class FormStore {
  values: Record<string, unknown> = {};
  errors: Record<string, string> = {};
  fields: Record<string, FormFieldConfig> = {};
  private listeners = new Set<() => void>();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getFieldsValue() {
    return { ...this.values };
  }

  getFieldValue(path: (string | number)[] | string) {
    return getNestedValue(this.values, path);
  }

  setFieldsValue(next: Record<string, unknown>) {
    this.values = { ...this.values, ...next };
    this.notify();
  }

  resetFields() {
    this.values = {};
    this.errors = {};
    this.notify();
  }

  /** Clear only the inline validation errors, keeping current values. */
  clearErrors() {
    if (Object.keys(this.errors).length === 0) return;
    this.errors = {};
    this.notify();
  }

  registerField(name: string, config: FormFieldConfig) {
    this.fields[name] = config;
  }

  setFieldValue(path: (string | number)[] | string, value: unknown) {
    const key = pathToKey(path);
    this.values = setNestedValue(this.values, path, value);
    if (this.errors[key]) {
      const next = { ...this.errors };
      delete next[key];
      this.errors = next;
    }
    this.notify();
  }

  async validateFields(): Promise<any> {
    const errors: Record<string, string> = {};
    for (const [name, field] of Object.entries(this.fields)) {
      const value = getNestedValue(this.values, name);
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (field.rules?.some((r) => r.required) && isEmpty) {
        errors[name] = field.rules.find((r) => r.message)?.message || 'Заавал оруулна';
      }
    }
    this.errors = errors;
    this.notify();
    if (Object.keys(errors).length > 0) {
      throw new FormValidationError(errors);
    }
    return { ...this.values };
  }
}

export type FormInstance = FormStore;
