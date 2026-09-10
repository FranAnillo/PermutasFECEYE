import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MobileBottomNavigation from "../MobileBottomNavigation.jsx";

function renderNavigation(variant, path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MobileBottomNavigation variant={variant} />
    </MemoryRouter>,
  );
}

describe("MobileBottomNavigation", () => {
  it("offers the five principal student destinations and marks the current page", () => {
    renderNavigation("student", "/solicitarPermuta");

    const navigation = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    expect(navigation).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Solicitar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("href", "/miPerfil");
  });

  it("uses the administrator destinations without exposing student actions", () => {
    renderNavigation("admin", "/incidencias");

    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Incidencias" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/gestionUsuarios");
    expect(screen.queryByRole("link", { name: "Solicitar" })).not.toBeInTheDocument();
  });
});
