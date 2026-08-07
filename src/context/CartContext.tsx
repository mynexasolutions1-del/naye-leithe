"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { cartCount } from "@/lib/utils";

const CART_COOKIE = "nl_cart";

type CartMap = Record<string, number>;

interface CartContextType {
  cart: CartMap;
  count: number;
  addToCart: (key: string, qty?: number) => void;
  updateCart: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function saveCart(cart: CartMap) {
  Cookies.set(CART_COOKIE, JSON.stringify(cart), {
    expires: 30,
    sameSite: "lax",
    path: "/",
  });
}

export function CartProvider({
  children,
  initialCart,
}: {
  children: ReactNode;
  /** Cart parsed server-side from the same cookie, so the very first
   *  client render matches the SSR output exactly — reading the cookie
   *  client-only here (via document.cookie) caused a hydration mismatch
   *  whenever the server rendered count 0 but the browser already had
   *  cart items. */
  initialCart?: CartMap;
}) {
  const [cart, setCart] = useState<CartMap>(initialCart ?? {});

  const update = useCallback((next: CartMap) => {
    setCart(next);
    saveCart(next);
  }, []);

  const addToCart = useCallback(
    (key: string, qty = 1) => {
      setCart((prev) => {
        const next = { ...prev, [key]: (prev[key] ?? 0) + qty };
        saveCart(next);
        return next;
      });
    },
    []
  );

  const updateCart = useCallback(
    (key: string, qty: number) => {
      setCart((prev) => {
        const next = { ...prev };
        if (qty <= 0) delete next[key];
        else next[key] = qty;
        saveCart(next);
        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    Cookies.remove(CART_COOKIE);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        count: cartCount(cart),
        addToCart,
        updateCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
