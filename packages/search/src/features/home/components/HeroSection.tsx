import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        Search Wisdom Island
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-gray-600">
        Discover and explore knowledge across the entire Wisdom Island ecosystem.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/search"
          className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Start Searching
        </Link>
        <Link
          href="/register"
          className="rounded-md border px-6 py-3 hover:bg-gray-50"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
