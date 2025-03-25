import { useState, useEffect } from "react";

export default function WeaponsSearch() {
    const [searchTerm, setSearchTerm] = useState("");
    const [weapons, setWeapons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchWeapons = async (term, page) => {
        setLoading(true);
        try {
            const response = await fetch("/api/weaponsByPerk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ perk: term, page }),
            });

            const data = await response.json();
            setWeapons(data.weapons);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error en fetchWeapons:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (searchTerm) fetchWeapons(searchTerm, currentPage);
    }, [currentPage]);

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            setCurrentPage(1);
            fetchWeapons(searchTerm, 1);
        }
    };

    return (
        <div>
            <input
                type="text"
                id="search"
                placeholder="Buscar perk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
            />

            {loading && <p>Cargando...</p>}

            <div id="weapons-container">
                {
                    weapons.length > 0 ? (
                        weapons.map((weapon, index) => (
                            <div key={weapon.id || `${weapon.name}-${index}`} className="weapon">
                                <div className="weapon-image-container">
                                    <img src={weapon.icon} alt={weapon.name} className="weapon-icon" />
                                    {weapon.iconWatermark && (
                                        <img
                                            src={weapon.iconWatermark}
                                            alt="watermark"
                                            className="weapon-watermark"
                                        />
                                    )}
                                </div>
                                <strong>{weapon.name}</strong><br />
                                <em>{weapon.flavorText || "No hay descripción"}</em><br />
                                <h4>Perks:</h4>
                                <div className="sockets-container">
                                    {weapon.sockets && weapon.sockets.length > 0 ? (
                                        weapon.sockets.map((socket, index) => (
                                            <div key={socket.id || `${socket.itemTypeDisplayName}-${index}`} className="socket">
                                                <strong>{socket.itemTypeDisplayName || "Desconocido"}</strong>
                                                <ul>
                                                    {socket.perks.length > 0 ? (
                                                        socket.perks.map((perk, idx) => (
                                                            <li key={perk.id || `${perk.name}-${idx}`}>
                                                                {perk.icon && (
                                                                    <img
                                                                        src={`https://www.bungie.net${perk.icon}`}
                                                                        alt={perk.name}
                                                                        title={perk.name}
                                                                    />
                                                                )}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>No hay perks disponibles</li>
                                                    )}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No tiene sockets con perks aleatorios</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No se encontraron armas.</p>
                    )
                }
            </div>

            <div id="buttons-container">
                <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                    Anterior
                </button>
                <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= totalPages}>
                    Siguiente
                </button>
            </div>
        </div>
    );
}