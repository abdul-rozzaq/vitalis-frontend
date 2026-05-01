export default function formatPhone(phone: string) {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length !== 12) return phone;

  const country = cleaned.slice(0, 3);
  const operator = cleaned.slice(3, 5);
  const part1 = cleaned.slice(5, 8);
  const part2 = cleaned.slice(8, 10);
  const part3 = cleaned.slice(10, 12);

  return `+${country} (${operator}) ${part1}-${part2}-${part3}`;
}
