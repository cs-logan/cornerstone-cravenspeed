export default class VehicleSelector {
    constructor(context) {
        this.context = context;
        this.registry = null;

        // DOM Elements
        this.form = document.querySelector('[data-car-selection-form]');
        this.makeSelect = document.querySelector('[data-car-selection-field="make"]');
        this.modelSelect = document.querySelector('[data-car-selection-field="model"]');
        this.yearSelect = document.querySelector('[data-car-selection-field="year"]');
    }

    init() {
        this.bindEvents();
        this.loadFromStorage();
    }

    bindEvents() {
        if (this.makeSelect) {
            this.makeSelect.addEventListener('change', (e) => this.handleMakeChange(e.target.value));
        }
        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', (e) => this.handleModelChange(e.target.value));
        }
        if (this.yearSelect) {
            this.yearSelect.addEventListener('change', (e) => this.handleYearChange(e.target.value));
        }
    }

    setRegistry(registry) {
        this.registry = registry;
        this.populateMakes();
        this.restoreSelection();
    }

    populateMakes() {
        if (!this.registry || !this.registry.brands) return;

        this.clearSelect(this.makeSelect, 'Select Make');
        this.clearSelect(this.modelSelect, 'Select Model');
        this.clearSelect(this.yearSelect, 'Select Year');

        const brands = Object.entries(this.registry.brands)
            .map(([slug, data]) => ({ slug, name: data.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        brands.forEach(brand => {
            this.addOption(this.makeSelect, brand.slug, brand.name);
        });
    }

    handleMakeChange(makeSlug) {
        this.clearSelect(this.modelSelect, 'Select Model');
        this.clearSelect(this.yearSelect, 'Select Year');

        if (!makeSlug || !this.registry.brands[makeSlug]) return;

        const modelSlugs = this.registry.brands[makeSlug].models || [];
        const models = modelSlugs
            .map(slug => {
                const modelData = this.registry.models[slug];
                return modelData ? { slug, name: modelData.name } : null;
            })
            .filter(m => m)
            .sort((a, b) => a.name.localeCompare(b.name));

        models.forEach(model => {
            this.addOption(this.modelSelect, model.slug, model.name);
        });
    }

    handleModelChange(modelSlug) {
        this.clearSelect(this.yearSelect, 'Select Year');

        if (!modelSlug || !this.registry.models[modelSlug]) return;

        const generations = this.registry.models[modelSlug].generations || {};
        const gens = Object.entries(generations)
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => b.name.localeCompare(a.name));

        gens.forEach(gen => {
            this.addOption(this.yearSelect, gen.id, gen.name);
        });
    }

    handleYearChange(genId) {
        if (genId) {
            this.saveSelection();
        }
    }

    saveSelection() {
        const make = this.makeSelect.value;
        const model = this.modelSelect.value;
        const year = this.yearSelect.value;

        if (make && model && year) {
            localStorage.setItem('cs_garage_make', make);
            localStorage.setItem('cs_garage_model', model);
            localStorage.setItem('cs_garage_generation', year);
            this.dispatchSelectionEvent();
        }
    }

    loadFromStorage() {
        this.storedMake = localStorage.getItem('cs_garage_make');
        this.storedModel = localStorage.getItem('cs_garage_model');
        this.storedGen = localStorage.getItem('cs_garage_generation');
    }

    restoreSelection() {
        if (this.storedMake && this.makeSelect.querySelector(`option[value="${this.storedMake}"]`)) {
            this.makeSelect.value = this.storedMake;
            this.handleMakeChange(this.storedMake);

            if (this.storedModel && this.modelSelect.querySelector(`option[value="${this.storedModel}"]`)) {
                this.modelSelect.value = this.storedModel;
                this.handleModelChange(this.storedModel);

                if (this.storedGen && this.yearSelect.querySelector(`option[value="${this.storedGen}"]`)) {
                    this.yearSelect.value = this.storedGen;
                    this.dispatchSelectionEvent();
                }
            }
        }
    }

    dispatchSelectionEvent() {
        const event = new CustomEvent('cs:vehicle-selected', {
            detail: {
                make: this.makeSelect.value,
                model: this.modelSelect.value,
                generation: this.yearSelect.value
            }
        });
        document.dispatchEvent(event);
    }

    clearSelect(select, defaultText) {
        if (!select) return;
        select.innerHTML = `<option value="">${defaultText}</option>`;
        select.disabled = true;
    }

    addOption(select, value, text) {
        if (!select) return;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
        select.disabled = false;
    }
}