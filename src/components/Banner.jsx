export default function Banner({ banner }) {
  return (
    <div className={`email-banner ${banner.isError ? "error" : "success"}`}>
      {banner.message}
    </div>
  );
}
