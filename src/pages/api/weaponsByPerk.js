import getManifestUrls from "../../utils.js";

let manifestCache = null; // Cache en memoria

async function loadManifest() {
    if (manifestCache) return manifestCache; // Si ya está en memoria, usarlo

    console.log("Obteniendo URLs del manifiesto...");
    const urls = await getManifestUrls();
    if (!urls) throw new Error("No se pudieron obtener las URLs del manifiesto.");

    console.log("Descargando manifest...");
    const [items, perks] = await Promise.all([
        fetch(urls.DestinyInventoryItemDefinition).then(res => res.json()),
        fetch(urls.DestinySandboxPerkDefinition).then(res => res.json())
    ]);

    manifestCache = { items, perks }; // Guardar en memoria
    return manifestCache;
}

export async function GET({ request }) {
    const url = new URL(request.url);
    const perkName = url.searchParams.get("perk");

    if (!perkName) {
        return new Response(JSON.stringify({ error: "Debes proporcionar un perk" }), { status: 400 });
    }

    const { items, perks } = await loadManifest(); // Carga optimizada

    // Buscar el perk
    const perkEntry = Object.values(perks).find(perk => perk.displayProperties.name.toLowerCase() === perkName.toLowerCase());
    if (!perkEntry) {
        return new Response(JSON.stringify({ error: "Perk no encontrado" }), { status: 404 });
    }

    const perkHash = perkEntry.hash;
    
    // Buscar armas con el perk
    const weaponsWithPerk = Object.values(items).filter(item => {
        return item.itemType === 3 && item.sockets?.socketEntries.some(socket =>
            socket.reusablePlugItems?.some(plug => plug.plugItemHash === perkHash)
        );
    });

    const result = weaponsWithPerk.map(weapon => weapon.displayProperties.name);

    return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" }
    });
}