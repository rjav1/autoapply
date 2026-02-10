"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

interface Application {
  id: string
  jobUrl: string
  company: string
  title: string
  status: string
  notes: string | null
  appliedAt: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  interview: "bg-yellow-100 text-yellow-800",
  offer: "bg-green-100 text-green-800",
  accepted: "bg-green-200 text-green-900",
  withdrawn: "bg-gray-100 text-gray-800",
}

export default function ApplicationsPage() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchApplications()
    }
  }, [session])

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications")
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600">
              Track your job applications in one place
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {applications.length}
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {applications.filter((a) => a.status === "submitted").length}
            </div>
            <div className="text-sm text-gray-600">Submitted</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter((a) => a.status === "interview").length}
            </div>
            <div className="text-sm text-gray-600">Interviews</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {applications.filter((a) => a.status === "offer").length}
            </div>
            <div className="text-sm text-gray-600">Offers</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications yet
              </h3>
              <p className="text-gray-600">
                Your job applications will appear here when you use the AutoApply extension
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{app.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{app.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[app.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(app.appliedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View Job →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex gap-4">
            <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to home
            </a>
            <a
              href="/profile"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Edit Profile →
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
