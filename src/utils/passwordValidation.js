export function validatePassword(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  if (/\s/.test(password)) {
    errors.push("Password cannot contain spaces.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(password)) score++;

  if (score <= 2) {
    return {
      label: "Weak",
      color: "text-red-600",
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      color: "text-yellow-600",
    };
  }

  return {
    label: "Strong",
    color: "text-green-600",
  };
}