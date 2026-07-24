'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { FormStore, isFormValidationError, pathToKey, type FormInstance, type FormRule } from './form-store';

const FormContext = createContext<{
  store: FormStore;
} | null>(null);

const FormListContext = createContext<(string | number)[] | null>(null);

function useForm(): [FormInstance] {
  const store = useMemo(() => new FormStore(), []);
  return [store];
}

type FormProps = {
  form?: FormInstance;
  onFinish?: (values: any) => void;
  layout?: 'vertical' | 'horizontal' | 'inline';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  requiredMark?: boolean;
  initialValues?: Record<string, unknown>;
  onValuesChange?: (changed: Record<string, unknown>, all: Record<string, unknown>) => void;
  [key: string]: unknown;
};

function FormRoot({
  form,
  onFinish,
  layout = 'vertical',
  children,
  className,
  style,
  initialValues,
}: FormProps) {
  const fallback = useMemo(() => new FormStore(), []);
  const store = form ?? fallback;
  const [, setTick] = useState(0);

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);
  useEffect(() => {
    if (initialValues) store.setFieldsValue(initialValues);
  }, [store, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const values = await store.validateFields();
      onFinish?.(values);
    } catch (err) {
      if (!isFormValidationError(err)) throw err;
      /* validation errors shown on fields */
    }
  };

  return (
    <FormContext.Provider value={{ store }}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          layout === 'vertical' ? 'space-y-1' : layout === 'inline' ? 'flex flex-wrap items-end gap-3' : 'space-y-3',
          className,
        )}
        style={style}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

type FormItemProps = {
  name?: string | (string | number)[];
  label?: React.ReactNode;
  rules?: FormRule[];
  valuePropName?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initialValue?: unknown;
  hidden?: boolean;
  noStyle?: boolean;
  [key: string]: unknown;
};

function resolveFieldPath(
  name: string | (string | number)[] | undefined,
  listPrefix: (string | number)[] | null,
): string | undefined {
  if (!name) return undefined;
  const segments = Array.isArray(name) ? name : [name];
  const full = listPrefix ? [...listPrefix, ...segments] : segments;
  return pathToKey(full);
}

function getControlChild(children: React.ReactNode): React.ReactElement | null {
  const items = React.Children.toArray(children).filter((child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return String(child).trim().length > 0;
    }
    return child !== null && child !== undefined;
  });

  if (items.length !== 1 || !React.isValidElement(items[0])) {
    return null;
  }

  return items[0];
}

function FormItem({
  name,
  label,
  rules,
  valuePropName = 'value',
  children,
  className,
  style,
  initialValue,
  hidden,
  noStyle,
}: FormItemProps) {
  const ctx = useContext(FormContext);
  const listPrefix = useContext(FormListContext);
  const store = ctx?.store;
  const fieldPath = resolveFieldPath(name, listPrefix);

  useEffect(() => {
    if (store && fieldPath) {
      store.registerField(fieldPath, { rules, valuePropName });
      if (initialValue !== undefined && store.getFieldValue(fieldPath) === undefined) {
        store.setFieldValue(fieldPath, initialValue);
      }
    }
  }, [store, fieldPath, rules, valuePropName, initialValue]);

  if (hidden) return null;

  const itemClass = cn(
    !noStyle && 'mb-5 flex flex-col gap-2 last:mb-0',
    className,
  );

  if (!children) {
    return (
      <div className={itemClass} style={style}>
        {label && <Label className="text-sm font-medium text-foreground">{label}</Label>}
      </div>
    );
  }

  const child = fieldPath ? getControlChild(children) : null;
  const error = fieldPath && store ? store.errors[fieldPath] : undefined;

  if (!fieldPath || !child || !store) {
    return (
      <div className={itemClass} style={style}>
        {label && <Label className="text-sm font-medium text-foreground">{label}</Label>}
        {children}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  const injected = React.cloneElement(child, {
          [valuePropName]: store.getFieldValue(fieldPath) ?? (valuePropName === 'checked' ? false : ''),
          [valuePropName === 'checked' ? 'onCheckedChange' : 'onChange']: (val: unknown, ...rest: unknown[]) => {
            const next =
              valuePropName === 'checked'
                ? val
                : val && typeof val === 'object' && 'target' in (val as object)
                  ? (val as React.ChangeEvent<HTMLInputElement>).target.value
                  : val;
            store.setFieldValue(fieldPath, next);
            const childProps = child.props as Record<string, unknown>;
            const onChange = childProps.onChange as ((v: unknown, ...r: unknown[]) => void) | undefined;
            const onCheckedChange = childProps.onCheckedChange as ((v: unknown) => void) | undefined;
            onChange?.(val, ...rest);
            onCheckedChange?.(val);
          },
        } as Record<string, unknown>);

  return (
    <div className={itemClass} style={style}>
      {label && <Label className="text-sm font-medium text-foreground">{label}</Label>}
      {injected}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

type FormListField = { key: number; name: number };

function FormList({
  name,
  children,
}: {
  name: string | (string | number)[];
  children: (
    fields: FormListField[],
    operations: { add: (defaultValue?: Record<string, unknown>) => void; remove: (index: number) => void },
  ) => React.ReactNode;
}) {
  const ctx = useContext(FormContext);
  const parentPrefix = useContext(FormListContext);
  const store = ctx?.store;
  const [, setTick] = useState(0);

  const fullPrefix = useMemo(() => {
    const segments = Array.isArray(name) ? name : [name];
    return parentPrefix ? [...parentPrefix, ...segments] : segments;
  }, [name, parentPrefix]);

  const listKey = pathToKey(fullPrefix);

  useEffect(() => {
    if (!store) return;
    return store.subscribe(() => setTick((n) => n + 1));
  }, [store]);

  if (!store) return null;

  const list = (store.getFieldValue(fullPrefix) as unknown[]) ?? [];
  const fields: FormListField[] = list.map((_, index) => ({ key: index, name: index }));

  const add = (defaultValue: Record<string, unknown> = {}) => {
    store.setFieldValue(fullPrefix, [...list, defaultValue]);
  };

  const remove = (index: number) => {
    const next = [...list];
    next.splice(index, 1);
    store.setFieldValue(fullPrefix, next);
  };

  return (
    <FormListContext.Provider value={fullPrefix}>
      {children(fields, { add, remove })}
    </FormListContext.Provider>
  );
}

function useWatch(
  name: string | (string | number)[],
  form?: FormInstance,
): any {
  const ctx = useContext(FormContext);
  const store = form ?? ctx?.store;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!store) return;
    return store.subscribe(() => setTick((n) => n + 1));
  }, [store]);

  if (!store) return undefined;
  const path = Array.isArray(name) ? name : [name];
  return store.getFieldValue(path);
}

function useFormInstance(): FormInstance | undefined {
  const ctx = useContext(FormContext);
  return ctx?.store;
}

export const Form = Object.assign(FormRoot, {
  Item: FormItem,
  List: FormList,
  useForm,
  useWatch,
  useFormInstance,
});
