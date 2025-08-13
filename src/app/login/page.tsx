"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem('hair_follicle_auth');
    if (authToken) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Fetch env variable for Flask base URL
    const flaskBaseUrl = process.env.NEXT_PUBLIC_FLASK_BASE_URL;
    const res = await fetch(`${flaskBaseUrl}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    console.log(data);
    if (data.success) {
      // Save auth token to localStorage
      localStorage.setItem('hair_follicle_auth', 'authenticated');
      router.push("/");
    } else {
      setError("Invalid credentials");
    }
  };

  // Background component
  const BackgroundElements = () => (
    <>
      {/* Background gradient elements */}
      <div 
        className="absolute pointer-events-none"
        style={{
          width: '816px',
          height: '816px',
          top: '-228px',
          left: '312px',
          opacity: 0.65,
          background: 'radial-gradient(circle, #FF4542 0%, rgba(255, 66, 61, 0.4) 30%, rgba(255, 66, 61, 0.1) 60%, rgba(255, 66, 61, 0) 100%)',
          filter: 'blur(120px)',
          borderRadius: '50%'
        }}
      ></div>
      <div 
        className="absolute pointer-events-none"
        style={{
          width: '816px',
          height: '816px',
          top: '20%',
          left: '100%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.5,
          background: 'radial-gradient(circle, #FF4542 0%, rgba(255, 66, 61, 0.25) 30%, rgba(255, 66, 61, 0.06) 60%, rgba(255, 66, 61, 0) 100%)',
          filter: 'blur(120px)',
          borderRadius: '100%'
        }}
      ></div>
       <div 
        className="absolute pointer-events-none"
        style={{
          width: '816px',
          height: '816px',
          top: '70%',
          left: '0%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.5,
          background: 'radial-gradient(circle, #FF4542 0%, rgba(255, 66, 61, 0.25) 30%, rgba(255, 66, 61, 0.06) 60%, rgba(255, 66, 61, 0) 100%)',
          filter: 'blur(120px)',
          borderRadius: '100%'
        }}
      ></div>
      {/* Background spiral image - left side */}
      <div className="absolute left-0 top-0 h-full pointer-events-none z-5">
        <img 
          src="/spiral.svg" 
          alt="" 
          className="h-full object-cover opacity-50"
          style={{ objectPosition: 'left center' }}
        />
      </div>
      {/* Background squiggle - right side */}
      <div className="absolute right-8 top-1/2 left-1/2 pointer-events-none z-5">
        <img 
          src="/squiggle.svg" 
          alt="" 
          className="w-48 h-auto opacity-60"
        />
      </div>
    </>
  );

  return (
    <main className="min-h-screen py-10 bg-black text-white relative overflow-hidden">
      <BackgroundElements />
      <div className="mx-auto max-w-6xl px-4 relative z-10">
        <div className="text-4xl font-extrabold text-red-400 mb-12">
          Hair Follicle Segmentation & Triangle Detection
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <section>
            <h1 className="text-4xl font-extrabold text-white">Welcome</h1>
            <h2 className="text-2xl text-neutral-300 font-bold mt-1">Hair Follicle Segmentation & Triangle Detection</h2>
            <p className="text-neutral-400 mt-4">Please enter your credentials to access the application.</p>
          </section>

          <section className="h-[80vh] rounded-3xl border border-white/10 bg-neutral-900/70 p-6 shadow-2xl">
            <div className="text-2xl font-extrabold mb-8">Sign In</div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-neutral-300 text-sm">Username</label>
                <input
                  className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-3 text-neutral-100 outline-none focus:ring-2 focus:ring-rose-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-neutral-300 text-sm">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-3 pr-12 text-neutral-100 outline-none focus:ring-2 focus:ring-rose-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {showPassword ? (
                      // Eye slash icon (hide password)
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      // Eye icon (show password)
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {error && <div className="text-rose-400 text-sm">{error}</div>}
              <button 
                className="w-full rounded-4xl px-6 py-3 font-bold text-white shadow-lg"
                style={{
                  background: 'linear-gradient(62.62deg, #FF4B4B -4.69%, #FF3E37 66.01%, #FFA9A9 105.86%)'
                }}
              >
                Sign In
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}




