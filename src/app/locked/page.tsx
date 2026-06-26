export default function LockedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Access Required</h1>
        <p className="text-sm text-zinc-500">
          You need an invite link to access RAIL Tracker.
          Ask your administrator for the link.
        </p>
      </div>
    </div>
  );
}
