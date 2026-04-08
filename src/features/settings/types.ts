export type ProfileFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  birthday?: string;
  photo?: string;
};

export type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ApiErrorShape = {
  response?: {
    data?: {
      message?: string;
    };
  };
};
