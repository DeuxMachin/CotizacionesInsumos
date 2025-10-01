let authUserId: string | null = null;

export function setAuthUserId(id: string | null) {
  authUserId = id;
}

export function getAuthUserId() {
  return authUserId;
}
