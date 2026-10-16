// Keeps the search state free of empty rows and applies filters as soon as they change.
export default class SearchFilterStateSetupHandler {

    constructor(view) {
        this.view = view;
    }

    process() {
        this.sourcePreset = this.view.presetName || null;

        this.patchMethods();

        this.removeEmptyFiltersAfterRender();

        this.view.isSearchedWithAdvancedFilter = this.view.hasAdvancedFilter();
    }

    patchMethods() {
        const view = this.view;

        const originalCreateFilter = view.createFilter;

        // Core stores an empty row as a null entry. Recreating it on preset selection or page load
        // would show an unwanted row (for example "Account Name"), so only rows with a value are created.
        view.createFilter = (name, params, callback) => {
            if (params === null || params === undefined) {
                delete view.advanced[name];

                if (typeof callback === 'function') {
                    callback();
                }

                return;
            }

            return originalCreateFilter.call(view, name, params, callback);
        };

        const originalFetch = view.fetch;

        view.fetch = (...args) => {
            const result = originalFetch.apply(view, args);

            this.removeNullEntries();

            return result;
        };

        // Filters are applied as soon as they change, so the Apply and Reset-text strip is never shown.
        const applyNow = () => {
            view.search();
            this.checkSourcePreset();
            view.hideApplyFiltersButton();
        };

        view.showApplyFiltersButton = applyNow;
        view.showResetFiltersButton = applyNow;

        // Core clears presetName when a row is added or removed, so the saved filter is tracked separately.
        ['addFilter', 'removeFilter'].forEach(methodName => {
            const originalMethod = view[methodName];

            view[methodName] = (...args) => {
                const result = originalMethod.apply(view, args);

                this.checkSourcePreset();

                return result;
            };
        });

        ['selectPreset', 'savePreset', 'removePreset'].forEach(methodName => {
            const originalMethod = view[methodName];

            view[methodName] = (...args) => {
                const result = originalMethod.apply(view, args);

                this.sourcePreset = view.presetName || null;

                if (methodName === 'savePreset') {
                    this.detachSavedPresetData();
                }

                return result;
            };
        });
    }

    // Stored empty rows are removed after the first render: clearing them during setup would cancel
    // the pending nested view and block the list from rendering.
    removeEmptyFiltersAfterRender() {
        const view = this.view;

        view.once('after:render', () => {
            for (const name of Object.keys(view.advanced || {})) {
                if (view.advanced[name] !== null && view.advanced[name] !== undefined) {
                    continue;
                }

                view.clearView(`filter-${name}`);

                view.element?.querySelector(`.advanced-filters > .filter[data-name="${name}"]`)?.remove();
                view.element?.querySelector(`ul.filter-list li[data-name="${name}"]`)?.classList.remove('hidden');

                delete view.advanced[name];
            }

            view.manageLabels();
        });
    }

    // A saved filter that is edited is no longer the saved filter: it is deselected and the change is flagged.
    // While the filters still match the saved filter, the saved filter stays selected.
    checkSourcePreset() {
        const view = this.view;
        const sourcePreset = this.sourcePreset;

        if (!sourcePreset || sourcePreset === view.primary) {
            return;
        }

        const item = view.getPresetFilterList().find(entry => entry.name === sourcePreset);

        if (!item) {
            return;
        }

        const isModified = this.toComparable(view.advanced) !== this.toComparable(item.data);

        if (!isModified) {
            if (view.presetName !== sourcePreset) {
                view.presetName = sourcePreset;
                view.updateSearch();
                view.manageLabels();
                view.controlResetButtonVisibility();
            }

            return;
        }

        this.sourcePreset = null;

        view.smartFiltersModifiedFrom = item.label || item.name;
        view.presetName = view.primary;

        view.updateSearch();
        view.manageLabels();
        view.controlResetButtonVisibility();
    }

    // Core stores the live filter object as the saved preset's data, so later edits would also change the
    // saved preset and hide the modification. A copy keeps the saved conditions fixed.
    detachSavedPresetData() {
        const view = this.view;

        const item = view.getPresetFilterList().find(entry => entry.name === view.presetName);

        if (!item) {
            return;
        }

        item.data = JSON.parse(JSON.stringify(view.advanced || {}));
    }

    toComparable(advanced) {
        const entries = Object.entries(advanced || {})
            .filter(([, entry]) => entry && typeof entry === 'object' && Object.keys(entry).length > 0);

        return JSON.stringify(entries.map(([name, entry]) => [name, this.sortKeys(entry)]));
    }

    sortKeys(value) {
        if (Array.isArray(value)) {
            return value.map(item => this.sortKeys(item));
        }

        if (value && typeof value === 'object') {
            return Object.keys(value).sort().reduce((result, key) => {
                if (value[key] !== null && value[key] !== undefined) {
                    result[key] = this.sortKeys(value[key]);
                }

                return result;
            }, {});
        }

        return value;
    }

    // Empty rows still shown in the panel stay tracked, otherwise typing into them would not be read back.
    removeNullEntries() {
        const view = this.view;
        const advanced = view.advanced || {};

        for (const name of Object.keys(advanced)) {
            if (advanced[name] !== null && advanced[name] !== undefined) {
                continue;
            }

            if (view.element?.querySelector(`.advanced-filters > .filter[data-name="${name}"]`)) {
                continue;
            }

            delete advanced[name];
        }
    }
}
