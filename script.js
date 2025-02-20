document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const infoBtn = document.getElementById('info-btn');
    const closeModal = document.querySelector('.close');
    const batteryStatus = document.getElementById('battery-status');
    const form = document.getElementById('location-form');
    const ccaaSelect = document.getElementById('ccaa');
    const provinciaSelect = document.getElementById('provincia');
    const poblacionSelect = document.getElementById('poblacion');
    const imageContainer = document.getElementById('image-container');
    const nearbyCitiesContainer = document.getElementById('nearby-cities');

    let provinciasData = null;
    let poblacionesData = null;

    // Abrir y cerrar modal
    infoBtn.addEventListener('click', () => modal.style.display = 'block');
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
    });

    // API de Geolocalización
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                .then(response => response.json())
                .then(data => alert(`Tu ubicación estimada es: ${data.address.state}`))
                .catch(error => console.error('Error obteniendo ubicación:', error));
        });
    }

    // API de estado de la batería
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateBatteryStatus() {
                batteryStatus.textContent = `Estado de la batería: ${Math.round(battery.level * 100)}% ${battery.charging ? "(Cargando)" : "(No cargando)"}`;
            }
            updateBatteryStatus();
            battery.addEventListener('chargingchange', updateBatteryStatus);
            battery.addEventListener('levelchange', updateBatteryStatus);
        }).catch(error => console.error('Error obteniendo estado de la batería:', error));
    }

    // Cargar lista de Comunidades Autónomas
    fetch('https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/ccaa.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(ccaa => {
                if (ccaa.parent_code === "0") {
                    const option = document.createElement('option');
                    option.value = ccaa.code;
                    option.textContent = ccaa.label;
                    ccaaSelect.appendChild(option);
                }
            });
        })
        .catch(error => console.error('Error al cargar CCAA:', error));

    // Cargar Provincias
    ccaaSelect.addEventListener('change', () => {
        provinciaSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';
        poblacionSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';

        fetch('https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/provincias.json')
            .then(response => response.json())
            .then(data => {
                provinciasData = data;
                const selectedCcaa = ccaaSelect.value;
                provinciasData.filter(provincia => provincia.parent_code === selectedCcaa)
                    .forEach(provincia => {
                        const option = document.createElement('option');
                        option.value = provincia.code;
                        option.textContent = provincia.label;
                        provinciaSelect.appendChild(option);
                    });
            })
            .catch(error => console.error('Error al cargar provincias:', error));
    });

    // Cargar Poblaciones
    provinciaSelect.addEventListener('change', () => {
        poblacionSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';

        fetch('https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/poblaciones.json')
            .then(response => response.json())
            .then(data => {
                poblacionesData = data;
                const selectedProvincia = provinciaSelect.value;
                poblacionesData.filter(poblacion => poblacion.parent_code === selectedProvincia)
                    .forEach(poblacion => {
                        const option = document.createElement('option');
                        option.value = poblacion.label;
                        option.textContent = poblacion.label;
                        poblacionSelect.appendChild(option);
                    });
            })
            .catch(error => console.error('Error al cargar poblaciones:', error));
    });

    // Obtener imágenes y ciudades cercanas
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        imageContainer.innerHTML = '';
        nearbyCitiesContainer.innerHTML = '';

        const poblacion = poblacionSelect.value;
        if (!poblacion) {
            alert("Selecciona una población.");
            return;
        }

        // **API Keys**
        const openCageAPIKey = "669261be4a3945acb862fda1a7104da6";
        const geoNamesAPIKey = "didacsoler111"; // Tu nombre de usuario en GeoNames

        try {
            // **1️⃣ Obtener coordenadas de la población con OpenCage**
            const geoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(poblacion)},España&key=${openCageAPIKey}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                nearbyCitiesContainer.innerHTML = `<h3>No se encontraron coordenadas para ${poblacion}.</h3>`;
                return;
            }

            const { lat, lng } = geoData.results[0].geometry;
            console.log(`Coordenadas de ${poblacion}: Lat ${lat}, Lng ${lng}`);

            // **2️⃣ Buscar ciudades cercanas en GeoNames**
            const geoNamesUrl = `https://secure.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&radius=30&maxRows=5&username=${geoNamesAPIKey}`;
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
