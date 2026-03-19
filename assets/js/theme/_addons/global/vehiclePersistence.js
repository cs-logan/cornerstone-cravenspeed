import StateManager from './stateManager';

const storageKey = 'cs_vehicle_selection';

const VehiclePersistence = {
    init() {
        try {
            const storedVehicle = localStorage.getItem(storageKey);
            if (storedVehicle) {
                const vehicle = JSON.parse(storedVehicle);
                // Set state to inform other modules
                StateManager.setState({ vehicle: { selected: vehicle, isCompatible: true } });
            }
        } catch (e) {
            console.error('Failed to load vehicle from storage', e);
        }
    },

    save(vehicle) {
        try {
            if (vehicle) {
                localStorage.setItem(storageKey, JSON.stringify(vehicle));
            } else {
                localStorage.removeItem(storageKey);
            }
            // Always update state after a save operation
            StateManager.setState({ vehicle: { selected: vehicle, isCompatible: true } });
        } catch (e) {
            console.error('Failed to save vehicle to storage', e);
        }
    },
};

export default VehiclePersistence;

