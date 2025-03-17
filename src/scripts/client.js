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
        weaponsContainer.innerHTML = "";

        const query = `
            query ($searchTerm: String!, $page: Int!, $resultsPerPage: Int!) {
                weapons(search: $searchTerm, page: $page, resultsPerPage: $resultsPerPage) {
                    weapons {
                        displayProperties {
                            name
                            icon
                            description
                            hasIcon
                        }
                        iconWatermark
                        flavorText
                        ammoTypeName
                        damageTypeIcon
                        itemSubType
                        equipmentSlotName
                        stats {
                            statName
                            value
                        }
                        breakerTypeIcon
                        sockets {
                            itemTypeDisplayName
                            perks {
                                name
                                icon
                                itemTypeDisplayName
                            }
                        }
                    }
                    totalPages
                    currentPage
                }
            }
        `;

        const variables = {
            searchTerm: searchTerm,
            page: currentPage,
            resultsPerPage: 1, // Establecemos que quieres 1 resultado por página
        };

        try {
            const response = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables,
                }),
            });

            const data = await response.json();
            const weapons = data.data.weapons.weapons;
            totalPages = data.data.weapons.totalPages;

            weaponsContainer.innerHTML = "";

            if (weapons.length > 0) {
                weapons.forEach((weapon) => {
                    const div = document.createElement("div");
                    div.classList.add("weapon");

                    const iconUrl = `https://www.bungie.net${weapon.displayProperties.icon}`;
                    const watermarkUrl = weapon.iconWatermark
                        ? `https://www.bungie.net${weapon.iconWatermark}`
                        : "";

                    div.innerHTML = `
                    <div class="weapon-image-container">
                        <img src="${iconUrl}" alt="${weapon.displayProperties.name}" class="weapon-icon">
                        ${watermarkUrl ? `<img src="${watermarkUrl}" alt="watermark" class="weapon-watermark">` : ""}
                    </div>
                    <strong>${weapon.displayProperties.name}</strong><br>
                    <em>${weapon.flavorText || "No hay descripción"}</em><br>
                    <h4>Perks:</h4>
                    <div class="sockets-container">
                    ${weapon.sockets && weapon.sockets.length > 1
                            ? [...weapon.sockets.slice(1, 5), weapon.sockets[7]]
                                .filter(Boolean)
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
                                                                ${perk.icon ? `<img src="https://www.bungie.net${perk.icon}" alt="${perk.name}">` : ""}
                                                                ${perk.name}
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

                    console.log(`weapon: ${weapon.displayProperties.name}`);
                    weapon.sockets.forEach((socket, index) => {
                        console.log(`Socket ${index + 1}: ${socket.itemTypeDisplayName || "Desconocido"}`);
                        socket.perks.forEach((perk) => {
                            console.log(`- Perk: ${perk.name} ${perk.icon ? `, Icono: ${perk.icon}` : ""}`);
                        });
                    });
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
