import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Share2, 
  KeyRound, 
  ShieldCheck, 
  Users,
  Check
} from "lucide-react";
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
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [elderAge, setElderAge] = useState("74");
  const [circleName, setCircleName] = useState("");

  // Other persona fields
  const [passcode, setPasscode] = useState("");
  const [joinRole, setJoinRole] = useState("FAMILY");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("75");

  // Post-creation Success Modal State for Elder
  const [createdPasscode, setCreatedPasscode] = useState<string | null>(null);
  const [createdCircleName, setCreatedCircleName] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
      if (persona === "ELDER" && data.passcode) {
        // Save to localStorage for instant persistent session
        localStorage.setItem("carecircle_user", JSON.stringify(data.user));
        localStorage.setItem("carecircle_passcode", data.passcode);
        setCreatedPasscode(data.passcode);
        setCreatedCircleName(data.circle_name || `${fullName}'s Care Circle`);
        toast.success(`Care Circle created successfully!`);
      } else {
        toast.success(`Welcome to CareCircle!`);
        navigate("/app", { replace: true });
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleCopyPasscode = () => {
    if (createdPasscode) {
      navigator.clipboard.writeText(createdPasscode);
      setCopied(true);
      toast.success("Passcode copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (createdPasscode) {
      const text = `Namaste! I have created my Care Circle on CareCircle. Please join with my secret passcode: *${createdPasscode}* to see my medications and daily schedule.`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A252C] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8" data-testid="register-page">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-[#116B70]">
            <Heart className="h-8 w-8 fill-[#116B70] text-[#116B70]" />
            <span>CareCircle</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Create Patient / Elder Circle</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            The elder owns the circle. A secret passcode is instantly created so your family and doctors can stay connected.
          </p>
        </div>

        {/* 3 Persona Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPersona("ELDER")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
              persona === "ELDER"
                ? "border-[#116B70] bg-[#E8F2EF] shadow-md ring-2 ring-[#116B70]/20"
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
              Create account & get your family join passcode.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPersona("FAMILY_DOCTOR")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
              persona === "FAMILY_DOCTOR"
                ? "border-[#116B70] bg-[#E8F2EF] shadow-md ring-2 ring-[#116B70]/20"
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
              Join an existing circle using an elder's passcode.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPersona("CARETAKER_PROXY")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
              persona === "CARETAKER_PROXY"
                ? "border-[#116B70] bg-[#E8F2EF] shadow-md ring-2 ring-[#116B70]/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {persona === "CARETAKER_PROXY" && (
              <span className="absolute top-3 right-3 text-[#116B70]">
                <CheckCircle2 className="w-5 h-5 fill-[#116B70] text-white" />
              </span>
            )}
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="font-bold text-slate-900 text-sm">Setup for Elder</h3>
            <p className="text-xs text-slate-500 mt-1">
              Caretaker configuring on elder's behalf.
            </p>
          </button>
        </div>

        {/* Dynamic Form Area */}
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
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-xl shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-emerald-950 font-bold">Elder Circle Creator Active</strong>
                    <span className="text-xs text-emerald-800">
                      When you submit, your account is saved to Supabase, a private Care Circle is established, and your family's <strong>Secret Passcode</strong> is generated immediately.
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="elder-name" className="font-bold text-slate-800">Your Full Name (Elder/Patient)</Label>
                    <Input
                      id="elder-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      required
                      minLength={2}
                      className="text-base py-2.5 rounded-xl border-slate-300 focus:border-[#116B70]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="elder-age" className="font-bold text-slate-800">Age</Label>
                    <Input
                      id="elder-age"
                      type="number"
                      value={elderAge}
                      onChange={(e) => setElderAge(e.target.value)}
                      placeholder="e.g. 74"
                      required
                      className="text-base py-2.5 rounded-xl border-slate-300 focus:border-[#116B70]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="elder-circle" className="font-bold text-slate-800">Care Circle Name</Label>
                  <Input
                    id="elder-circle"
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    placeholder={fullName ? `${fullName}'s Health Circle` : "e.g. Dad's Care Circle"}
                    className="text-base py-2.5 rounded-xl border-slate-300 focus:border-[#116B70]"
                  />
                  <p className="text-[11px] text-slate-500">
                    This is what your family and doctors will see when they join.
                  </p>
                </div>
              </div>
            )}

            {/* Persona 2: Family or Doctor */}
            {persona === "FAMILY_DOCTOR" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="passcode" className="font-bold text-slate-800">Enter Elder's Passcode</Label>
                  <Input
                    id="passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                    placeholder="e.g. CARE789"
                    required
                    className="font-mono text-lg tracking-widest uppercase py-2.5 rounded-xl bg-slate-50 border-slate-300"
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
                      className="text-base py-2.5 rounded-xl border-slate-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-800">Joining Role</Label>
                    <select
                      value={joinRole}
                      onChange={(e) => setJoinRole(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#116B70]"
                    >
                      <option value="FAMILY">Family Member (Son/Daughter)</option>
                      <option value="CARETAKER">Primary Caretaker</option>
                      <option value="DOCTOR_VIEWER">Doctor (Read-only)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Persona 3: Caretaker Proxy */}
            {persona === "CARETAKER_PROXY" && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="patient-name" className="font-bold text-slate-800">Elder / Patient Name</Label>
                    <Input
                      id="patient-name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      required
                      className="text-base py-2.5 rounded-xl border-slate-300"
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
                      className="text-base py-2.5 rounded-xl border-slate-300"
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
                    className="text-base py-2.5 rounded-xl border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Common Credentials */}
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
                  className="text-base py-2.5 rounded-xl border-slate-300 focus:border-[#116B70]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-bold text-slate-800">
                  {persona === "ELDER" ? "Simple Password or 6-Digit PIN" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={persona === "ELDER" ? "e.g. 123456 or password" : "At least 6 characters"}
                  required
                  minLength={4}
                  className="text-base py-2.5 rounded-xl border-slate-300 focus:border-[#116B70]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={registerMutation.isPending}
              className="w-full bg-[#116B70] hover:bg-[#0d5357] text-white font-bold text-base py-3.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>
                {registerMutation.isPending
                  ? "Creating Circle in Supabase..."
                  : persona === "ELDER"
                  ? "Create Account & Generate Passcode"
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

      {/* POPUP MODAL: ELDER PASSCODE READY (Option 1 Specific Flow) */}
      {createdPasscode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-9 h-9 text-[#116B70]" />
            </div>

            <div>
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Circle Created Successfully!
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{createdCircleName}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Share this passcode with your daughter, son, caretaker, or doctor.
              </p>
            </div>

            {/* Highlighted Passcode Box */}
            <div className="bg-slate-50 border-2 border-dashed border-[#116B70] p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                Your Secret Circle Passcode
              </span>
              <div className="font-mono text-3xl font-black tracking-widest text-[#116B70] select-all">
                {createdPasscode}
              </div>
              <p className="text-[10px] text-slate-400">
                Expires in 48 hours • Valid for family and doctors
              </p>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyPasscode}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-800 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
            </div>

            {/* Continue to Dashboard */}
            <Button
              onClick={() => navigate("/app", { replace: true })}
              className="w-full bg-[#116B70] hover:bg-[#0d5357] text-white font-bold py-3 rounded-2xl shadow-md text-sm"
            >
              <span>Continue to Today's Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
