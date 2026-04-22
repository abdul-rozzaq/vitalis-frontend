
import { useState } from "react";

export default function usePhoneFormatter(initialValue = "") {
  const [value, setValue] = useState(format(initialValue));

  function format(phone: string) {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 0) return "";

    let result = "+998";

    if (cleaned.length > 3) {
      const operator = cleaned.slice(3, 5);
      result += ` (${operator}`;
    }

    if (cleaned.length >= 5) {
      result += ")";
    }

    if (cleaned.length > 5) {
      const part1 = cleaned.slice(5, 8);
      result += ` ${part1}`;
    }

    if (cleaned.length > 8) {
      const part2 = cleaned.slice(8, 10);
      result += `-${part2}`;
    }

    if (cleaned.length > 10) {
      const part3 = cleaned.slice(10, 12);
      result += `-${part3}`;
    }

    return result;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setValue(format(raw));
  }

  // backendga yuborish uchun clean value
  function getRaw() {
    return value.replace(/\D/g, "");
  }

  return {
    value,
    onChange: handleChange,
    raw: getRaw(),
    setValue,
  };
}