import TopNav from "./components/TopNav";
import ExploreClient from "./components/ExploreClient";

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main className="px-10 py-8">
        <ExploreClient />
      </main>
    </>
  );
}
