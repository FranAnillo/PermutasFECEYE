import Footer from "../components/comun/footer";
import NavbarEstudiante from "../components/usuario/NavbarEstudiante";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { comprobarAsignaturasSinGrupo } from "../services/asignaturas";

export default function LayoutEstudiante() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const verificarAsignaturas = async () => {
            const ignorePaths = ["/seleccionarGrupos", "/seleccionarAsignaturas", "/login", "/noRegistrado"];

            if (ignorePaths.includes(location.pathname)) {
                return;
            }

            try {
                const res = await comprobarAsignaturasSinGrupo();
                console.log("[LayoutEstudiante] Ruta actual:", location.pathname);
                console.log("[LayoutEstudiante] Respuesta API bruta (JSON):", JSON.stringify(res));

                // Analizamos la respuesta para encontrar un valor true
                // Estructura posible A: { err: false, result: true }
                // Estructura posible B: { err: false, result: { result: true } }
                // Estructura posible C: { err: false, result: { err: false, result: { result: true } } }

                let hasUnassignedSubjects = false;
                const data = res.result;

                if (data === true) {
                    hasUnassignedSubjects = true;
                } else if (data?.result === true) {
                    hasUnassignedSubjects = true;
                } else if (data?.result?.result === true) {
                    hasUnassignedSubjects = true;
                }

                console.log("[LayoutEstudiante] ¿Tiene asignaturas sin grupo?:", hasUnassignedSubjects);

                if (!res.err && hasUnassignedSubjects) {
                    console.log("[LayoutEstudiante] Redirigiendo a /seleccionarGrupos...");
                    navigate("/seleccionarGrupos");
                }
            } catch (error) {
                console.error("[LayoutEstudiante] Error crítico en verificación:", error);
            }

        };

        verificarAsignaturas();
    }, [location.pathname, navigate]);


    return (
        <>
            <NavbarEstudiante />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}