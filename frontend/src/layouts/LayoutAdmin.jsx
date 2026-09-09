import Footer from "../components/comun/footer";
import NavbarAdmin from "../components/administrador/NavbarAdmin";
import { Outlet } from "react-router-dom";

export default function LayoutAdmin() {
    return (
        <>
            <NavbarAdmin />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}