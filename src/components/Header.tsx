import FetchButton from "./FetchButton";

export default function Header({ itemCount }: { itemCount: number }) {
  return (
    <header className="flex items-center justify-between pb-6 mb-6" style={{ borderBottom: "var(--border)" }}>
      <div>
        <h1 className="text-3xl font-black uppercase" style={{ letterSpacing: "-0.05em", color: "var(--black)" }}>
          Ethereal news feed
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: "var(--gray-dark)" }}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </p>
      </div>
      <FetchButton />
    </header>
  );
}
