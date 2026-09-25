import { tokenStorage, isTokenExpired } from "@/utils/token.utils";
import { refreshAccessToken, API_BASE_URL } from "./api";

async function getValidToken(): Promise<string | null> {
  let token = tokenStorage.getAccessToken();
  if (!token) return null;
  if (isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      return null;
    }
  }
  return token;
}

export async function uploadImage(
  file: File,
  isRetry = false,
): Promise<{ url: string }> {
  const token = await getValidToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // DO NOT set Content-Type, fetch will set it to multipart/form-data with the correct boundary

  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
      return await uploadImage(file, true);
    } catch {
      // Refresh error redirects to /login automatically
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to upload image: ${response.statusText} - ${errorBody}`,
    );
  }

  return response.json();
}

export async function uploadSvg(
  file: File,
  isRetry = false,
): Promise<{ url: string }> {
  const token = await getValidToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/uploads/svg`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
      return await uploadSvg(file, true);
    } catch {
      // Refresh error redirects to /login automatically
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to upload SVG map: ${response.statusText} - ${errorBody}`,
    );
  }

  return response.json();
}
