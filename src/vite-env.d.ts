/// <reference types="vite/client" />

declare global {
  interface WindowEventMap {
    "open-signup": Event;
    "open-signin": Event;
    "open-registration": Event;
  }
}

export {};
