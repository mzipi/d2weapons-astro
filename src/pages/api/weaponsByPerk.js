import getManifestUrls from "../../utils/utils.js";

let manifestCache = null;

async function loadManifest() {
    try {
        if (manifestCache) return manifestCache;

        const urls = await getManifestUrls();

        if (!urls) throw new Error("No se pudieron obtener las URLs del manifiesto.");

        const [items, perks, collectibles, sources, seasons, plugSets] = await Promise.all([
            fetch(urls.DestinyInventoryItemDefinition).then(res => res.json()).catch(() => { throw new Error("Error al cargar DestinyInventoryItemDefinition") }),
            fetch(urls.DestinySandboxPerkDefinition).then(res => res.json()).catch(() => { throw new Error("Error al cargar DestinySandboxPerkDefinition") }),
            fetch(urls.DestinyCollectibleDefinition).then(res => res.json()).catch(() => { throw new Error("Error al cargar DestinyCollectibleDefinition") }),
            fetch(urls.DestinyRewardSourceDefinition).then(res => res.json()).catch(() => { throw new Error("Error al cargar DestinyRewardSourceDefinition") }),
            fetch(urls.DestinySeasonDefinition).then(res => res.json()).catch(() => { throw new Error("Error al cargar DestinySeasonDefinition") }),
            fetch(urls.DestinyPlugSetDefinition).then(res => res.json()).catch(() => { throw new Error("Error al cargar DestinyPlugSetDefinition") }),
        ]);

        manifestCache = { items, perks, collectibles, sources, seasons, plugSets };
        return manifestCache;
    } catch (error) {
        console.error("Error en la carga del manifiesto:", error);
        return new Response(JSON.stringify({ error: "Error al cargar los manifiestos." }), { status: 500 });
    }
}

export async function POST(context) {
    try {
        const body = await context.request.json();
        const perkName = body.perk;

        if (!perkName) {
            return new Response(JSON.stringify({ error: "Debes proporcionar un perk" }), { status: 400 });
        }

        const { items, plugSets } = await loadManifest();

        const perkItem = Object.values(items).find(item =>
            item.displayProperties?.name?.toLowerCase() === perkName.toLowerCase() &&
            item.inventory?.tierTypeName === "Común"
        );

        if (!perkItem) {
            return new Response(JSON.stringify({ error: "Perk no encontrado o no es de tier 'Común'" }), { status: 404 });
        }

        const perkHash = perkItem.hash;

        const weaponsWithPerk = Object.values(items).filter(item => {
            return item.itemType === 3 &&
                item.sockets?.socketEntries?.some(socket => {
                    if (!socket.randomizedPlugSetHash) return false;

                    const plugSet = plugSets[socket.randomizedPlugSetHash];
                    if (!plugSet) return false;

                    return plugSet.reusablePlugItems.some(plug => plug.plugItemHash === perkHash);
                });
        });

        if (weaponsWithPerk.length === 0) {
            return new Response(JSON.stringify({ error: "No se encontraron armas con este perk" }), { status: 404 });
        }

        const filteredWeapons = weaponsWithPerk.map(weapon => {
            const sockets = [];

            if (weapon.sockets?.socketEntries) {
                const filteredSockets = [0, 1, 2, 3, 4, 6, 8]
                    .map(index => weapon.sockets.socketEntries[index])
                    .filter(socket => socket !== undefined);

                filteredSockets.forEach((socket, index) => {
                    if (socket) {
                        const socketHash = [0, 5, 6, 7, 8].includes(index)
                            ? socket.reusablePlugSetHash
                            : socket.randomizedPlugSetHash;

                        if (socketHash) {
                            const plugSet = plugSets[socketHash];

                            if (plugSet?.reusablePlugItems) {
                                const perks = plugSet.reusablePlugItems.map(plug => {
                                    const plugItem = items[plug.plugItemHash];
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
                name: weapon.displayProperties.name,
                icon: `https://www.bungie.net${weapon.displayProperties.icon}`,
                flavorText: weapon.flavorText || "No hay descripción",
                iconWatermark: `https://www.bungie.net${weapon.iconWatermark}`,
                sockets
            };
        });

        return new Response(JSON.stringify({
            weapons: filteredWeapons,
        }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error detallado:", error);
        return new Response(JSON.stringify({ error: "Error al procesar la solicitud" }), { status: 500 });
    }
}