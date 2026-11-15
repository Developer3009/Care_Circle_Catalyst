import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Activity,
  BarChart3,
  BellRing,
  HeartHandshake,
  KeyRound,
  Pill,
  ShieldCheck,
  Siren,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HERO_IMG =
  "https://images.unsplash.com/photo-1758691462321-9b6c98c40f7e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHw0fHxoYXBweSUyMGVsZGVybHklMjBwZXJzb24lMjBkb2N0b3IlMjBjYXJlZ2l2ZXJ8ZW58MHx8fHwxNzk0NzMxMDEwfDA&ixlib=rb-4.1.0&q=85";

const FEATURES = [
  { icon: Pill, title: "Medications & schedules", copy: "Schedule builder, stock tracking and refill predictions — the dose engine plans the next 7 days." },
  { icon: BellRing, title: "Escalation ladder", copy: "Missed dose? The elder is reminded first, the caretaker after 15 minutes, family after 45." },
  { icon: ShieldCheck, title: "Consent center", copy: "The elder approves every member, sets per-module visibility, and sees a full audit trail." },
  { icon: BarChart3, title: "Adherence reports", copy: "Weekly scores, streaks and a doctor visit summary built from the dose log." },
  { icon: Siren, title: "Emergency card", copy: "A public-by-QR SOS page: blood group, allergies, conditions, meds and who to call." },
  { icon: Volume2, title: "Elder mode", copy: "High contrast, big touch targets and a voice that reads the day’s schedule aloud." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  return (
    <div className="min-h-svh bg-[#F8F9FA] text-[#1A252C]" data-testid="landing-page">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-7 w-7 text-[#116B70]" aria-hidden />
          <span className="font-heading text-xl font-semibold">CareCircle</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link to="/login" />} data-testid="landing-login-link">
            Sign in
          </Button>
          <Button render={<Link to="/register" />} data-testid="landing-signup-link">
            Get started
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:px-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F0EF] px-3 py-1 text-sm font-medium text-[#0F4C50]">
              <Activity className="h-4 w-4" aria-hidden /> One care circle around every elder
            </p>
            <h1 className="font-heading text-5xl font-semibold leading-tight md:text-[52px]">
              Medicines, appointments and family — finally on the same page.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[#52636F]">
              CareCircle keeps elderly parents at the centre: big one-tap doses they can’t miss,
              caretakers who see the day, and family who get alerted the moment something slips.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link to="/register" />} data-testid="landing-cta-signup">
                Start your circle
              </Button>
              <Button size="lg" variant="outline" render={<Link to="/login" />} data-testid="landing-cta-login">
                Sign in
              </Button>
            </div>
            <form
              className="mt-8 flex max-w-md items-center gap-2 rounded-2xl border bg-card p-2 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) navigate(`/join?code=${encodeURIComponent(code.trim().toUpperCase())}`);
              }}
            >
              <KeyRound className="ml-2 h-4 w-4 shrink-0 text-[#116B70]" aria-hidden />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Have a passcode? CARE-XXXXXX"
                className="border-0 shadow-none focus-visible:ring-0"
                data-testid="landing-passcode-input"
              />
              <Button type="submit" data-testid="landing-passcode-join-button">Join</Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            className="relative"
          >
            <img
              src={HERO_IMG}
              alt="Doctor talking warmly with an elderly patient at home"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg"
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ background: "linear-gradient(135deg, rgba(15,40,42,0.35) 0%, rgba(17,107,112,0.12) 100%)" }}
              aria-hidden
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur">
              <p className="font-heading text-lg font-semibold">“Dad took his 8 AM doses — both of them.”</p>
              <p className="text-sm text-[#52636F]">One tap, and the whole circle knows.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
              <f.icon className="h-7 w-7 text-[#116B70]" aria-hidden />
              <h3 className="mt-3 font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-[#52636F]">{f.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-[#52636F]">
        CareCircle — elder-centric care, built with consent and accountability.
      </footer>
    </div>
  );
}
