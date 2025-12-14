export default function FeatureSection() {
  const features = [
    {
      title: "Fast Search",
      description: "Lightning-fast search results powered by advanced indexing.",
    },
    {
      title: "Smart Filters",
      description: "Filter results by type, date, relevance, and more.",
    },
    {
      title: "Cross-Platform",
      description: "Search across all Wisdom Island applications seamlessly.",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">Features</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border p-6 text-center hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
