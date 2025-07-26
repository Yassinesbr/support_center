export default function StudentProfile() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <h2>{data.name}</h2>
        <p>Email: {data.email}</p>
      </div>
    </div>
  );
}
