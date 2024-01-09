'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now().toString().slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;

        this.calcPace();
    }

    calcPace() {
        this.pace = this.duration / this.distance; // min/km
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;

        this.calcSpeed();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60); // km/hr
        return this.speed;
    }
}

class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Please grant location access!');
            });
        }
    }

    _loadMap(position) {
        const coords = [position.coords.latitude, position.coords.longitude];
        // map => ID of the target view
        // 13 => Initial zoom level
        this.#map = L.map('map').setView(coords, 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(e) {
        form.classList.remove('hidden');
        this.#mapEvent = e;
        inputDistance.focus();
    }

    _newWorkout(e) {
        const validateInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
        const positiveInputs = (...inputs) => inputs.every(input => input > 0);

        e.preventDefault();

        // Get data from the form
        const type = inputType.value;
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // Create running object, if type is running
        if (type === 'running') {
            const cadence = Number(inputCadence.value);

            // Validate the input data
            if (!validateInputs(distance, duration, cadence) || !positiveInputs(distance, duration, cadence))
                return alert('Only positive inputs are accepted!');

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // Create cycling object, if type is cycling
        if (type === 'cycling') {
            const elevation = Number(inputElevation.value);

            // Validate the input data
            // Elevation can be negative while cycling down
            if (!validateInputs(distance, duration, elevation) || !positiveInputs(distance, duration))
                return alert('Only positive inputs are accepted!');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // Add created object to workout array
        this.#workouts.push(workout);

        // Render workout on the map
        this._renderWorkoutOnMap(workout);

        // Hide form and clear values
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
    }

    _renderWorkoutOnMap(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({ minWidth: 100, maxWidth: 250, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` }).setContent(
                    'Workout!'
                )
            )
            .openPopup();
    }

    // Change the cadence/elevation depending on workout type
    _toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
}

const app = new App();
