import Footer from "../components/comun/footer";
import NavbarAdmin from "../components/administrador/NavbarAdmin";
import { Outlet } from "react-router-dom";
import MobileBottomNavigation from "../components/comun/MobileBottomNavigation";

export default function LayoutAdmin() {
    return (
        <>
            <NavbarAdmin />
            <main className="app-layout-main app-layout-main--admin">
                <Outlet />
            </main>
            <MobileBottomNavigation variant="admin" />
            <Footer />
        </>
    );
}
