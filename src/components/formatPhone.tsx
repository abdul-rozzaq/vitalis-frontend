export default function formatPhone(phone: string) {
  if (!phone) return "";

  // faqat raqamlarni olib qolamiz
  const cleaned = phone.replace(/\D/g, "");

  // +998XXXXXXXXX bo‘lishi kerak
  if (cleaned.length !== 12) return phone;

  const country = cleaned.slice(0, 3); // 998
  const operator = cleaned.slice(3, 5); // 99
  const part1 = cleaned.slice(5, 8); // 999
  const part2 = cleaned.slice(8, 10); // 99
  const part3 = cleaned.slice(10, 12); // 99

  return `+${country}(${operator})${part1}-${part2}-${part3}`;
}
