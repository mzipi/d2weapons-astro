// export const ammoTypeMap = {
//     0: "None",
//     1: "Principal",
//     2: "Especial",
//     3: "Pesada",
//     4: "Desconocida"
// };

export default async function getManifestUrls() {
    try {
        const response = await fetch("https://www.bungie.net/Platform/Destiny2/Manifest/");
        
        if (!response.ok) {
            throw new Error(`Error al obtener el manifiesto: ${response.statusText}`);
        }
        
        const data = await response.json();
        const contentPaths = data.Response.jsonWorldComponentContentPaths['es-mx'];
        
        
        if (!contentPaths) {
            throw new Error('No se encontraron rutas de contenido en el manifiesto.');
        }
        
        // Definiciones requeridas
        const definitions = [
            // 'DestinyDamageTypeDefinition',
            // 'DestinyEquipmentSlotDefinition',
            // 'DestinyBreakerTypeDefinition',
            'DestinyInventoryItemDefinition',
            // 'DestinyPresentationNodeDefinition',
            // 'DestinyStatDefinition',
            'DestinyPlugSetDefinition',
            // 'DestinySandboxPerkDefinition',
            // 'DestinyCollectibleDefinition',
            // 'DestinyRewardSourceDefinition',
            // 'DestinySeasonDefinition'
        ];
        
        // Construir URLs de las definiciones
        const urls = definitions.reduce((acc, definition) => {
            if (contentPaths[definition]) {
                acc[definition] = `https://www.bungie.net${contentPaths[definition]}`;
            } else {
                console.warn(`No se encontró la definición: ${definition}`);
            }
            return acc;
        }, {});

        return urls;
    } catch (error) {
        console.error('Error en getManifestUrls:', error);
        return null;
    }
}

export const findAmmoTypeNameFromNodeDefinition = (ammoTypeId, data) => {
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