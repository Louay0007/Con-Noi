const BASE = "/api/v1";

export type ApiError = { message: string; statusCode: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = (body as { message?: string }).message || message;
    } catch {
      // fallback to statusText when body is not JSON
    }
    throw { message, statusCode: res.status } as ApiError;
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as { data?: T } & T;
  // Backend wraps every payload via TransformInterceptor as { data, meta }.
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

// ── Helpers ───────────────────────────────────────────────
export const fileDownloadUrl = (idOrKey: string) => `${BASE}/files/download/${idOrKey}`;

export function logError(scope: string, err: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${scope}]`, err);
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return fallback;
}

export { getErrorMessage };
export type SafeUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  specialityIds: string[];
  onboardingCompleted: boolean;
  city?: string;
  province?: string;
  bio?: string;
  availability?: string;
  languages?: string[];
  certifications?: string[];
  hasDriversLicence?: boolean;
  avatarUrl?: string;
  isActive?: boolean;
  resumeFileId?: string | null;
};

export type Speciality = { _id: string; name: string; category: string; icon?: string; color?: string };

export type WorkHistoryEntry = {
  _id: string;
  positionTitle: string;
  companyName: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string;
  specialityIds: string[];
  attachmentFileIds: string[];
  location?: string;
  employmentType?: string;
};

export type UploadedFile = {
  id: string;
  url: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  scanStatus: string;
};

export type PostLocation = {
  city: string;
  province?: string;
  country: string;
  address?: string;
  remote: boolean;
};

export type PostSalary = {
  min?: number;
  max?: number;
  currency: string;
  period: string;
  isNegotiable: boolean;
};

export type PostCompany = {
  name: string;
  logoFileId?: string;
  website?: string;
  sector?: string;
  size?: string;
};

export type Post = {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  specialityIds: string[];
  specialityNames?: string[];
  location: PostLocation;
  employmentType: string;
  contractType?: string;
  salary?: PostSalary;
  schedule?: { shift: string; hoursPerWeek: number };
  company: PostCompany;
  coverFileId?: string;
  galleryFileIds: string[];
  attachments: { fileId: string; label: string; kind: string }[];
  status: string;
  publishedAt?: string;
  applicationDeadline?: string;
  openings: number;
  isFeatured: boolean;
  isUrgent: boolean;
  stats: { views: number; likes: number; applications: number };
  createdAt: string;
  matchScore?: number;
};

export type FeedResponse = { items: Post[]; nextCursor: string | null };
export type BrowseResponse = { items: Post[]; total: number; page: number; limit: number };

export type ApplicationSnapshot = {
  postTitle: string;
  postSlug?: string;
  companyName: string;
  city?: string;
  specialityNames?: string[];
  employmentType?: string;
};

export type Application = {
  _id: string;
  postId: string;
  userId: string;
  status: string;
  coverLetter?: string;
  resumeFileId?: string;
  attachmentFileIds: string[];
  contact?: { phone?: string; email?: string; availabilityNote?: string };
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
  reviewedAt?: string;
  /** Immutable copy of the post at apply time — survives post deletion. */
  snapshot?: ApplicationSnapshot;
  statusHistory?: Array<{ from?: string; to: string; at: string; note?: string }>;
  post?: Post;
};

// ── API Client ────────────────────────────────────────
export const api = {
  // Auth
  register: (data: {
    email: string; password: string; fullName: string;
    age?: number; phone?: string; city?: string; specialityIds: string[];
  }) => request<{ user: SafeUser }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<{ user: SafeUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  getMe: () => request<SafeUser>("/auth/me"),
  refresh: () => request<{ ok: true }>("/auth/refresh", { method: "POST" }),
  // Password reset. The backend always answers 200 for the request step so
  // responses cannot reveal whether an address is registered.
  forgotPassword: (email: string) =>
    request<{ ok: true; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  // Specialities
  getSpecialities: () => request<Speciality[]>("/specialities"),

  // Profile
  updateMySpecialities: (specialityIds: string[]) =>
    request<SafeUser>("/users/me/specialities", { method: "PUT", body: JSON.stringify({ specialityIds }) }),
  completeOnboarding: () =>
    request<SafeUser>("/users/me", { method: "PATCH", body: JSON.stringify({ onboardingCompleted: true }) }),

  // Files
  uploadFile: async (file: File, purpose: string): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/files/upload?purpose=${encodeURIComponent(purpose)}`, {
      method: "POST", credentials: "include", body: formData,
    });
    if (!res.ok) {
      let message = res.statusText;
      try { message = ((await res.json()) as { message?: string }).message || message; } catch {
        // fallback to statusText when body is not JSON
      }
      throw { message, statusCode: res.status } as ApiError;
    }
    const body = (await res.json()) as { data?: UploadedFile } & UploadedFile;
    return ("data" in body && body.data ? body.data : body) as UploadedFile;
  },

  // Work History
  getWorkHistory: () => request<WorkHistoryEntry[]>("/work-history"),
  createWorkHistory: (data: {
    positionTitle: string; companyName: string; startDate: string;
    endDate?: string; isCurrent?: boolean; description?: string;
    specialityIds?: string[]; attachmentFileIds?: string[];
    location?: string; employmentType?: string;
  }) => request<WorkHistoryEntry>("/work-history", { method: "POST", body: JSON.stringify(data) }),
  deleteWorkHistory: (id: string) => request<{ ok: true }>(`/work-history/${id}`, { method: "DELETE" }),

  // Posts / Feed
  getFeed: (cursor?: string, limit = 20) =>
    request<FeedResponse>(`/posts/feed?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`),

  browsePosts: (params: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    return request<BrowseResponse>(`/posts?${qs.toString()}`);
  },

  getPost: (id: string) => request<Post>(`/posts/${id}`),

  // Likes
  toggleLike: (postId: string) =>
    request<{ liked: boolean }>(`/posts/${postId}/like`, { method: "POST" }),
  getLikedIds: () => request<string[]>("/likes/ids"),

  // Applications
  apply: (postId: string, data: {
    coverLetter?: string; resumeFileId?: string;
    attachmentFileIds?: string[];
    contact?: { phone?: string; email?: string; availabilityNote?: string };
  }) => request<Application>(`/applications/posts/${postId}/apply`, { method: "POST", body: JSON.stringify(data) }),

  getMyApplications: (status?: string) =>
    request<Application[]>(`/applications/me${status ? `?status=${status}` : ""}`),

  withdrawApplication: (id: string) =>
    request<Application>(`/applications/${id}/withdraw`, { method: "POST" }),

  // Messages
  getThreads: () =>
    request<Array<{
      _id: string;
      participants: Array<{ id: string; fullName: string; avatarUrl?: string }>;
      lastMessage?: { body: string; createdAt: string; senderId: string };
      unreadCount: number;
      context?: string;
      isClosed: boolean;
      updatedAt: string;
    }>>("/messages/threads"),

  createThread: (data: { recipientId: string; postId?: string; applicationId?: string; context?: string }) =>
    request<{ _id: string }>("/messages/threads", { method: "POST", body: JSON.stringify(data) }),

  getMessages: (threadId: string, cursor?: string, limit = 50) =>
    request<{ items: Array<{ _id: string; senderId: string; body: string; attachmentFileIds: string[]; readBy: string[]; createdAt: string }>; nextCursor: string | null }>(
      `/messages/threads/${threadId}?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
    ),

  sendMessage: (threadId: string, data: { body?: string; attachmentFileIds?: string[] }) =>
    request<{ _id: string }>(`/messages/threads/${threadId}/messages`, { method: "POST", body: JSON.stringify(data) }),

  markThreadRead: (threadId: string) =>
    request<void>(`/messages/threads/${threadId}/read`, { method: "PATCH" }),

  closeThread: (threadId: string) =>
    request<void>(`/messages/threads/${threadId}/close`, { method: "PATCH" }),

  getUnreadCount: () =>
    request<{ count: number }>("/messages/unread-count"),

  // Notifications
  getNotifications: () =>
    request<Array<{
      _id: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      read: boolean;
      createdAt: string;
    }>>("/notifications"),
  getNotificationUnreadCount: () =>
    request<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request<void>("/notifications/read-all", { method: "PATCH" }),

  // Profile updates
  updateProfile: (data: {
    fullName?: string; bio?: string; city?: string; province?: string;
    availability?: string; languages?: string[]; certifications?: string[];
    hasDriversLicence?: boolean; avatarUrl?: string;
  }) => request<SafeUser>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ ok: true }>("/users/me/password", { method: "POST", body: JSON.stringify(data) }),
  exportMyData: () => request<Record<string, unknown>>("/users/me/export"),
  deleteMyAccount: () => request<{ ok: true }>("/users/me", { method: "DELETE" }),
  getMyFiles: () =>
    request<Array<{
      id: string; url: string; originalName: string; sizeBytes: number;
      mimeType: string; purpose: string; scanStatus: string; createdAt: string;
    }>>("/files/mine"),
  deleteFile: (id: string) => request<{ ok: true }>(`/files/${id}`, { method: "DELETE" }),

  // ── Admin ───────────────────────────────────────────
  adminGetStats: () =>
    request<{
      totals: { users: number; activeWorkers: number; posts: number; publishedPosts: number; applications: number; acceptedApplications: number; rejectedApplications: number };
      last30Days: { signups: number; posts: number; applications: number };
      acceptanceRate: number;
    }>("/admin/stats"),

  adminGetFunnel: () =>
    request<Record<string, number>>("/admin/analytics/funnel"),

  adminGetSpecialityDemand: () =>
    request<Array<{ name: string; postCount: number; applicationCount: number }>>("/admin/analytics/specialities"),

  adminGetTopPosts: () =>
    request<Post[]>("/admin/analytics/top-posts"),

  // Admin Posts
  adminGetPosts: (params: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
    return request<{ items: Post[]; total: number; page: number; limit: number }>(`/posts?${qs.toString()}`);
  },
  adminCreatePost: (data: Record<string, unknown>) =>
    request<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
  adminUpdatePost: (id: string, data: Record<string, unknown>) =>
    request<Post>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminChangePostStatus: (id: string, action: "publish" | "close" | "archive" | "restore") =>
    request<Post>(`/posts/${id}/status`, { method: "PATCH", body: JSON.stringify({ action }) }),
  adminDeletePost: (id: string) =>
    request<void>(`/posts/${id}`, { method: "DELETE" }),

  // Admin Applications
  adminGetApplications: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
    return request<{ items: Application[]; total: number; page: number; limit: number }>(`/applications?${qs.toString()}`);
  },
  adminReviewApplication: (id: string, data: { status: "reviewed" | "accepted" | "rejected"; reviewNotes?: string }) =>
    request<Application>(`/applications/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),

  // Admin Users
  adminGetUsers: (params: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
    return request<{ items: SafeUser[]; total: number; page: number; limit: number }>(`/users?${qs.toString()}`);
  },
  adminGetUser: (id: string) => request<SafeUser>(`/users/${id}`),
  adminUpdateUser: (id: string, data: Record<string, unknown>) =>
    request<SafeUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminUpdateUserStatus: (id: string, isActive: boolean) =>
    request<{ ok: true }>(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  adminDeleteUser: (id: string) =>
    request<{ ok: true }>(`/users/${id}`, { method: "DELETE" }),

  // Admin Audit Log
  adminGetAuditLog: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
    const q = qs.toString();
    return request<{ items: Array<{ _id: string; timestamp: string; actor: string; actorRole: string; action: string; entity: string; entityId: string; ip?: string; userAgent?: string; before?: Record<string, unknown>; after?: Record<string, unknown> }>; total: number; page: number; limit: number }>(
      `/audit${q ? `?${q}` : ""}`,
    );
  },

  // Broadcast notification
  adminBroadcast: (data: { title: string; body: string }) =>
    request<{ sent: number }>("/notifications/broadcast", { method: "POST", body: JSON.stringify(data) }),
};