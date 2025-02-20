document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('location-form');
    const poblacionSelect = document.getElementById('poblacion');
    const imageContainer = document.getElementById('image-container');
    const nearbyCitiesContainer = document.getElementById('nearby-cities');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        imageContainer.innerHTML = '';
        nearbyCitiesContainer.innerHTML = '';

        const poblacion = poblacionSelect.value;
        if (!poblacion) {
            alert("Selecciona una población.");
            return;
        }

        // **Proxy para evitar bloqueos de CORS en GitHub Pages**
        const proxyUrl = "https://cors-anywhere.herokuapp.com/";

        // **API Keys**
        const openCageAPIKey = "669261be4a3945acb862fda1a7104da6";
        const geoNamesAPIKey = "didacsoler111"; // Tu nombre de usuario en GeoNames

        try {
            // **1️⃣ Obtener coordenadas de la población con OpenCage**
            const geoUrl = `${proxyUrl}https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(poblacion)},España&key=${openCageAPIKey}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                nearbyCitiesContainer.innerHTML = `<h3>No se encontraron coordenadas para ${poblacion}.</h3>`;
                return;
            }

            const { lat, lng } = geoData.results[0].geometry;
            console.log(`Coordenadas de ${poblacion}: Lat ${lat}, Lng ${lng}`);

            // **2️⃣ Buscar ciudades cercanas en GeoNames**
            const geoNamesUrl = `${proxyUrl}https://secure.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&radius=30&maxRows=5&username=${geoNamesAPIKey}`;
            const nearbyResponse = await fetch(geoNamesUrl);
            const nearbyData = await nearbyResponse.json();

            if (nearbyData.geonames && nearbyData.geonames.length > 0) {
                nearbyCitiesContainer.innerHTML = `<h3>Ciudades cercanas a ${poblacion}:</h3>`;
                nearbyData.geonames.forEach(city => {
                    nearbyCitiesContainer.innerHTML += `<p>${city.name} (${city.countryName})</p>`;
                });
            } else {
                nearbyCitiesContainer.innerHTML = `<h3>No se encontraron ciudades cercanas.</h3>`;
            }

            // **3️⃣ Obtener imágenes de Wikimedia Commons**
            const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=images&titles=${encodeURIComponent(poblacion)}&gimlimit=5&prop=imageinfo&iiprop=url`;
            const wikiResponse = await fetch(wikiUrl);
            const wikiData = await wikiResponse.json();

            if (wikiData.query && wikiData.query.pages) {
                const pages = Object.values(wikiData.query.pages);
                if (pages.length > 0) {
                    pages.forEach(page => {
                        if (page.imageinfo && page.imageinfo.length > 0) {
                            const imageUrl = page.imageinfo[0].url;
                            const imageBox = document.createElement('div');
                            imageBox.classList.add('image-box');

                            const img = document.createElement('img');
                            img.src = imageUrl;
                            img.alt = page.title;

                            imageBox.appendChild(img);
                            imageContainer.appendChild(imageBox);
                        }
                    });
                } else {
                    imageContainer.innerHTML = `<h3>No se encontraron imágenes para ${poblacion}.</h3>`;
                }
            }
        } catch (error) {
            console.error("Error obteniendo datos:", error);
        }
    });
});
