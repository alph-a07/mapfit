'use strict';

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

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;

        this.calcPace();
        this._setDescription();
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
        this._setDescription();
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

        console.log('form shown');
    }

    _hideForm() {
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';

        form.style.display = 'none'; // Immediately hide the form to skip the animation
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000); // Revert the display after animatin duration

        console.log('form hidden');
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

        // Render workouts list in sidebar
        this._renderWorkoutList(workout);

        // Hide form and clear values
        this._hideForm();
    }

    _renderWorkoutOnMap(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({ minWidth: 100, maxWidth: 250, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` }).setContent(
                    `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
                )
            )
            .openPopup();
    }

    _renderWorkoutList(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
                </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;

        if (workout.type === 'running')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>`;

        if (workout.type === 'cycling')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
                <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevation}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>`;

        // Render new workouts below form
        form.insertAdjacentHTML('afterend', html);
    }

    // Change the cadence/elevation depending on workout type
    _toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
}

const app = new App();
