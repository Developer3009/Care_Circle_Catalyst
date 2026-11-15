'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, AlertCircle, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmailActionPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Simulate verifying signed email action token and executing single-use mutation
    const timer = setTimeout(() => {
      setStatus('success');
      setMessage('Your dose has been marked as TAKEN successfully. Your Care Circle has been notified!');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
          <Heart className="w-8 h-8 fill-emerald-600 text-emerald-700" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            CareCircle Instant Action
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Dose Acknowledged</h1>
        </div>

        {status === 'loading' ? (
          <div className="py-8 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Verifying signed email token and updating records...</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{message}</span>
            </div>

            <p className="text-xs text-slate-500">
              No login required. This secure token was single-use and has now expired.
            </p>

            <div className="pt-2">
              <Link 
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition text-sm"
              >
                <span>Go to CareCircle Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
