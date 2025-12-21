"use client";

import { useRouter } from "next/navigation";

interface Stats {
  shop: {
    functional: number;
    decorative: number;
    terrain: number;
    total: number;
  };
  knowledge: {
    pending: number;
    declined: number;
    verified: number;
    total: number;
  };
  users: {
    admin: number;
    island: number;
    nonIsland: number;
    total: number;
  };
}

interface DashboardCardsProps {
  stats: Stats;
}

export default function DashboardCards({ stats }: DashboardCardsProps) {
  const router = useRouter();

  const totalShop = stats.shop.total || (stats.shop.functional + stats.shop.decorative + stats.shop.terrain);

  return (
    <div className="pl-8 pr-8 pt-2">
      <div className="grid grid-cols-2 grid-rows-2 gap-6 h-[calc(100vh-120px)]">
        {/* Shop Management - Takes 2 rows on left */}
        <div className="row-span-2">
          <MainCard
            title="Shop Management"
            description="Manage shop items, prices, etc."
            onClick={() => router.push("/shop")}
            horizontal={false}
            badge={totalShop > 0 ? `${totalShop} items` : undefined}
          >
            <SubCard
              title="Functional Items"
              description="Items capable of generating mana"
              count={stats.shop.functional}
              onClick={() => router.push("/shop?filter=functional")}
            />
            <SubCard
              title="Decorative Items"
              description="Items incapable of generating mana"
              count={stats.shop.decorative}
              onClick={() => router.push("/shop?filter=decorative")}
            />
            <SubCard
              title="Terrain Items"
              description="Items for terrain modification"
              count={stats.shop.terrain}
              onClick={() => router.push("/shop?filter=terrain")}
            />
          </MainCard>
        </div>

        {/* Knowledge-base Moderation - Top right */}
        <div>
          <MainCard
            title="Knowledge-base Moderation"
            description="Manage user contributed knowledge"
            onClick={() => router.push("/knowledge")}
            horizontal={true}
            badge={stats.knowledge.pending > 0 ? `${stats.knowledge.pending} pending` : undefined}
            badgeColor={stats.knowledge.pending > 0 ? "bg-yellow-600" : undefined}
          >
            <SubCard
              title="Pending"
              description="55%-59%"
              count={stats.knowledge.pending}
              onClick={() => router.push("/knowledge?filter=pending")}
            />
            <SubCard
              title="Declined"
              description="≤54%"
              count={stats.knowledge.declined}
              onClick={() => router.push("/knowledge?filter=declined")}
            />
            <SubCard
              title="Verified"
              description="≥60%"
              count={stats.knowledge.verified}
              onClick={() => router.push("/knowledge?filter=verified")}
            />
          </MainCard>
        </div>

        {/* User Management - Bottom right */}
        <MainCard
          title="User Management"
          description="Manage registered users"
          onClick={() => router.push("/user")}
          horizontal={true}
          badge={stats.users.total > 0 ? `${stats.users.total} users` : undefined}
        >
          <SubCard
            title="Admin"
            description="Admin Dashboard Access Accounts"
            count={stats.users.admin}
            onClick={() => router.push("/user?filter=admin")}
          />
          <SubCard
            title="Island"
            description="Wisdom Island Game Accounts"
            count={stats.users.island}
            onClick={() => router.push("/user?filter=island")}
          />
          <SubCard
            title="Non-Island"
            description="Non-Wisdom Island Game Accounts"
            count={stats.users.nonIsland}
            onClick={() => router.push("/user?filter=non-island")}
          />
        </MainCard>
      </div>
    </div>
  );
}

// Main Card Component
interface MainCardProps {
  title: string;
  description: string;
  onClick: () => void;
  children: React.ReactNode;
  horizontal?: boolean;
  badge?: string;
  badgeColor?: string;
}

function MainCard({ title, description, onClick, children, horizontal = false, badge, badgeColor = "bg-gray-600" }: MainCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[#333333] rounded-lg p-6 h-full flex flex-col cursor-pointer hover:bg-[#3a3a3a] transition-colors relative group"
    >
      {/* Title and Description */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-white text-xl font-semibold">{title}</h2>
          {badge && (
            <span className={`${badgeColor} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-white text-xs">{description}</p>
      </div>

      {/* Arrow Icon */}
      <div className="absolute top-6 right-6 text-white text-2xl group-hover:translate-x-1 transition-transform">
        &gt;
      </div>

      {/* Sub Cards */}
      <div className={`flex-1 grid place-content-center ${horizontal ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
        {children}
      </div>
    </div>
  );
}

// Sub Card Component
interface SubCardProps {
  title: string;
  description: string;
  count: number;
  onClick: (e: React.MouseEvent) => void;
}

function SubCard({ title, description, count, onClick }: SubCardProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="bg-[#333333] rounded-lg px-4 pt-3 pb-0 hover:bg-[#252525] transition-colors cursor-pointer border border-[#7B7B7B]"
    >
      <h3 className="text-white font-semibold text-base mb-0">{title}</h3>
      <p className="text-white text-xs mb-5">{description}</p>
      <p className="text-white text-3xl font-bold text-right mb-2">{count}</p>
    </div>
  );
}