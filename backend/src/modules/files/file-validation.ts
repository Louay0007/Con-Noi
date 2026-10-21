export interface PurposeRule {
  allowedMimes: string[];
  maxBytes: number;
  ownerType: string;
}

const MB = 1024 * 1024;

export const PURPOSE_RULES: Record<string, PurposeRule> = {
  resume:                 { allowedMimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxBytes: 10 * MB, ownerType: 'user' },
  avatar:                 { allowedMimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 5 * MB, ownerType: 'user' },
  certificate:            { allowedMimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], maxBytes: 10 * MB, ownerType: 'user' },
  work_sample:            { allowedMimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], maxBytes: 8 * MB, ownerType: 'user' },
  post_cover:             { allowedMimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 8 * MB, ownerType: 'post' },
  post_gallery:           { allowedMimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 8 * MB, ownerType: 'post' },
  post_attachment:        { allowedMimes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'], maxBytes: 15 * MB, ownerType: 'post' },
  application_attachment: { allowedMimes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'], maxBytes: 10 * MB, ownerType: 'application' },
  history_attachment:     { allowedMimes: ['application/pdf', 'image/jpeg', 'image/png'], maxBytes: 8 * MB, ownerType: 'work_history' },
  message_attachment:     { allowedMimes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/webp'], maxBytes: 15 * MB, ownerType: 'message' },
  company_logo:           { allowedMimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 5 * MB, ownerType: 'post' },
};

export function validateFileForPurpose(
  purpose: string,
  mime: string,
  size: number,
): { valid: boolean; error?: string } {
  const rule = PURPOSE_RULES[purpose];
  if (!rule) return { valid: false, error: `Unknown purpose: ${purpose}` };
  if (!rule.allowedMimes.includes(mime)) {
    return { valid: false, error: `MIME type ${mime} not allowed for ${purpose}. Allowed: ${rule.allowedMimes.join(', ')}` };
  }
  if (size > rule.maxBytes) {
    return { valid: false, error: `File size ${(size / MB).toFixed(1)}MB exceeds ${(rule.maxBytes / MB).toFixed(0)}MB limit for ${purpose}` };
  }
  return { valid: true };
}