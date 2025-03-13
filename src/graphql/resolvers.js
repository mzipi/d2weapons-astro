import getManifestUrls, { findAmmoTypeNameFromNodeDefinition, ammoTypeMap } from '../utils/utils.js';

const resolvers = {
    Query: {
        weapons: async (_, { search = '', page = 1, resultsPerPage = 1 }) => {
            const manifestUrls = await getManifestUrls();
            if (!manifestUrls) {
                console.error('No se pudieron obtener las URLs del manifiesto');
                return { weapons: [], totalPages: 0, currentPage: page };
            }

            try {
                const responses = await Promise.all(
                    Object.values(manifestUrls).map(url => fetch(url).then(res => res.json()))
                );
                
                const data = Object.keys(manifestUrls).reduce((acc, key, index) => {
                    acc[key] = responses[index];
                    return acc;
                }, {});

                if (data.DestinyInventoryItemDefinition) {
                    const weapons = Object.values(data.DestinyInventoryItemDefinition)
                        .filter(item => item.itemType === 3)
                        .filter(weapon => weapon.displayProperties.name.toLowerCase().includes(search.toLowerCase()));

                    const totalResults = weapons.length;
                    const totalPages = Math.ceil(totalResults / resultsPerPage);
                    const startIndex = (page - 1) * resultsPerPage;
                    const endIndex = startIndex + resultsPerPage;

                    const weaponsPage = weapons.slice(startIndex, endIndex);

                    const weaponsWithSockets = weaponsPage.map(weapon => {
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
                        const iconWatermark = weapon.iconWatermark;
                        const flavorText = weapon.flavorText;
                        const secondaryIcon = weapon.displayProperties.secondaryIcon;

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
                            displayProperties: {
                                name: weapon.displayProperties.name,
                                icon: weapon.displayProperties.icon,
                                description: weapon.displayProperties.description,
                                hasIcon: weapon.displayProperties.hasIcon,
                            },
                            iconWatermark,
                            flavorText,
                            ammoTypeName,
                            damageTypeIcon,
                            itemSubType,
                            equipmentSlotName,
                            stats,
                            breakerTypeIcon,
                            sockets
                        };
                    });

                    return {
                        weapons: weaponsWithSockets,
                        totalPages,
                        currentPage: page
                    };
                } else {
                    throw new Error('No se encontraron armas');
                }
            } catch (error) {
                console.error('Error al obtener los datos:', error);
                return {
                    weapons: [],
                    totalPages: 0,
                    currentPage: page
                };
            }
        }
    }
};

export default resolvers;

