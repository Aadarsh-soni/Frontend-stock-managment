import { apiFetch } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  // User signup
  signup: async (data: SignupData): Promise<User> => {
    return apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // User login
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiFetch<{ user?: User } & User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    
    // Handle different response formats
    if (response.user) {
      return response.user;
    } else if (response.id && response.email) {
      return response;
    } else {
      throw new Error("Invalid login response format");
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiFetch<{ user?: User } & User>("/auth/me");
    
    // Handle different response formats
    if (response.user) {
      return response.user;
    } else if (response.id && response.email) {
      return response;
    } else {
      throw new Error("Invalid user response format");
    }
  },

  // User logout
  logout: async (): Promise<void> => {
    return apiFetch("/auth/logout", {
      method: "POST",
    });
  },
};
