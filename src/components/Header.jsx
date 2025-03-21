export default function Header() {
  return (
    <header className="garage-header">
      <div className="garage-header-content">
        <a href="https://www.withgarage.com/" target="_blank" rel="noopener noreferrer">
          <img src="/logo-2.jpeg" alt="Garage Logo" className="garage-logo" />
        </a>
        <h1 className="garage-title">Garage Invoice Generator</h1>
      </div>
      <p className="garage-subtitle">
        Create and email invoices for Garage fire truck listings
      </p>
    </header>
  );
}
