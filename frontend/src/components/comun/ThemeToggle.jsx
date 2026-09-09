import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'light' ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            aria-label="Cambiar tema"
        >
            <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
        </button>
    );
}
