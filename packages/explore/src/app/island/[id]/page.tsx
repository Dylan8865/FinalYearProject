import { supabase } from "@/lib/supabase";
import { IslandType, IslandItemType, ItemDataType } from "@/types/island";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IslandPage({ params }: Props) {
  const { id } = await params;

  // 1. Fetch Island Details
  const { data: island, error: islandError } = await supabase
    .from("island")
    .select("*")
    .eq("id", id)
    .single();

  if (islandError) {
    return (
      <div className="p-8 text-center text-red-400">
        Error loading island: {islandError.message}
      </div>
    );
  }

  if (!island) {
    return <div className="p-8 text-center">Island not found</div>;
  }

  // 2. Fetch Island Items (Functional Items)
  const { data: items, error: itemsError } = await supabase
    .from("island-item")
    .select("*, item(*)")
    .eq("island_id", id);

  if (itemsError) {
    console.error("Error loading items:", itemsError);
  }

  const islandItems = (items as IslandItemType[]) || [];

  // 3. Fetch Item Content (Knowledge) for each item
  const itemIds = islandItems.map((i) => i.id);
  let itemDataMap: Record<string, ItemDataType[]> = {};

  if (itemIds.length > 0) {
    const { data: contentData, error: contentError } = await supabase
      .from("item-data")
      .select("*")
      .in("island_item_id", itemIds)
      // .eq('valid', true) // displaying all content for now
      .order("order_index", { ascending: true });

    if (contentError) {
      console.error("Error loading item content:", contentError);
    } else {
      contentData?.forEach((d) => {
        if (!itemDataMap[d.island_item_id!]) {
          itemDataMap[d.island_item_id!] = [];
        }
        itemDataMap[d.island_item_id!].push(d as ItemDataType);
      });
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-950 text-white p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          {island.name}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">{island.description}</p>
        <div className="mt-4 flex gap-4 justify-center text-sm text-gray-500">
          <span>Level: {island.level}</span>
          <span>Theme: {island.theme}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {islandItems
          .filter((item) => item.item?.type === "functional")
          .map((item) => (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                    <span className="text-xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {item.title || item.item?.name || "Untitled Item"}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      {item.item?.type}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {itemDataMap[item.id]?.map((block) => (
                    <div key={block.id} className="text-gray-300 text-sm">
                      {renderBlockContent(block)}
                    </div>
                  ))}
                  {!itemDataMap[item.id]?.length && (
                    <p className="text-gray-600 italic text-sm">
                      No knowledge content yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function renderBlockContent(block: ItemDataType) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          {block.content?.text ||
            (typeof block.content === "string" ? block.content : "")}
        </p>
      );
    case "heading_1":
      return (
        <h4 className="text-xl font-bold text-white mt-2">
          {block.content?.text}
        </h4>
      );
    case "heading_2":
      return (
        <h5 className="text-lg font-bold text-white mt-2">
          {block.content?.text}
        </h5>
      );
    case "bulleted_list":
      return <li className="ml-4 list-disc">{block.content?.text}</li>;
    case "image":
      return block.content?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.content.url}
          alt="Content"
          className="rounded-lg w-full mt-2"
        />
      ) : null;
    case "code":
      return (
        <pre className="bg-black/50 p-3 rounded-md overflow-x-auto text-xs font-mono">
          <code>{block.content?.text}</code>
        </pre>
      );
    default:
      return <p>{JSON.stringify(block.content)}</p>;
  }
}
