import { NavLink } from "react-router-dom";

function Sidebar() {
  const menu = [
  { name: "Dashboard", path: "/" },
  { name: "Customers", path: "/customers" },
  { name: "Inventory", path: "/inventory" },
  { name: "Finance Ledger", path: "/finance" },
  { name: "Reports", path: "/reports" },
];
  return (
    <div
      style={{
        width: "150px",
        background: "#1e293b",
        color: "white",
        minHeight: "100vh",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      <h2>Menu</h2>

      {menu.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: "block",
            color: "white",
            textDecoration: "none",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            background: isActive ? "#2563eb" : "transparent",
          })}
        >
          {item.name}
        </NavLink>
      ))}
    </div>
  );
}

export default Sidebar;