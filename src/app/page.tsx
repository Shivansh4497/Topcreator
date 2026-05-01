import OnboardingForm from "@/components/OnboardingForm";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black text-white">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Topcreator</h1>
          <p className="text-zinc-400 text-lg">AI-powered Instagram Growth Engine</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <OnboardingForm />
        </div>
        
        <p className="text-center text-zinc-600 text-xs mt-8">
          By connecting your Instagram, you agree to our Terms of Service and Privacy Policy. We never post without your permission.
        </p>
      </div>
    </div>
  );
}
