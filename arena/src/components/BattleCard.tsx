export default function BattleCard({ battle }: any) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-2">{battle.title || "Battle"}</h2>
      <p className="text-sm text-gray-400">Coming soon</p>
    </div>
  );
}
