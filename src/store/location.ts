import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  city: string | null;
  setCity: (slug: string | null) => void;
}

export const useLocation = create<LocationState>()(
  persist(
    (set) => ({
      city: null,
      setCity: (city) => set({ city }),
    }),
    { name: "loveshop-location" }
  )
);
