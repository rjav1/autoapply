export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          🚀 AutoApply
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Automate your job applications on Workday, Greenhouse, and more.
          One-click form filling with your saved profile.
        </p>
        
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Dashboard
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-lg mb-2">Save Your Profile</h3>
            <p className="text-gray-600 text-sm">
              Enter your info once. We'll remember your work history, education, and contact details.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">One-Click Fill</h3>
            <p className="text-gray-600 text-sm">
              Our extension detects ATS forms and fills them automatically with your saved data.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Track Applications</h3>
            <p className="text-gray-600 text-sm">
              Keep track of every application you've submitted and their status.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
