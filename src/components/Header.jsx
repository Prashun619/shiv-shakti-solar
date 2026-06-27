function Header() {
  return (
    <header
      style={{
        background: "#0d47a1",
        color: "white",
        padding: "15px 30px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
      }}
    >

      <img
        src="/logo.jpeg"
        alt="logo"
        style={{
          width: "100px",
          height: "100px",
          objectFit: "contain",
        }}
      />

      <div
        style={{
          fontSize: "60px",
          fontWeight: "bold",
        }}
      >
        Shiv Shakti Solar ERP
      </div>

    </header>
  );
}

export default Header;