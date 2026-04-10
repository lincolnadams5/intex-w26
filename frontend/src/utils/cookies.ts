// Set a cookie
export function setCookie(name: string, value: string, days = 365) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }
  
  // Get a cookie
  export function getCookie(name: string): string | null {
    const cookies = document.cookie.split("; ");
    const match = cookies.find(row => row.startsWith(name + "="));
    return match ? match.split("=").slice(1).join("=") : null;
  }
  
  // Delete a cookie
  export function deleteCookie(name: string) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }