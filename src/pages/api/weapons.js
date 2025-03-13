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

export async function GET({ url }) {
    const searchTerm = url.searchParams.get('search')?.toLowerCase();
    const page = parseInt(url.searchParams.get('page') || '1');
    const resultsPerPage = 1;

    const destinyUrl = 'https://www.bungie.net/common/destiny2_content/json/es-mx/aggregate-2c61300f-29d3-419a-abea-a7ba76137527.json';

    try {
        const response = await fetch(destinyUrl);
        const data = await response.json();

        if (data && data.DestinyInventoryItemDefinition) {
            const armas = Object.values(data.DestinyInventoryItemDefinition)
                .filter(item => item.itemType === 3)
                .filter(arma => arma.displayProperties.name.toLowerCase().includes(searchTerm));

            // Paginación
            const totalResults = armas.length;
            const totalPages = Math.ceil(totalResults / resultsPerPage);
            const startIndex = (page - 1) * resultsPerPage;
            const endIndex = startIndex + resultsPerPage;

            const armasPagina = armas.slice(startIndex, endIndex);

            const armasConSockets = armasPagina.map(arma => {
                const sockets = [];

                const defaultDamageTypeHash = arma.defaultDamageTypeHash;
                const damageType = data.DestinyDamageTypeDefinition[defaultDamageTypeHash];
                const damageTypeIcon = damageType ? `https://www.bungie.net${damageType.displayProperties.icon}` : null;
                const itemSubType = arma.itemTypeDisplayName || "Desconocido";
                const equippingBlock = arma.equippingBlock || {};
                const ammoTypeId = equippingBlock.ammoType || 4;
                const ammoTypeName = findAmmoTypeNameFromNodeDefinition(ammoTypeId, data);
                const equipmentSlotTypeHash = arma.equippingBlock?.equipmentSlotTypeHash;
                const equipmentSlot = equipmentSlotTypeHash ? data.DestinyEquipmentSlotDefinition[equipmentSlotTypeHash] : null;
                const equipmentSlotName = equipmentSlot ? equipmentSlot.displayProperties.name : "Desconocido";

                const stats = arma.stats?.stats
                    ? Object.entries(arma.stats.stats)
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

                const breakerTypeHash = arma.breakerTypeHash ? data.DestinyBreakerTypeDefinition[arma.breakerTypeHash] : null;
                const breakerTypeIcon = breakerTypeHash?.displayProperties?.icon || null;

                if (arma.sockets && arma.sockets.socketEntries) {
                    const primerosSockets = [
                        arma.sockets.socketEntries[0],
                        arma.sockets.socketEntries[1],
                        arma.sockets.socketEntries[2],
                        arma.sockets.socketEntries[3],
                        arma.sockets.socketEntries[4],
                        arma.sockets.socketEntries[6],
                        arma.sockets.socketEntries[7],
                        arma.sockets.socketEntries[8],
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
                    ...arma,
                    ammoTypeName,
                    damageTypeIcon,
                    itemSubType,
                    equipmentSlotName,
                    stats,
                    breakerTypeIcon,
                    sockets
                };
            });

            // Devolver la respuesta usando `Response` directamente
            return new Response(JSON.stringify({
                armas: armasConSockets,
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