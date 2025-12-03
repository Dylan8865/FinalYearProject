import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="border-t py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-xl font-bold">Wisdom Island Search</div>
          <nav className="flex gap-6">
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
              Search
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/register" className="text-gray-600 hover:text-gray-900">
              Register
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Wisdom Island. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
