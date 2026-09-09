import "../../styles/footer-style.css";
import { yearValue } from "../../lib/generadorFechas";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <p><strong>{t("footer.platform_name")}</strong><br />{t("footer.school_name")}<br />{t("footer.university_name")} · © {yearValue}</p>
                </div>
                <div className="footer-section">
                    <h4>{t("footer.policies")}</h4>
                    <ul>
                        <li><Link to="/politicaPrivacidad">{t("footer.privacy_policy")}</Link></li>
                        <li><Link to="/cookies">{t("footer.cookies_policy")}</Link></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
