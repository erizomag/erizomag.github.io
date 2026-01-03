import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parcel Triage - Multifamily Feasibility Analysis',
  description: 'Analyze parcel buildability for multifamily development',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-gray-900">Parcel Triage</h1>
              <p className="text-sm text-gray-600">Multifamily Feasibility Analysis</p>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-white border-t border-gray-200 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-xs text-gray-500">
                <strong>Disclaimer:</strong> This tool provides preliminary feasibility analysis only.
                It is not a legal determination of buildability. Consult with local planning officials,
                architects, and attorneys before making development decisions.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
