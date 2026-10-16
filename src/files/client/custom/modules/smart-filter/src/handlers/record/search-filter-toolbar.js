const COUNTER_CLASS = 'smart-filters-counter';
const SAVE_BUTTON_CLASS = 'smart-filters-save';
const RESET_LABEL_CLASS = 'smart-filters-reset-label';
const PRESET_SUMMARY_CLASS = 'smart-filters-preset-summary';
const MODIFIED_NOTICE_CLASS = 'smart-filters-modified-notice';

const TYPE_ALIASES = {
    isNotNull: 'isNotEmpty',
    isNull: 'isEmpty',
};

const TYPE_TRANSLATION_CATEGORIES = ['searchRanges', 'dateSearchRanges'];

const UI_TYPE_FALLBACKS = {
    equals: 'is',
    notEquals: 'isNot',
    in: 'anyOf',
    notIn: 'noneOf',
};

const NO_VALUE_TYPES = ['isEmpty', 'isNotEmpty'];

const wrapMethod = (view, name, after) => {
    const original = view[name];

    view[name] = (...args) => {
        const result = original.apply(view, args);

        after();

        return result;
    };
};

export default class SearchFilterToolbarSetupHandler {

    constructor(view) {
        this.view = view;
    }

    process() {
        const view = this.view;

        const refresh = () => this.refresh();

        wrapMethod(view, 'manageLabels', refresh);
        wrapMethod(view, 'controlResetButtonVisibility', refresh);
        wrapMethod(view, 'search', refresh);

        const originalResetFilters = view.resetFilters;

        view.resetFilters = (...args) => {
            this.clearBoolFilters();

            return originalResetFilters.apply(view, args);
        };

        view.on('after:render', () => this.setup());

        if (view.isRendered()) {
            this.setup();
        }
    }

    setup() {
        this.ensureResetLabel();
        this.ensureSaveButton();
        this.ensureCounter();

        this.refresh();
    }

    refresh() {
        this.updateCounter();
        this.updateResetButton();
        this.updateSaveButton();
        this.updatePresetConditions();
        this.updateModifiedNotice();
    }

    isPresetSelected() {
        const view = this.view;

        return !!view.presetName && view.presetName !== view.primary;
    }

    hasAdvancedConditions() {
        return Object.values(this.view.advanced || {})
            .some(value => value && typeof value === 'object' && Object.keys(value).length > 0);
    }

    countActiveFilters() {
        const view = this.view;

        const advancedCount = Object.values(view.advanced || {})
            .filter(value => value && typeof value === 'object' && Object.keys(value).length > 0)
            .length;

        const boolCount = Object.values(view.bool || {})
            .filter(Boolean)
            .length;

        const textCount = view.textFilter ? 1 : 0;

        return advancedCount + boolCount + textCount;
    }

    getAddFilterButton() {
        return this.view.element?.querySelector('button.add-filter-button') ?? null;
    }

    getResetButton() {
        return this.view.element?.querySelector('[data-action="reset"]') ?? null;
    }

    getAdvancedPanel() {
        return this.view.element?.querySelector('.advanced-filters') ?? null;
    }

    ensureCounter() {
        const button = this.getAddFilterButton();

        if (!button || button.querySelector(`.${COUNTER_CLASS}`)) {
            return;
        }

        const badge = document.createElement('span');
        badge.className = `badge ${COUNTER_CLASS} hidden`;

        button.appendChild(badge);
    }

    updateCounter() {
        const button = this.getAddFilterButton();
        const badge = button?.querySelector(`.${COUNTER_CLASS}`);

        if (!badge) {
            return;
        }

        const count = this.countActiveFilters();

        badge.textContent = count.toString();
        badge.classList.toggle('hidden', count === 0);

        const title = `${this.view.translate('Active filter conditions', 'labels', 'SmartFilter')}: ${count}\n` +
            this.view.translate('Counter help', 'labels', 'SmartFilter');

        button.setAttribute('title', title);
    }

    ensureResetLabel() {
        const button = this.getResetButton();

        if (!button || button.querySelector(`.${RESET_LABEL_CLASS}`)) {
            return;
        }

        button.classList.remove('btn-text', 'btn-icon', 'btn-icon-wide');
        button.classList.add('btn', 'btn-default', 'smart-filters-reset');
        button.setAttribute('title', this.view.translate('Reset'));

        const label = document.createElement('span');
        label.className = RESET_LABEL_CLASS;
        label.textContent = this.view.translate('Reset');

        button.appendChild(label);
    }

    updateResetButton() {
        const button = this.getResetButton();

        if (!button) {
            return;
        }

        const view = this.view;

        const isEnabled = this.isPresetSelected() ||
            view.toShowResetButton() || this.hasCheckedBoolFilters();

        button.classList.toggle('hidden', !isEnabled);
        // Core sets an inline visibility that would override the class above.
        button.style.visibility = '';
    }

    hasCheckedBoolFilters() {
        return Object.values(this.view.bool || {}).some(Boolean);
    }

    clearBoolFilters() {
        const view = this.view;

        if (view.bool) {
            Object.keys(view.bool).forEach(name => view.bool[name] = false);
        }

        view.element?.querySelectorAll('input[data-role="boolFilterCheckbox"]')
            .forEach(input => input.checked = false);
    }

    ensureSaveButton() {
        const resetButton = this.getResetButton();

        if (!resetButton || resetButton.parentElement.querySelector(`.${SAVE_BUTTON_CLASS}`)) {
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-default ${SAVE_BUTTON_CLASS}`;
        button.title = this.view.translate('Save Filter');

        const icon = document.createElement('span');
        icon.className = 'far fa-floppy-disk';

        const label = document.createElement('span');
        label.className = 'smart-filters-save-label';
        label.textContent = this.view.translate('Save Filter');

        button.appendChild(icon);
        button.appendChild(label);

        button.addEventListener('click', () => this.view.savePresetHandler());

        resetButton.insertAdjacentElement('beforebegin', button);
    }

    updateSaveButton() {
        const button = this.view.element?.querySelector(`.${SAVE_BUTTON_CLASS}`);

        if (!button) {
            return;
        }

        const isVisible = !this.view.disableSavePreset &&
            this.hasAdvancedConditions();

        button.classList.toggle('hidden', !isVisible);
    }

    hasConditionValue(entry) {
        return !!entry && typeof entry === 'object' && Object.keys(entry).length > 0;
    }

    updatePresetConditions() {
        const panel = this.getAdvancedPanel();

        if (!panel) {
            return;
        }

        const showsPreset = this.isPresetSelected() && this.hasAdvancedConditions();

        this.updatePresetSummary(panel, showsPreset);

        // Core hides the filter rows when a saved filter is selected; they stay editable here.
        if (showsPreset) {
            panel.classList.remove('hidden');
        }
    }

    updateModifiedNotice() {
        const view = this.view;
        const panel = this.getAdvancedPanel();

        let notice = view.element?.querySelector(`.${MODIFIED_NOTICE_CLASS}`) ?? null;

        const label = view.smartFiltersModifiedFrom;

        if (!label || !panel || this.isPresetSelected() || !this.hasAdvancedConditions()) {
            view.smartFiltersModifiedFrom = null;
            notice?.remove();

            return;
        }

        if (!notice) {
            notice = document.createElement('div');
            notice.className = MODIFIED_NOTICE_CLASS;

            panel.insertAdjacentElement('beforebegin', notice);
        }

        const prefix = view.translate('Modified from saved filter', 'labels', 'SmartFilter');

        notice.textContent = `${prefix} « ${label} »`;
    }

    updatePresetSummary(panel, isVisible) {
        let summary = this.view.element?.querySelector(`.${PRESET_SUMMARY_CLASS}`) ?? null;

        if (!isVisible) {
            summary?.remove();

            return;
        }

        if (!summary) {
            summary = document.createElement('div');
            summary.className = PRESET_SUMMARY_CLASS;

            panel.insertAdjacentElement('beforebegin', summary);
        }

        const items = Object.keys(this.view.advanced || {})
            .filter(name => this.hasConditionValue(this.view.advanced[name]))
            .map(name => this.buildConditionText(name, this.view.advanced[name]));

        summary.replaceChildren(...items.map(text => {
            const item = document.createElement('div');
            item.className = 'smart-filters-preset-item';
            item.textContent = text;

            return item;
        }));
    }

    buildConditionText(name, entry) {
        const view = this.view;

        const fieldLabel = view.translate(name, 'fields', view.entityType);
        const type = this.resolveConditionType(entry);

        const typeLabel = this.translateType(type);

        const values = NO_VALUE_TYPES.includes(type) ? [] : this.getConditionValues(name, entry);

        const valueText = values.length ? ` ${values.join(', ')}` : '';

        return `${fieldLabel}: ${typeLabel}${valueText}`;
    }

    resolveConditionType(entry) {
        if (TYPE_ALIASES[entry.type]) {
            return TYPE_ALIASES[entry.type];
        }

        const widgetType = entry.data?.type ?? entry.type;

        return TYPE_ALIASES[widgetType] ?? UI_TYPE_FALLBACKS[widgetType] ?? widgetType;
    }

    translateType(type) {
        if (!type) {
            return '';
        }

        const language = this.view.getLanguage();

        for (const category of TYPE_TRANSLATION_CATEGORIES) {
            const label = language.translateOption(type, category, 'Global');

            if (label !== type) {
                return label;
            }
        }

        return type;
    }

    getConditionValues(name, entry) {
        const data = entry.data && typeof entry.data === 'object' ? entry.data : {};
        const language = this.view.getLanguage();
        const scope = this.view.entityType;

        if (data.nameValues && typeof data.nameValues === 'object') {
            return Object.values(data.nameValues).filter(Boolean).map(String);
        }

        if (typeof data.nameValue === 'string' && data.nameValue !== '') {
            return [data.nameValue];
        }

        const optionValues = Array.isArray(data.valueList) ? data.valueList : (entry.value ?? []);
        const list = Array.isArray(optionValues) ? optionValues : [optionValues];

        return list
            .filter(item => item !== null && item !== undefined && item !== '')
            .map(item => language.translateOption(String(item), name, scope));
    }
}
