"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  X,
  ArrowRight,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Smartphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startPayment } from "@/lib/sumup";
import type { SumUpResult } from "@/lib/sumup";
import {
  createOrder,
  updateOrderStatus,
  decrementStock,
  generateReceiptNumber,
} from "@/lib/orders";
import type { OrderItem } from "@/lib/orders";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckoutStep = "idle" | "qr" | "nfc" | "thankyou";

interface Tenant {
  id: string;
  name: string;
  terminalEnabled?: boolean;
  terminalProvider?: string;
  terminalApiKey?: string;
  terminalMerchantId?: string;
  sumupTestMode?: boolean;
  swishEnabled?: boolean;
  swishNumber?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface KioskPreviewProps {
  tenant: Tenant;
  products: Product[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KioskPreview({ tenant, products }: KioskPreviewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("idle");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [nfcError, setNfcError] = useState<string | null>(null);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ---- Cart helpers -------------------------------------------------------

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCurrentOrderId(null);
    setNfcError(null);
  }, []);

  // ---- Order item mapper --------------------------------------------------

  const toOrderItems = (): OrderItem[] =>
    cart.map((item) => ({
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

  // ---- Swish checkout -----------------------------------------------------

  const handleSwishCheckout = async () => {
    const receiptNumber = generateReceiptNumber();
    const order = await createOrder({
      tenant_id: tenant.id,
      receipt_number: receiptNumber,
      items: toOrderItems(),
      total: cartTotal,
      payment_method: "swish",
      status: "pending",
    });
    setCurrentOrderId(order.id!);
    setCheckoutStep("qr");
  };

  // ---- NFC card checkout --------------------------------------------------

  const processPayment = async (
    orderId: string,
    receiptNumber: string,
    orderItems: OrderItem[]
  ) => {
    const result: SumUpResult = await startPayment(
      cartTotal,
      "SEK",
      receiptNumber,
      tenant.sumupTestMode ?? true
    );

    if (result.success) {
      await updateOrderStatus(orderId, "completed");
      await decrementStock(orderItems);
      setCheckoutStep("thankyou");
    } else {
      setNfcError(result.message);
    }
  };

  const handleCardCheckout = async () => {
    setNfcError(null);
    const receiptNumber = generateReceiptNumber();
    const orderItems = toOrderItems();

    const order = await createOrder({
      tenant_id: tenant.id,
      receipt_number: receiptNumber,
      items: orderItems,
      total: cartTotal,
      payment_method: "card",
      status: "pending",
    });

    setCurrentOrderId(order.id!);
    setCheckoutStep("nfc");

    await processPayment(order.id!, receiptNumber, orderItems);
  };

  const handleNfcRetry = async () => {
    if (!currentOrderId) return;
    setNfcError(null);

    const result: SumUpResult = await startPayment(
      cartTotal,
      "SEK",
      `RETRY-${currentOrderId}`,
      tenant.sumupTestMode ?? true
    );

    if (result.success) {
      await updateOrderStatus(currentOrderId, "completed");
      await decrementStock(toOrderItems());
      setCheckoutStep("thankyou");
    } else {
      setNfcError(result.message);
    }
  };

  // ---- Navigation helpers -------------------------------------------------

  const handleCancel = () => {
    setCheckoutStep("idle");
    setNfcError(null);
  };

  const handleThankYouDone = () => {
    clearCart();
    setCheckoutStep("idle");
  };

  // ---- Derived state ------------------------------------------------------

  const showCardButton =
    tenant.terminalEnabled &&
    tenant.terminalProvider === "sumup" &&
    tenant.terminalApiKey;

  // ---- Render -------------------------------------------------------------

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ---- Product grid ---- */}
      <div className="flex-1 overflow-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">{tenant.name}</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col items-center rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md active:scale-95"
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="mb-3 h-24 w-24 rounded-lg object-cover"
                />
              )}
              <span className="font-medium">{product.name}</span>
              <span className="text-muted-foreground">
                {product.price} kr
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Cart sidebar ---- */}
      <div className="flex w-96 flex-col border-l bg-white">
        <div className="border-b p-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCart className="h-5 w-5" />
            Varukorg
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.length}</Badge>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Varukorgen är tom
            </p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.price} kr
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment section */}
        {cart.length > 0 && (
          <div className="space-y-3 border-t p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Totalt</span>
              <span>{cartTotal} kr</span>
            </div>

            {/* Card payment button — ovanför Swish */}
            {showCardButton && (
              <Button
                onClick={handleCardCheckout}
                className="h-14 w-full bg-[#00B4D8] text-lg text-white hover:bg-[#00B4D8]/90"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Betala med kort
              </Button>
            )}

            {/* Swish button */}
            {tenant.swishEnabled && tenant.swishNumber && (
              <Button
                onClick={handleSwishCheckout}
                className="h-14 w-full bg-[#4CAF50] text-lg text-white hover:bg-[#4CAF50]/90"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Betala med Swish
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ---- Overlays ---- */}
      <AnimatePresence>
        {/* Swish QR overlay */}
        {checkoutStep === "qr" && (
          <motion.div
            key="qr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            <Smartphone className="mx-auto mb-4 h-16 w-16 text-[#4CAF50]" />
            <h2 className="mb-2 text-3xl font-bold">Betala med Swish</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Skanna QR-koden med Swish-appen
            </p>
            <div className="mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed">
              <span className="text-muted-foreground">QR-kod</span>
            </div>
            <p className="mb-8 text-2xl font-bold">{cartTotal} kr</p>
            <Button variant="outline" size="lg" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Avbryt
            </Button>
          </motion.div>
        )}

        {/* NFC checkout overlay */}
        {checkoutStep === "nfc" && (
          <motion.div
            key="nfc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            {!nfcError ? (
              <div className="flex flex-col items-center text-center">
                {/* Testläge-badge */}
                {tenant.sumupTestMode && (
                  <Badge className="mb-8 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    TESTLÄGE — inga riktiga pengar dras
                  </Badge>
                )}

                {/* Pulserande ring med CreditCard-ikon */}
                <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-[#00B4D8]"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [1, 0.4, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-[#00B4D8]/50"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                  />
                  <CreditCard className="h-16 w-16 text-[#00B4D8]" />
                </div>

                <h2 className="mb-2 text-3xl font-bold">
                  Håll kortet mot läsaren
                </h2>
                <p className="mb-6 max-w-sm text-lg text-muted-foreground">
                  Håll ditt kort eller telefon mot kortläsaren på skärmen
                </p>

                {/* Animerad pil åt höger */}
                <motion.div
                  className="mb-8 flex items-center gap-2 text-[#00B4D8]"
                  animate={{ x: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-8 w-8" />
                </motion.div>

                <p className="mb-8 text-2xl font-bold">{cartTotal} kr</p>

                <Button variant="outline" size="lg" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Avbryt
                </Button>
              </div>
            ) : (
              /* Felmeddelande med Försök igen / Avbryt */
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                  <X className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">
                  Betalningen misslyckades
                </h2>
                <p className="mb-8 max-w-sm text-lg text-muted-foreground">
                  {nfcError}
                </p>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={handleNfcRetry}
                    className="bg-[#00B4D8] text-white hover:bg-[#00B4D8]/90"
                  >
                    Försök igen
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleCancel}>
                    Avbryt
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Thank you overlay */}
        {checkoutStep === "thankyou" && (
          <motion.div
            key="thankyou"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
            >
              <Check className="h-12 w-12 text-green-600" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-bold">Tack för ditt köp!</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Din betalning är genomförd
            </p>
            <Button size="lg" onClick={handleThankYouDone}>
              Klar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
