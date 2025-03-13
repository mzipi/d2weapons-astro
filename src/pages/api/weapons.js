const ammoTypeMap = {
    0: "None",
    1: "Principal",
    2: "Especial",
    3: "Pesada",
    4: "Desconocida"
};

const findAmmoTypeNameFromNodeDefinition = (ammoTypeId, data) => {
    const ammoTypeNameFromMap = ammoTypeMap[ammoTypeId] || "Desconocido";
    const ammoTypeNode = Object.values(data.DestinyPresentationNodeDefinition).find(item => {
        return item.displayProperties?.name === ammoTypeNameFromMap;
    });

    if (ammoTypeNode) {
        const icon = ammoTypeNode.displayProperties.icon;
        return icon ? `https://www.bungie.net${icon}` : null;
    }

    return null;
};

async function getManifestUrl() {
    try {
        const response = await fetch("https://www.bungie.net/Platform/Destiny2/Manifest/");

        if (!response.ok) {
            throw new Error('Error al obtener el manifiesto');
        }

        const data = await response.json();
        const manifestPath = data.Response.jsonWorldContentPaths['es-mx'];
        const manifestUrl = `https://www.bungie.net${manifestPath}`;
        return manifestUrl
    } catch (error) {
        console.error('Error al obtener la URL:', error);
        document.querySelector('h1').innerText = 'Hubo un error al obtener la URL.';
    }
}

export async function GET({ url }) {
    const searchTerm = url.searchParams.get('search')?.toLowerCase();
    const page = parseInt(url.searchParams.get('page') || '1');
    const resultsPerPage = 1;

    const destinyUrl = await getManifestUrl();

    try {
        const response = await fetch(destinyUrl);
        const data = await response.json();

        if (data && data.DestinyInventoryItemDefinition) {
            const weapons = Object.values(data.DestinyInventoryItemDefinition)
                .filter(item => item.itemType === 3)
                .filter(weapon => weapon.displayProperties.name.toLowerCase().includes(searchTerm));

            // Paginación
            const totalResults = weapons.length;
            const totalPages = Math.ceil(totalResults / resultsPerPage);
            const startIndex = (page - 1) * resultsPerPage;
            const endIndex = startIndex + resultsPerPage;

            const weaponsPage = weapons.slice(startIndex, endIndex);

            const weaponsSockets = weaponsPage.map(weapon => {
                const sockets = [];

                const defaultDamageTypeHash = weapon.defaultDamageTypeHash;
                const damageType = data.DestinyDamageTypeDefinition[defaultDamageTypeHash];
                const damageTypeIcon = damageType ? `https://www.bungie.net${damageType.displayProperties.icon}` : null;
                const itemSubType = weapon.itemTypeDisplayName || "Desconocido";
                const equippingBlock = weapon.equippingBlock || {};
                const ammoTypeId = equippingBlock.ammoType || 4;
                const ammoTypeName = findAmmoTypeNameFromNodeDefinition(ammoTypeId, data);
                const equipmentSlotTypeHash = weapon.equippingBlock?.equipmentSlotTypeHash;
                const equipmentSlot = equipmentSlotTypeHash ? data.DestinyEquipmentSlotDefinition[equipmentSlotTypeHash] : null;
                const equipmentSlotName = equipmentSlot ? equipmentSlot.displayProperties.name : "Desconocido";

                const stats = weapon.stats?.stats
                    ? Object.entries(weapon.stats.stats)
                        .filter(([statHash, statData], index) => ![4, 5, 6, 7].includes(index))
                        .map(([statHash, statData]) => {
                            const statDefinition = data.DestinyStatDefinition[statHash];
                            const statName = statDefinition ? statDefinition.displayProperties.name : "Desconocido";
                            return {
                                statName,
                                value: statData.value,
                            };
                        })
                    : [];

                const breakerTypeHash = weapon.breakerTypeHash ? data.DestinyBreakerTypeDefinition[weapon.breakerTypeHash] : null;
                const breakerTypeIcon = breakerTypeHash?.displayProperties?.icon || null;

                if (weapon.sockets && weapon.sockets.socketEntries) {
                    const primerosSockets = [
                        weapon.sockets.socketEntries[0],
                        weapon.sockets.socketEntries[1],
                        weapon.sockets.socketEntries[2],
                        weapon.sockets.socketEntries[3],
                        weapon.sockets.socketEntries[4],
                        weapon.sockets.socketEntries[6],
                        weapon.sockets.socketEntries[7],
                        weapon.sockets.socketEntries[8],
                    ];

                    primerosSockets.forEach((socket, index) => {
                        if (socket) {
                            const socketHash = [0, 5, 6, 7, 8].includes(index)
                                ? socket.reusablePlugSetHash
                                : socket.randomizedPlugSetHash;

                            if (socketHash) {
                                const plugSet = data.DestinyPlugSetDefinition[socketHash];

                                if (plugSet && plugSet.reusablePlugItems) {
                                    const perks = plugSet.reusablePlugItems.map(plug => {
                                        const plugItem = data.DestinyInventoryItemDefinition[plug.plugItemHash];
                                        return plugItem ? {
                                            name: plugItem.displayProperties.name,
                                            icon: plugItem.displayProperties.icon,
                                            itemTypeDisplayName: plugItem.itemTypeDisplayName
                                        } : null;
                                    }).filter(perk => perk !== null);

                                    sockets.push({
                                        itemTypeDisplayName: perks.length > 0 ? perks[0].itemTypeDisplayName : "Desconocido",
                                        perks
                                    });
                                }
                            }
                        }
                    });
                }

                return {
                    ...weapon,
                    ammoTypeName,
                    damageTypeIcon,
                    itemSubType,
                    equipmentSlotName,
                    stats,
                    breakerTypeIcon,
                    sockets
                };
            });

            return new Response(JSON.stringify({
                weapons: weaponsSockets,
                totalPages,
                currentPage: page
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            return new Response(JSON.stringify({ error: 'No se encontraron armas' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}