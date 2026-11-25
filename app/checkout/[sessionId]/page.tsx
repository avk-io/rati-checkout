"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { api, type CheckoutAddress, type CheckoutSession } from "@/lib/api"
import {
  DEMO_OTP,
  createDemoOrder,
  demoAddress,
  demoCustomer,
  getDemoSession,
  isDemoSessionId,
} from "@/lib/demo"
import type { Order } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  CheckCircle2Icon, ShieldCheckIcon, TruckIcon, RefreshCwIcon, MapPinIcon,
  ChevronLeftIcon, ChevronDownIcon, CircleUserIcon, IndianRupeeIcon, InfoIcon,
  ArrowRightIcon,
} from "lucide-react"

const NAVY = "#262d63"

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN")

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-1 pb-1.5 pt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">{children}</p>
}

export default function CheckoutPage() {
  const params = useParams()
  const sessionIdFromUrl = params?.sessionId as string | undefined
  const isDemo = isDemoSessionId(sessionIdFromUrl)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [step, setStep] = useState<"phone" | "otp" | "shipping" | "success">("phone")

  // Phone & OTP state
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Customer & Address state
  const [savedAddresses, setSavedAddresses] = useState<CheckoutAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [house, setHouse] = useState("")
  const [landmark, setLandmark] = useState("")
  const [pincode, setPincode] = useState("411001")
  const [city, setCity] = useState("Pune")
  const [state, setState] = useState("Maharashtra")

  // UI state
  const [editingAddress, setEditingAddress] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const [showItems, setShowItems] = useState(false)

  // Order submission
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  // Load or initialize checkout session
  useEffect(() => {
    if (isDemo) {
      setSession(getDemoSession())
      setLoading(false)
      return
    }

    if (sessionIdFromUrl) {
      api.getCheckoutSession(sessionIdFromUrl)
        .then(res => {
          setSession(res)
          setLoading(false)
        })
        .catch(() => {
          setSession(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [sessionIdFromUrl, isDemo])

  // Timer countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Pincode auto-lookup
  const handlePincodeChange = (pin: string) => {
    setPincode(pin)
    if (pin.length === 6) {
      if (pin.startsWith("110")) { setCity("New Delhi"); setState("Delhi") }
      else if (pin.startsWith("400")) { setCity("Mumbai"); setState("Maharashtra") }
      else if (pin.startsWith("411")) { setCity("Pune"); setState("Maharashtra") }
      else if (pin.startsWith("560")) { setCity("Bengaluru"); setState("Karnataka") }
      else if (pin.startsWith("600")) { setCity("Chennai"); setState("Tamil Nadu") }
      else if (pin.startsWith("500")) { setCity("Hyderabad"); setState("Telangana") }
      else if (pin.startsWith("700")) { setCity("Kolkata"); setState("West Bengal") }
      else if (pin.startsWith("380")) { setCity("Ahmedabad"); setState("Gujarat") }
    }
  }

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10)
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number")
      return
    }

    if (isDemo) {
      setSendingOtp(true)
      setTimeout(() => {
        setDevOtp(DEMO_OTP)
        setCountdown(30)
        setStep("otp")
        setSendingOtp(false)
        toast.success("Demo OTP sent to +91 " + cleanPhone)
      }, 500)
      return
    }

    const activeSessionId = session?.sessionId || sessionIdFromUrl
    if (!activeSessionId) {
      toast.error("This checkout session is missing. Please return to the store and try again.")
      return
    }

    setSendingOtp(true)
    try {
      const res = await api.sendCheckoutOtp(cleanPhone, activeSessionId)
      if (res.devOtp) {
        setDevOtp(res.devOtp)
      }
      setCountdown(30)
      setStep("otp")
      toast.success("OTP sent to +91 " + cleanPhone)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send OTP")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast.error("Please enter the OTP")
      return
    }

    if (isDemo) {
      if (otp !== DEMO_OTP) {
        toast.error(`Use the demo OTP ${DEMO_OTP}`)
        return
      }
      setName(demoCustomer.name)
      setEmail(demoCustomer.email)
      setSavedAddresses([demoAddress])
      setSelectedAddressId(demoAddress.id)
      setHouse(demoAddress.house)
      setLandmark(demoAddress.landmark || "")
      setPincode(demoAddress.pincode)
      setCity(demoAddress.city)
      setState(demoAddress.state)
      setEditingAddress(false)
      setStep("shipping")
      toast.success("Phone verified (demo)")
      return
    }

    setVerifyingOtp(true)
    try {
      const activeSessionId = session?.sessionId || sessionIdFromUrl
      if (!activeSessionId) {
        toast.error("This checkout session is missing. Please return to the store and try again.")
        setVerifyingOtp(false)
        return
      }
      const res = await api.verifyCheckoutOtp(phone, otp, activeSessionId)
      if (!res.verified) {
        toast.error(res.error || "Invalid OTP code")
        setVerifyingOtp(false)
        return
      }

      toast.success("Phone verified successfully!")
      if (res.customer?.name) {
        setName(res.customer.name)
        if (res.customer.email) setEmail(res.customer.email)
      }

      if (res.addresses && res.addresses.length > 0) {
        setSavedAddresses(res.addresses)
        const defaultAddr = res.addresses.find((a) => a.isDefault) || res.addresses[0]
        setSelectedAddressId(defaultAddr.id)
        setHouse(defaultAddr.house)
        setLandmark(defaultAddr.landmark || "")
        setPincode(defaultAddr.pincode)
        setCity(defaultAddr.city)
        setState(defaultAddr.state)
        setEditingAddress(false)
      } else {
        setEditingAddress(true)
      }

      setStep("shipping")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const cartItems = session?.cart?.items || []
  const subtotal = Number(session?.cart?.subtotal ?? cartItems.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0))
  const mrpTotal = cartItems.reduce((acc, it) => acc + ((it.mrp ?? it.price) * (it.quantity || 1)), 0)
  const saved = Math.max(0, mrpTotal - subtotal)
  const codFee = Number(session?.cart?.codFee ?? session?.brand?.codFee ?? 0)
  const codTotal = Number(session?.cart?.amount ?? (subtotal + codFee))
  const itemCount = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0)

  const handlePlaceOrder = async () => {
    if (!name.trim()) {
      toast.error("Please enter your full name")
      setEditingAddress(true)
      return
    }
    if (!house.trim()) {
      toast.error("Please enter your house/flat/building address")
      setEditingAddress(true)
      return
    }
    if (!pincode.trim() || pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit delivery pincode")
      setEditingAddress(true)
      return
    }

    if (isDemo) {
      setSubmittingOrder(true)
      setTimeout(() => {
        const order = createDemoOrder({
          name: name.trim(),
          phone: phone.replace(/\D/g, "").slice(-10),
          email: email.trim() || undefined,
          city,
          state,
          pincode,
          house: house.trim(),
          landmark: landmark.trim() || undefined,
          amount: codTotal,
          items: cartItems,
        })
        setConfirmedOrder(order)
        setStep("success")
        setSubmittingOrder(false)
        toast.success("Demo order placed — no real order was created.")
      }, 700)
      return
    }

    setSubmittingOrder(true)
    try {
      const orderData = {
        sessionId: session?.sessionId || sessionIdFromUrl,
        name: name.trim(),
        phone: phone.replace(/\D/g, "").slice(-10),
        email: email.trim() || undefined,
        city,
        state,
        pincode,
        house: house.trim(),
        address: house.trim() + (landmark ? `, Near ${landmark.trim()}` : ""),
        landmark: landmark.trim() || undefined,
      }

      const res = await api.createCheckoutOrder(orderData)
      const order = res.order || res
      const returnUrl = res.returnUrl

      if (returnUrl) {
        toast.success("Order placed successfully! Redirecting...")
        setTimeout(() => {
          window.location.href = returnUrl
        }, 600)
      } else {
        setConfirmedOrder(order)
        setStep("success")
        toast.success("Order placed successfully via Cash on Delivery!")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order placement failed")
    } finally {
      setSubmittingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCwIcon className="size-5 animate-spin" style={{ color: NAVY }} />
          Loading secure checkout session...
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg">
          <InfoIcon className="mx-auto size-10 text-amber-500" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">Checkout Session Not Found</h2>
          <p className="mt-1.5 text-xs text-slate-600">
            This checkout session has expired or does not exist. Please return to the merchant&apos;s store and click &quot;Buy Now&quot; again.
          </p>
          <a
            href="/checkout/demo"
            className="mt-4 inline-block text-xs font-semibold underline"
            style={{ color: NAVY }}
          >
            Open the demo checkout
          </a>
        </div>
      </div>
    )
  }

  const brandName = session?.brand?.name || "Merchant Checkout"

  return (
    <div className="min-h-screen bg-slate-200/60">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#f5f5f7] shadow-xl">
        {/* Header */}
        <header
          className="sticky top-0 z-30 border-b border-amber-100 px-3 pb-2.5 pt-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10px 8px, #f59e0b 5px, transparent 6px), radial-gradient(circle at 30px 8px, #fbbf24 5px, transparent 6px), linear-gradient(#fff1b8, #fffbea)",
            backgroundSize: "40px 18px, 40px 18px, 100% 100%",
            backgroundRepeat: "repeat-x, repeat-x, no-repeat",
          }}
        >
          <div className="flex items-center gap-2">
            <ChevronLeftIcon className="size-4 shrink-0 text-slate-900" />
            <span className="text-[15px] font-bold uppercase tracking-[0.25em]" style={{ color: NAVY }}>
              {brandName}
            </span>
            <div className="ml-auto flex flex-col items-end">
              {saved > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                    {inr(saved)} saved so far
                  </span>
                  <span className="text-slate-500">• {itemCount} item{itemCount > 1 ? "s" : ""}</span>
                </div>
              )}
              <div className="flex items-center gap-1 pt-0.5">
                {saved > 0 && <span className="text-xs text-slate-500 line-through">{inr(mrpTotal)}</span>}
                <span className="text-lg font-bold text-slate-900">{inr(subtotal)}</span>
                <button type="button" onClick={() => setShowItems(v => !v)} aria-label="Toggle items">
                  <ChevronDownIcon className={`size-4 text-slate-600 transition-transform ${showItems ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>
          {showItems && (
            <div className="mt-2 space-y-1.5 rounded-lg bg-white/80 p-3 text-xs">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-3">
                  <span className="text-slate-700">{item.name} × {item.quantity || 1}</span>
                  <span className="font-medium text-slate-900">{inr(item.price * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>
          )}
          {isDemo && (
            <div className="mt-2 rounded-md bg-slate-900/90 px-2.5 py-1 text-center text-[10px] font-medium text-white">
              Demo mode — sample cart, no real order will be placed
            </div>
          )}
        </header>

        <main className="px-3 pb-8">
          {step === "success" && confirmedOrder ? (
            <div className="space-y-5 py-8 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2Icon className="size-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Thank you, <span className="font-medium text-slate-900">{name}</span>. Your order has been placed.
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Reference:</span>
                  <span className="font-mono font-bold" style={{ color: NAVY }}>{confirmedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-medium">Cash on Delivery (COD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Payable:</span>
                  <span className="text-base font-bold">₹{confirmedOrder.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Address:</span>
                  <span className="max-w-[200px] truncate text-right font-medium">{house}, {city} - {pincode}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <TruckIcon className="size-4 text-emerald-600" />
                You will receive order updates from {brandName}.
              </div>
              {isDemo && (
                <p className="text-[11px] font-medium text-amber-700">
                  This is a demo confirmation. No order was sent to a merchant.
                </p>
              )}
            </div>
          ) : step === "phone" || step === "otp" ? (
            <div className="pt-4">
              <SectionLabel>Login</SectionLabel>
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                {step === "phone" && (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-600">Enter 10-Digit Mobile Number</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="select-none rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                          +91
                        </div>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                          className="text-base font-medium tracking-wide"
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSendOtp}
                      disabled={sendingOtp || phone.length !== 10}
                      className="w-full py-5 font-semibold text-white"
                      style={{ background: NAVY }}
                    >
                      {sendingOtp ? "Sending OTP..." : "Continue with OTP"}
                      <ArrowRightIcon className="ml-1.5 size-4" />
                    </Button>
                  </>
                )}

                {step === "otp" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        OTP sent to <span className="font-semibold text-slate-900">+91 {phone}</span>
                      </span>
                      <button type="button" className="text-xs font-semibold" style={{ color: NAVY }} onClick={() => setStep("phone")}>
                        Change
                      </button>
                    </div>

                    {devOtp && (
                      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                        <span>Dev Mode Auto-OTP: <strong className="font-mono text-sm">{devOtp}</strong></span>
                        <Button size="sm" variant="outline" className="h-7 border-amber-300 bg-white text-xs" onClick={() => setOtp(devOtp)}>
                          Auto Fill
                        </Button>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-600">Enter 6-Digit OTP</p>
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="mt-1.5 text-center font-mono text-xl tracking-widest"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Didn&apos;t receive code?</span>
                      {countdown > 0 ? (
                        <span>Resend in {countdown}s</span>
                      ) : (
                        <button type="button" onClick={handleSendOtp} className="font-semibold" style={{ color: NAVY }}>
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length < 4}
                      className="w-full py-5 font-semibold text-white"
                      style={{ background: NAVY }}
                    >
                      {verifyingOtp ? "Verifying..." : "Verify & Continue"}
                      <ArrowRightIcon className="ml-1.5 size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Delivery details */}
              <SectionLabel>Delivery Details</SectionLabel>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="relative flex items-start gap-2.5">
                  <MapPinIcon className="mt-0.5 size-5 shrink-0 text-slate-600" />
                  <div className="min-w-0 flex-1 text-[13px] leading-snug text-slate-700">
                    <p className="text-sm font-semibold text-slate-900">Deliver To {name || "—"}</p>
                    <p className="mt-0.5">
                      {house ? house + (landmark ? `, Near ${landmark}` : "") : "Add your delivery address"}
                    </p>
                    <p>{city}, {state}, {pincode}</p>
                    <p className="truncate text-xs text-slate-500">
                      +91 {phone}{email ? ` | ${email}` : ""}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    {showTip && (
                      <div className="absolute -top-9 right-0 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                        Tap To Edit Address
                        <span className="absolute -bottom-1 right-6 size-2 rotate-45 bg-slate-900" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowTip(false); setEditingAddress(v => !v) }}
                      className="rounded-lg border border-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-900"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {editingAddress && (
                  <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                    {savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id)
                              setHouse(addr.house)
                              setLandmark(addr.landmark || "")
                              setPincode(addr.pincode)
                              setCity(addr.city)
                              setState(addr.state)
                            }}
                            className={`cursor-pointer rounded-lg border p-2.5 text-sm ${
                              selectedAddressId === addr.id ? "border-slate-900 bg-slate-50" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-slate-900">{addr.house}</span>
                              {addr.isDefault && <span className="text-[10px] font-semibold text-emerald-700">Default</span>}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">{addr.city}, {addr.state} - {addr.pincode}</div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-xs font-semibold"
                          style={{ color: NAVY }}
                          onClick={() => setSelectedAddressId("new")}
                        >
                          + Enter a different address
                        </button>
                      </div>
                    )}

                    {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <p className="text-xs text-slate-600">Full Name</p>
                            <Input placeholder="e.g. Rahul Sharma" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Email (Optional)</p>
                            <Input placeholder="rahul@gmail.com" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Flat / House No. / Building Name / Street</p>
                          <Input placeholder="e.g. Flat 302, Green Valley Apts, MG Road" value={house} onChange={e => setHouse(e.target.value)} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <p className="text-xs text-slate-600">Pincode</p>
                            <Input placeholder="411001" maxLength={6} value={pincode} onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ""))} className="mt-1 font-mono" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">City</p>
                            <Input placeholder="Pune" value={city} onChange={e => setCity(e.target.value)} className="mt-1" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">State</p>
                            <Input placeholder="Maharashtra" value={state} onChange={e => setState(e.target.value)} className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Landmark (Optional)</p>
                          <Input placeholder="e.g. Near Metro Station / Behind City Hospital" value={landmark} onChange={e => setLandmark(e.target.value)} className="mt-1" />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setEditingAddress(false)}
                      className="w-full font-semibold text-white"
                      style={{ background: NAVY }}
                    >
                      Save Address
                    </Button>
                  </div>
                )}

                <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-[13px] font-medium text-slate-800">Delivery</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Delivery time depends on your pincode and courier availability.
                  </p>
                </div>
              </div>

              {/* Trust & delivery info */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
                  <TruckIcon className="mx-auto size-5 text-emerald-600" />
                  <p className="mt-1 text-[10px] font-medium text-slate-700">COD Delivery</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
                  <ShieldCheckIcon className="mx-auto size-5 text-emerald-600" />
                  <p className="mt-1 text-[10px] font-medium text-slate-700">Secure Checkout</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
                  <RefreshCwIcon className="mx-auto size-5 text-emerald-600" />
                  <p className="mt-1 text-[10px] font-medium text-slate-700">Brand Return Policy</p>
                </div>
              </div>


              {/* Why COD */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-xs font-semibold text-slate-900 mb-2">Why Cash on Delivery?</p>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2Icon className="size-3.5 text-emerald-600 shrink-0" /> Pay only when you receive your order</li>
                  <li className="flex items-center gap-2"><CheckCircle2Icon className="size-3.5 text-emerald-600 shrink-0" /> No upfront payment required</li>
                  <li className="flex items-center gap-2"><CheckCircle2Icon className="size-3.5 text-emerald-600 shrink-0" /> Inspect before you pay</li>
                </ul>
              </div>

              {/* Payment options - COD only */}
              <SectionLabel>Payment</SectionLabel>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
                    <IndianRupeeIcon className="size-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Cash on Delivery</p>
                    <p className="text-xs text-slate-500">Pay when you receive your order</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{inr(codTotal)}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-medium text-slate-900">{inr(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                {codFee > 0 ? (
                  <div className="flex justify-between text-slate-600">
                    <span>COD Fee</span>
                    <span className="font-medium text-slate-900">{inr(codFee)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>COD Fee</span>
                    <span className="font-semibold text-emerald-600">FREE</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Payable (COD)</span>
                  <span className="text-base" style={{ color: NAVY }}>{inr(codTotal)}</span>
                </div>
              </div>

              {/* Buy Now Button */}
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={submittingOrder}
                  className="w-full py-6 text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
                  style={{ background: NAVY }}
                >
                  {submittingOrder ? (
                    <span className="flex items-center gap-2">
                      <RefreshCwIcon className="size-4 animate-spin" /> Placing Order...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Buy Now — {inr(codTotal)} <ArrowRightIcon className="size-4" />
                    </span>
                  )}
                </Button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Clicking Buy Now places your Cash on Delivery order
                </p>
              </div>

              <p className="mt-2.5 text-center text-[11px] text-slate-500">
                Only Cash on Delivery is available
              </p>

              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-[13px]">
                <CircleUserIcon className="size-5 text-slate-500" />
                <span className="text-slate-800">Logged in using +91 {phone}</span>
                <button
                  type="button"
                  className="ml-auto text-[13px] font-bold text-slate-900"
                  onClick={() => { setStep("phone"); setOtp(""); setDevOtp(null) }}
                >
                  Logout
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-2 text-center">
                <span className="text-[10px] italic text-slate-500">Powered By</span>
                <span className="text-lg font-extrabold text-slate-800">Rati Logistics</span>
                <div className="flex items-center gap-3 text-[9px] leading-tight text-slate-500">
                  <span className="flex items-center gap-1"><ShieldCheckIcon className="size-5 text-slate-400" />100% Secured<br />Checkout</span>
                  <span className="flex items-center gap-1"><ShieldCheckIcon className="size-5 text-slate-400" />Verified<br />Merchant</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-700">
                  By proceeding, I agree to Rati&apos;s <span className="underline">Privacy Policy</span> and <span className="underline">T&amp;C</span>
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
