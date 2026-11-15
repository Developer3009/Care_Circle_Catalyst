import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Users, UserCheck, Shield, KeyRound, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { apiErrorMessage } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { UserOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PersonaMode = "ELDER" | "FAMILY_DOCTOR" | "CARETAKER_PROXY";

export default function Register() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState<PersonaMode>("ELDER");
  
  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Elder specific fields
  const [elderAge, setElderAge] = useState("74");
  const [circleName, setCircleName] = useState("");

  // Family / Doctor specific fields
  const [passcode, setPasscode] = useState("");
  const [joinRole, setJoinRole] = useState("FAMILY");

  // Caretaker Proxy specific fields (Creating on behalf of elder)
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("75");

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: () => {
      return apiPost<{ user: UserOut; passcode?: string; circle_name?: string }>("/auth/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        persona,
        elder_age: elderAge,
        circle_name: circleName.trim() || `${fullName.trim().split(" ")[0]}'s Care Circle`,
        passcode: passcode.trim().toUpperCase(),
        join_role: joinRole,
        patient_name: patientName.trim(),
        patient_age: patientAge
      });
    },
    onSuccess: (data) => {
      beginSession();
      if (persona === "ELDER") {
        toast.success(`Welcome ${fullName}! Your Care Circle has been created with passcode: ${data.passcode || 'CARE789'}`);
      } else if (persona === "CARETAKER_PROXY") {
        toast.success(`Account and Care Circle for ${patientName} created successfully! Passcode: ${data.passcode || 'CARE789'}`);
      } else {
        toast.success(`Request sent to join ${data.circle_name || 'Care Circle'}!`);
      }
      navigate("/app", { replace: true });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A252C] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8" data-testid="register-page">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-[#116B70]">
            <Heart className="h-8 w-8 fill-[#116B70] text-[#116B70]" />
            <span>CareCircle</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Get Started with CareCircle</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Choose how you wish to register. We keep the elder in charge while giving families and caretakers proactive visibility.
          </p>
        </div>

        {/* 3 Persona Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPersona("ELDER")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
              persona === "ELDER"
                ? "border-[#116B70] bg-[#E8F2EF] shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {persona === "ELDER" && (
              <span className="absolute top-3 right-3 text-[#116B70]">
                <CheckCircle2 className="w-5 h-5 fill-[#116B70] text-white" />
              </span>
            )}
            <div className="text-2xl mb-2">👴</div>
            <h3 className="font-bold text-slate-900 text-sm">I am the Elder / Patient</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create your profile & generate a passcode for your family.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPersona("FAMILY_DOCTOR")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
              persona === "FAMILY_DOCTOR"
                ? "border-[#116B70] bg-[#E8F2EF] shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {persona === "FAMILY_DOCTOR" && (
              <span className="absolute top-3 right-3 text-[#116B70]">
                <CheckCircle2 className="w-5 h-5 fill-[#116B70] text-white" />
              </span>
            )}
            <div className="text-2xl mb-2">👨‍👩‍👧</div>
            <h3 className="font-bold text-slate-900 text-sm">Family or Doctor</h3>
            <p className="text-xs text-slate-500 mt-1">
              Join an existing elder's circle using their secret passcode.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPersona("CARETAKER_PROXY")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
              persona === "CARETAKER_PROXY"
                ? "border-[#116B70] bg-[#E8F2EF] shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {persona === "CARETAKER_PROXY" && (
              <span className="absolute top-3 right-3 text-[#116B70]">
                <CheckCircle2 className="w-5 h-5 fill-[#116B70] text-white" />
              </span>
            )}
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="font-bold text-slate-900 text-sm">Setup on Elder's Behalf</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create circle for an elderly parent or patient as caretaker.
            </p>
          </button>
        </div>

        {/* Dynamic Form based on Persona */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate();
            }}
          >
            {/* Persona 1: Elder Self-Registration */}
            {persona === "ELDER" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Elder-First Advantage:</strong> We will automatically generate your Circle Passcode so you can share it with your daughter, son, or doctor!
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="elder-name" className="font-bold text-slate-800">Your Full Name</Label>
                    <Input
                      id="elder-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      required
                      minLength={2}
                      className="text-base py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="elder-age" className="font-bold text-slate-800">Your Age</Label>
                    <Input
                      id="elder-age"
                      type="number"
                      value={elderAge}
                      onChange={(e) => setElderAge(e.target.value)}
                      placeholder="e.g. 74"
                      required
                      className="text-base py-2.5 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="elder-circle" className="font-bold text-slate-800">Circle Name (Optional)</Label>
                  <Input
                    id="elder-circle"
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    placeholder="e.g. Dad's Health Circle"
                    className="text-base py-2.5 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Persona 2: Family Member or Doctor Joining with Passcode */}
            {persona === "FAMILY_DOCTOR" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>
                    <strong>Passcode Required:</strong> Enter the 8-character passcode provided by your elderly family member to request access.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passcode" className="font-bold text-slate-800">Elder's Circle Passcode</Label>
                  <Input
                    id="passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                    placeholder="e.g. CARE-7890"
                    required
                    className="font-mono text-lg tracking-widest uppercase py-2.5 rounded-xl bg-slate-50"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fam-name" className="font-bold text-slate-800">Your Full Name</Label>
                    <Input
                      id="fam-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      required
                      minLength={2}
                      className="text-base py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-800">Your Relationship / Role</Label>
                    <select
                      value={joinRole}
                      onChange={(e) => setJoinRole(e.target.value)}
                      className="w-full h-10 px-3 py-2 border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#116B70]"
                    >
                      <option value="FAMILY">Family Member (Son/Daughter)</option>
                      <option value="CARETAKER">Primary Caretaker</option>
                      <option value="DOCTOR_VIEWER">Doctor / Medical Clinician (Read-only)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Persona 3: Caretaker Proxy Creating on Elder's Behalf */}
            {persona === "CARETAKER_PROXY" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-700 shrink-0" />
                  <span>
                    <strong>Setup on Elder's Behalf:</strong> You will be the primary administrator, and the patient profile will be configured under your care.
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="patient-name" className="font-bold text-slate-800">Elder / Patient Name</Label>
                    <Input
                      id="patient-name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      required
                      className="text-base py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="patient-age" className="font-bold text-slate-800">Elder Age</Label>
                    <Input
                      id="patient-age"
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="e.g. 75"
                      required
                      className="text-base py-2.5 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="caretaker-name" className="font-bold text-slate-800">Your Name (Caretaker/Relative)</Label>
                  <Input
                    id="caretaker-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sunita Verma"
                    required
                    className="text-base py-2.5 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Common Account Credentials */}
            <div className="pt-2 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-bold text-slate-800">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="text-base py-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-bold text-slate-800">
                  {persona === "ELDER" ? "Simple Password / 6-Digit PIN" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={persona === "ELDER" ? "e.g. 123456 or password" : "At least 6 characters"}
                  required
                  minLength={4}
                  className="text-base py-2.5 rounded-xl"
                />
              </div>
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              size="lg"
              disabled={registerMutation.isPending}
              className="w-full bg-[#116B70] hover:bg-[#0d5357] text-white font-bold text-base py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>
                {registerMutation.isPending
                  ? "Setting up your account..."
                  : persona === "ELDER"
                  ? "Create Account & Generate Circle Passcode"
                  : persona === "FAMILY_DOCTOR"
                  ? "Join Care Circle with Passcode"
                  : "Create Elder Care Circle"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#116B70] hover:underline">
              Sign In here
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
