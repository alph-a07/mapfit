'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const coords = [position.coords.latitude, position.coords.longitude];

            // map => ID of the target view
            // 13 => Initial zoom level
            map = L.map('map').setView(coords, 15);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            map.on('click', function (e) {
                form.classList.remove('hidden');
                mapEvent = e;
                inputDistance.focus();
            });
        },
        function () {
            alert('Please grant location access!');
        }
    );
}

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const { lat, lng } = mapEvent.latlng;
    L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
            L.popup({ minWidth: 100, maxWidth: 250, autoClose: false, closeOnClick: false, className: 'running-popup' }).setContent('Workout!')
        )
        .openPopup();

    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';
});

// Change the cadence/elevation depending on workout type
inputType.addEventListener('change', function () {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
});
