import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Panel from "../components/Panel";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "For getting oriented",
    features: ["1 workspace", "CSV import up to 500 rows", "50 AI console messages / mo", "Community support"],
  },
  {
    id: "pro",
    name: "Professional",
    price: 199,
    tagline: "For active operators",
    highlight: true,
    features: [
      "5 workspaces",
      "Unlimited CSV import",
      "Unlimited AI console access",
      "Priority support",
      "Custom spend categories",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    tagline: "For teams & funds",
    features: [
      "Unlimited workspaces",
      "Team roles & permissions",
      "Dedicated AI console tuning",
      "SLA-backed support",
      "SSO & audit log",
    ],
  },
];

export default function Subscription({ embedded = false }) {
  const { user, setPlan } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(user?.plan || "starter");
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [redirectTimer, setRedirectTimer] = useState(null);

  useEffect(() => {
    return () => {
      if (redirectTimer) clearInterval(redirectTimer);
    };
  }, [redirectTimer]);

  // FIXED: Function to update subscription plan via API
  const updateSubscriptionPlan = async (planId) => {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscription`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        // FIXED: Send as 'planKey' consistently
        body: JSON.stringify({ planKey: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to update subscription");
      }

      return { ok: true, data };
    } catch (err) {
      console.error("Error updating subscription:", err);
      return { ok: false, error: err.message };
    }
  };

  const showSuccessScreen = (planData) => {
    const firstName = (user?.name || 'User').split(' ')[0];
    const p = planData;
    
    setSubscriptionData({
      name: p.name || p.plan || selectedPlan?.name || 'Plan',
      price: p.price || 0,
      emoji: p.emoji || '✨',
      billing: p.billing || 'monthly',
      startDate: p.startDate || new Date(),
      endDate: p.endDate || null
    });
    
    setShowSuccess(true);
    setConfirmed(true);
    setShowPayment(false);
    
    let secs = 3;
    setCountdown(secs);
    
    if (redirectTimer) clearInterval(redirectTimer);
    const timer = setInterval(() => {
      secs--;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(timer);
        setRedirectTimer(null);
        goToDashboard();
      }
    }, 1000);
    setRedirectTimer(timer);
  };

  const goToDashboard = () => {
    if (!embedded) {
      navigate("/app/dashboard");
    }
  };

  // Handle free plan selection
  async function handleFreePlan(planId) {
    setSelected(planId);
    setError("");
    setIsLoading(true);

    const result = await updateSubscriptionPlan(planId);

    if (!result.ok) {
      setError(result.error || "Failed to update plan. Please try again.");
      setIsLoading(false);
      return;
    }

    setPlan(planId);
    setConfirmed(true);
    setIsLoading(false);
    
    const planData = result.data.subscription || result.data;
    showSuccessScreen(planData);
  }

  // Handle Razorpay payment success
  const handleRazorpaySuccess = async (response, planId) => {
    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("authToken");
      
      const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          planKey: planId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || "Payment verification failed");
      }

      const result = await updateSubscriptionPlan(planId);
      
      if (!result.ok) {
        throw new Error(result.error || "Failed to update subscription");
      }

      setPlan(planId);
      setSelected(planId);
      setIsLoading(false);
      
      const planData = result.data.subscription || result.data;
      showSuccessScreen(planData);

    } catch (error) {
      console.error("Payment processing error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle payment initiation
  const handleProceedToPayment = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("authToken");
      
      // FIXED: Send planKey consistently
      const orderResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          planKey: selectedPlan.id,
          discountPercent: 0 
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "AI Console",
        description: `${selectedPlan.name} Plan Subscription`,
        image: "/logo.png",
        handler: function(response) {
          handleRazorpaySuccess(response, selectedPlan.id);
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#F59E0B'
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            setShowPayment(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error("Payment initiation error:", error);
      setError(error.message || "Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  };

  function handlePaidPlan(plan) {
    setSelectedPlan(plan);
    setShowPayment(true);
    setError("");
  }

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedPlan(null);
    setError("");
    setIsLoading(false);
  };

  async function choose(id) {
    const plan = PLANS.find(p => p.id === id);
    setSelected(id);
    
    if (plan.price === 0) {
      await handleFreePlan(id);
      return;
    }
    
    handlePaidPlan(plan);
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-void-950 bg-hud-grid px-6 py-14"}>
      <div className="max-w-5xl mx-auto">
        {!embedded && (
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-2">
              Choose your tier
            </p>
            <h1 className="font-display text-4xl text-bone mb-3">
              Give your operator the right clearance
            </h1>
            <p className="text-bone/50 max-w-lg mx-auto text-sm">
              Every plan includes the full AI console. Higher tiers unlift usage caps and
              add team-level controls.
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto mb-6 p-3 bg-ember-500/10 border border-ember-500/30 rounded-md">
            <p className="text-ember-400 text-sm text-center">{error}</p>
          </div>
        )}

        {showSuccess && subscriptionData && (
          <div className="fixed inset-0 bg-void-950/95 flex items-center justify-center z-50 p-4">
            <div className="bg-void-900 border border-amber-500/30 rounded-xl p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-display text-bone mb-2">
                Welcome, {(user?.name || 'User').split(' ')[0]}!
              </h2>
              <p className="text-bone/70 mb-4">
                You've subscribed to <strong className="text-amber-400">{subscriptionData.name}</strong>.
              </p>
              <div className="bg-void-800 rounded-lg p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-bone/60">Plan:</span>
                  <span className="text-bone">{subscriptionData.emoji} {subscriptionData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-bone/60">Price:</span>
                  <span className="text-bone">
                    {subscriptionData.price === 0 ? 'Free Forever' : `₹${subscriptionData.price.toLocaleString()}/${subscriptionData.billing === 'monthly' ? 'month' : 'year'}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-bone/60">Start Date:</span>
                  <span className="text-bone">{new Date(subscriptionData.startDate).toLocaleDateString()}</span>
                </div>
                {subscriptionData.endDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-bone/60">Valid Until:</span>
                    <span className="text-bone">{new Date(subscriptionData.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <p className="text-amber-400 text-sm font-mono">
                {countdown > 0 ? `Redirecting in ${countdown} seconds...` : 'Redirecting now...'}
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <Panel
                key={plan.id}
                label={plan.highlight ? "Recommended" : undefined}
                className={`p-6 flex flex-col ${
                  plan.highlight ? "border-amber-500/50 shadow-glow" : ""
                } ${active ? "ring-1 ring-amber-500/50" : ""}`}
              >
                <h3 className="font-display text-xl text-bone mb-1">{plan.name}</h3>
                <p className="text-bone/40 text-xs mb-5">{plan.tagline}</p>
                <div className="mb-6">
                  <span className="text-3xl font-mono text-bone">₹ {plan.price}</span>
                  <span className="text-bone/40 text-sm"> /mo</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-bone/70">
                      <Check size={15} className="text-amber-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => choose(plan.id)}
                  disabled={isLoading || active || showPayment}
                  className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    active
                      ? "bg-amber-500/20 text-amber-400 cursor-default border border-amber-500/30"
                      : isLoading
                      ? "bg-void-800 text-bone/50 cursor-not-allowed border border-void-600"
                      : "bg-void-800 text-bone hover:bg-void-700 border border-void-600 hover:border-void-500"
                  }`}
                >
                  {isLoading && selected === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : active ? (
                    "Current plan"
                  ) : plan.price === 0 ? (
                    "Choose Free Plan"
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </button>
              </Panel>
            );
          })}
        </div>

        {confirmed && !showSuccess && (
          <p className="text-center text-amber-400 text-sm mt-6 font-mono animate-fadeUp">
            PLAN UPDATED — clearance synced
          </p>
        )}

        {showPayment && selectedPlan && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-void-900 border border-void-700 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-display text-bone mb-2">
                Complete Payment
              </h2>
              <p className="text-bone/60 text-sm mb-6">
                You're about to upgrade to the <strong className="text-amber-400">{selectedPlan.name}</strong> plan for <strong>₹{selectedPlan.price}/month</strong>.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLoading}
                  className={`w-full py-3 bg-amber-500 text-void-950 font-semibold rounded-md hover:bg-amber-400 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-void-950/30 border-t-void-950 rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
                <button
                  onClick={handlePaymentCancel}
                  disabled={isLoading}
                  className="w-full py-2 text-bone/50 text-sm hover:text-bone/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}