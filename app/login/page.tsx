"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../../lib/firebaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      setError('');
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const token = await userCredential.user.getIdToken();
      
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (!res.ok) throw new Error('Session creation failed');
      
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };
  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col md:flex-row">
      
{/* Left Conceptual Column */}
<div className="hidden md:flex md:w-1/2 lg:w-[55%] relative bg-inverse-surface items-center justify-center p-12 overflow-hidden">
{/* Abstract Background Element representing data flows */}
<div className="absolute inset-0 bg-gradient-to-br from-inverse-surface via-[#1f2329] to-[#0f1215] z-0"></div>
<img alt="Data visualization" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 z-10" data-alt="A macro photograph of an intricate, futuristic architectural structure or data server rack bathed in cinematic, low-key lighting. The scene relies heavily on deep blacks and cool, muted cyan/blue tones, emphasizing high-tech density and institutional stability. Sharp lines and precise geometry reflect a high-stakes enterprise environment. The mood is highly professional, secure, and technologically advanced." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdGOIY_UikwKhrxCHsexIcZS8uf-wO2kv83qPjqZEl5HLRTB3hkGaePGZldDWlpqYTO7diR40xFqFoEpITGJDWRIKbyJSjLqMM5JqqLP0sz-bPEdCs8fzXN9V4BV3VuhaXcU0vnP_Qt9uqDKMgddUOmUucyp7ZVx7Y4SqIWIVkHvWpgIYPpd741iro2ijvMqcFQbFsXRTGAgXwA_32sp6Lfvi1wBfDD_JdDVaVAoPjcUClkvBOLLEZLEXnYDzM5FBtXpE2iZ67CldN"/>
{/* Overlay Content */}
<div className="relative z-20 max-w-lg">
<div className="flex items-center gap-3 mb-8">
<span className="material-symbols-outlined text-inverse-primary text-[32px]">database</span>
<span className="font-h2 text-h2 text-inverse-primary">Enterprise OS</span>
</div>
<h2 className="font-h1 text-h1 text-on-primary mb-6">Unified Resource Management</h2>
<p className="font-body-lg text-body-lg text-outline-variant mb-12">
                Secure access to your core infrastructure, financial modules, and supply chain analytics. Designed for density and precision.
            </p>
{/* Metric Sparkline Decor */}
<div className="flex gap-4 opacity-80">
<div className="bg-surface-container-highest/20 border border-outline-variant/30 rounded p-4 backdrop-blur-sm flex-1">
<p className="font-label-caps text-label-caps text-inverse-primary mb-1">System Uptime</p>
<p className="font-h3 text-h3 text-on-primary">99.99%</p>
</div>
<div className="bg-surface-container-highest/20 border border-outline-variant/30 rounded p-4 backdrop-blur-sm flex-1">
<p className="font-label-caps text-label-caps text-inverse-primary mb-1">Active Nodes</p>
<p className="font-h3 text-h3 text-on-primary">2,408</p>
</div>
</div>
</div>
</div>
{/* Right Authentication Column */}
<div className="flex-1 flex flex-col justify-center bg-surface-container-lowest px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] border-l border-outline-variant">
<div className="w-full max-w-[420px] mx-auto">
{/* Mobile Brand Header (Visible only on small screens) */}
<div className="md:hidden flex items-center gap-2 mb-10">
<span className="material-symbols-outlined text-primary text-[28px]">database</span>
<span className="font-h3 text-h3 text-primary">Enterprise OS</span>
</div>
{/* Header */}
<div className="mb-8">
<h1 className="font-h1 text-h1 text-primary mb-2">Welcome back</h1>
<p className="font-body-md text-body-md text-on-surface-variant">Please enter your corporate credentials to continue.</p>
</div>
{/* Login / Signup Toggle */}
<div className="flex bg-surface-container-low p-1 rounded-lg mb-8 border border-surface-variant">
<button className="flex-1 py-2 px-4 rounded font-body-sm text-body-sm font-semibold bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50 transition-all">
                    Log In
                </button>
<button className="flex-1 py-2 px-4 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
                    Request Access
                </button>
</div>
{/* Auth Form */}
<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
{error && <div className="text-error text-body-sm font-semibold">{error}</div>}
{/* Email Field */}
<div>
<label className="block font-body-sm text-body-sm text-on-surface-variant mb-1.5" htmlFor="email">Corporate Email</label>
<div className="relative">
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<span className="material-symbols-outlined text-outline text-[18px]">mail</span>
</div>
<input {...register("email", { required: true })} className="block w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-on-tertiary-container/30 focus:border-on-tertiary-container transition-shadow" id="email" type="email" placeholder="name@company.com" required/>
</div>
</div>
{/* Password Field */}
<div>
<div className="flex items-center justify-between mb-1.5">
<label className="block font-body-sm text-body-sm text-on-surface-variant" htmlFor="password">Password</label>
<a className="font-body-sm text-body-sm text-on-tertiary-container hover:underline" href="#">Forgot Password?</a>
</div>
<div className="relative">
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<span className="material-symbols-outlined text-outline text-[18px]">lock</span>
</div>
<input {...register("password", { required: true })} className="block w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-primary placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-on-tertiary-container/30 focus:border-on-tertiary-container transition-shadow" id="password" type="password" placeholder="••••••••" required/>
<div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
<span className="material-symbols-outlined text-outline text-[18px] hover:text-on-surface-variant transition-colors">visibility_off</span>
</div>
</div>
</div>
{/* Primary Action */}
<div className="pt-2">
<button disabled={isSubmitting} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-inverse-surface active:scale-[0.98] transition-all disabled:opacity-50" type="submit">
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
</div>
</form>
{/* Divider */}
<div className="mt-8 mb-6 relative">
<div aria-hidden="true" className="absolute inset-0 flex items-center">
<div className="w-full border-t border-outline-variant"></div>
</div>
<div className="relative flex justify-center">
<span className="px-3 bg-surface-container-lowest font-body-sm text-body-sm text-outline">or continue with</span>
</div>
</div>
{/* SSO Options */}
<div className="space-y-3">
<button className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-outline-variant rounded bg-surface-container-lowest text-primary font-body-md text-body-md hover:bg-surface-container-low transition-colors" type="button">
<span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                    Sign in with SSO
                </button>
</div>
{/* Footer / Legal */}
<div className="mt-12 text-center">
<p className="font-body-sm text-body-sm text-outline">
                    By signing in, you agree to our 
                    <a className="text-on-surface-variant underline hover:text-primary" href="#">Terms of Service</a> and 
                    <a className="text-on-surface-variant underline hover:text-primary" href="#">Privacy Policy</a>.
                </p>
</div>
</div>
</div>

    </div>
  );
}
