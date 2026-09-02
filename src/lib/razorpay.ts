// Razorpay Client-Side SDK Loader and Checkout Trigger

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
}

export async function triggerRazorpayPayment(options: RazorpayCheckoutOptions): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    console.error("Failed to load Razorpay checkout script");
    return false;
  }

  const rzpOptions = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency || "INR",
    name: options.name || "Raya by Razorpay",
    description: options.description || "Autonomous Multi-Store Checkout",
    order_id: options.orderId,
    handler: function (response: any) {
      options.onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    prefill: options.prefill || {
      name: "Jane Doe",
      email: "buyer@example.com",
      contact: "9876543210",
    },
    theme: {
      color: "#0C8CE9", // Signature Razorpay Blue
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) options.onDismiss();
      },
    },
  };

  try {
    const rzp = new (window as any).Razorpay(rzpOptions);
    rzp.open();
    return true;
  } catch (err) {
    console.error("Error opening Razorpay modal:", err);
    return false;
  }
}
