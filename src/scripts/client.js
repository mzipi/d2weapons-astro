document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const weaponsContainer = document.getElementById("weapons-container");
    const loadingMessage = document.getElementById("loading-message");
    const buttonsContainer = document.getElementById("buttons-container");
    const prevButton = document.getElementById("prev-page");
    const nextButton = document.getElementById("next-page");

    let currentPage = 1;
    let totalPages = 1;

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            currentPage = 1;
            fetchWeapons(searchInput.value);
        }
    });

    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchWeapons(searchInput.value);
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchWeapons(searchInput.value);
        }
    });

    async function fetchWeapons(searchTerm) {
        try {
            const response = await fetch('/api/weaponsByPerk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ perk: searchTerm }),
            });

            const data = await response.json();
            const weapons = data.weapons;
            totalPages = data.totalPages;

            weaponsContainer.innerHTML = "";

            if (weapons.length > 0) {
                weapons.forEach((weapon) => {
                    const div = document.createElement("div");
                    div.classList.add("weapon");
                    div.innerHTML = `
                    <div class="weapon-image-container">
                        <img src="${weapon.icon}" alt="${weapon.name}" class="weapon-icon">
                        ${weapon.iconWatermark ? `<img src="${weapon.iconWatermark}" alt="watermark" class="weapon-watermark">` : ""}
                    </div>
                    <strong>${weapon.name}</strong><br>
                    <em>${weapon.flavorText || "No hay descripción"}</em><br>
                    <h4>Perks:</h4>
                    <div class="sockets-container">
                        ${weapon.sockets && weapon.sockets.length > 0
                            ? weapon.sockets
                                .map((socket, index) => {
                                    return `
                                    <div class="socket">
                                        <strong>${socket.itemTypeDisplayName || "Desconocido"}</strong>
                                        <ul>
                                            ${socket.perks.length > 0
                                                ? socket.perks
                                                    .map(
                                                        (perk) => `
                                                        <li>
                                                            ${perk.icon ? `<img src="https://www.bungie.net${perk.icon}" alt="${perk.name}" title="${perk.name}">` : ""}
                                                        </li>
                                                    `,
                                                    )
                                                    .join("")
                                                : "<li>No hay perks disponibles</li>"
                                            }
                                        </ul>
                                    </div>
                                `;
                                })
                                .join("")
                            : "<p>No tiene sockets con perks aleatorios</p>"
                        }
                    </div>
                    `;
                    weaponsContainer.appendChild(div);
                });
            } else {
                weaponsContainer.innerHTML = "<p>No se encontraron armas.</p>";
            }

            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages || totalPages === 0;
        } catch (error) {
            weaponsContainer.innerHTML = "<p>Error al cargar los datos.</p>";
            console.error("Error en fetchWeapons:", error);
        }
    }
});