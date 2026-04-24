'use client';

import EmailSettings from '@/components/email/EmailSettings';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="p-4 sm:p-6">
        <EmailSettings />
      </div>
    </main>
  );
}
