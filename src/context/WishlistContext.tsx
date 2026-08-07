"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";

const WISHLIST_COOKIE = "nl_wishlist";

interface WishlistContextType {
  wishlist: string[];
  count: number;
  toggle: (productId: string) => boolean; // returns true if added
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

function saveWishlist(list: string[]) {
  Cookies.set(WISHLIST_COOKIE, JSON.stringify(list), {
    expires: 30,
    sameSite: "lax",
    path: "/",
  });
}

export function WishlistProvider({
  children,
  initialWishlist,
}: {
  children: ReactNode;
  /** Same reasoning as CartProvider's initialCart — must match the
   *  server-rendered value exactly to avoid a hydration mismatch. */
  initialWishlist?: string[];
}) {
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist ?? []);

  const toggle = useCallback((productId: string): boolean => {
    let added = false;
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      added = !exists;
      saveWishlist(next);
      return next;
    });
    return added;
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider
      value={{ wishlist, count: wishlist.length, toggle, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be inside WishlistProvider");
  return ctx;
}
