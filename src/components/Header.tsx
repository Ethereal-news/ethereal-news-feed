import FetchButton from "./FetchButton";

export default function Header({ itemCount }: { itemCount: number }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ethereal news feed
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </p>
      </div>
      <FetchButton />
    </header>
  );
}
