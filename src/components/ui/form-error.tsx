interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="text-xs text-danger-600 font-medium">{message}</p>;
}
