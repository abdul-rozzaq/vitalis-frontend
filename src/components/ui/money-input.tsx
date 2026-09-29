"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type InputHTMLAttributes } from "react";
import { NumericFormat } from "react-number-format";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange"> & {
  value: string | number | undefined;
  /** Unformatted decimal string, e.g. "1250000.50". */
  onValueChange: (value: string) => void;
};

/** Amounts display spaces between thousands; forms and API payloads keep raw values. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onValueChange, min, max, step: _step, ...props }, ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!);

  // Text inputs do not support native numeric range validation.
  useEffect(() => {
    const amount = value === "" || value === undefined ? undefined : Number(value);
    let message = "";
    if (amount !== undefined && min !== undefined && amount < Number(min)) {
      message = `Summa ${min} dan kam bo‘lmasligi kerak`;
    } else if (amount !== undefined && max !== undefined && amount > Number(max)) {
      message = `Summa ${max} dan oshmasligi kerak`;
    }
    inputRef.current?.setCustomValidity(message);
  }, [value, min, max]);

  return <NumericFormat
    {...props}
    getInputRef={inputRef}
    type="text"
    inputMode="decimal"
    value={value ?? ""}
    valueIsNumericString
    thousandSeparator=" "
    decimalSeparator="."
    allowedDecimalSeparators={[".", ","]}
    decimalScale={2}
    allowNegative={false}
    onValueChange={(values, source) => {
      if (source.source === "event") onValueChange(values.value);
    }}
  />;
});
