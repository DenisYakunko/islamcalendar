let currentLang = 'en'; // Язык по умолчанию
let lastCoords = null; // Последние сохраненные координаты

// Загрузка переводов
async function loadTranslations(lang) {
    try {
        const response = await fetch(`langs/lang-${lang}.json`);
        return await response.json();
    } catch (error) {
        console.error('Translation load error:', error);
        return {};
    }
}

// Обновление языка интерфейса
async function updateLanguage(lang) {
    try {
        currentLang = lang;
        document.documentElement.lang = lang;
        
        const translations = await loadTranslations(lang);
        
        // Обновление текстовых элементов
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = translations[key] || element.textContent;
        });

        // Обновление данных при известных координатах
        if (lastCoords) {
            await getPrayerTimes(lastCoords.lat, lastCoords.lon);
            await getQiblaDirection(lastCoords.lat, lastCoords.lon);
            await getCityName(lastCoords.lat, lastCoords.lon);
        }
        
        await loadHijriDate();
    } catch (error) {
        console.error('Language update error:', error);
        alert('Error updating language');
    }
}

// Получение геолокации
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve(position.coords),
            error => reject(error),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

// Основные функции
async function getCityName(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await response.json();
        const city = data.address.city || data.address.town || '';
        const country = data.address.country || '';
        document.getElementById('city-name').textContent = `${city}, ${country}`;
    } catch (error) {
        console.error('City error:', error);
    }
}

async function getPrayerTimes(lat, lon) {
    try {
        const response = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2&language=${currentLang}`
        );
        const data = await response.json();
        const timings = data.data.timings;
        
        ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(prayer => {
            document.getElementById(prayer.toLowerCase()).textContent = timings[prayer];
        });
    } catch (error) {
        console.error('Prayer times error:', error);
    }
}

async function getQiblaDirection(lat, lon) {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lon}`);
        const data = await response.json();
        const qiblaText = document.querySelector('[data-translate="qibla"]').textContent;
        document.getElementById('qibla-direction').textContent = `${qiblaText}: ${Math.round(data.data.direction)}°`;
    } catch (error) {
        console.error('Qibla error:', error);
    }
}

async function loadHijriDate() {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/gToH?language=${currentLang}`);
        const data = await response.json();
        const hijri = data.data.hijri;
        
        document.getElementById('hijri-day').textContent = hijri.day;
        document.getElementById('hijri-month').textContent = currentLang === 'ar' ? hijri.month.ar : hijri.month.en;
        document.getElementById('hijri-year').textContent = hijri.year;
    } catch (error) {
        console.error('Hijri date error:', error);
    }
}

// Обработчики событий
document.getElementById('languageSelect').addEventListener('change', (e) => {
    updateLanguage(e.target.value);
});

document.getElementById('location-btn').addEventListener('click', async () => {
    try {
        const coords = await getGeolocation();
        lastCoords = { lat: coords.latitude, lon: coords.longitude };
        
        await getCityName(lastCoords.lat, lastCoords.lon);
        await getPrayerTimes(lastCoords.lat, lastCoords.lon);
        await getQiblaDirection(lastCoords.lat, lastCoords.lon);
    } catch (error) {
        console.error('Geolocation error:', error);
        alert(document.querySelector('[data-translate="geo_error"]').textContent);
    }
});

// Инициализация
window.onload = () => {
    updateLanguage(currentLang);
};