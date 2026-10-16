const USAGE_STORAGE_PREFIX = 'smartFilters.fieldUsage';
const SEARCH_HIDDEN_CLASS = 'search-hidden';
const EMPTY_ITEM_CLASS = 'smart-filters-empty';

const normalizeText = text => (text ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default class SearchFilterMenuSetupHandler {

    constructor(view) {
        this.view = view;
        this.isRootBound = false;
        this.isClosingSuppressed = false;
    }

    process() {
        this.patchMethods();

        this.view.on('after:render', () => this.setup());

        if (this.view.isRendered()) {
            this.setup();
        }
    }

    patchMethods() {
        const view = this.view;

        const originalAddFilter = view.addFilter;

        view.addFilter = (name) => {
            this.recordUsage(name);

            return originalAddFilter.call(view, name);
        };

        view.processFieldFilterQuickSearch = (text) => this.filterFieldItems(text);

        const originalAddFirstFieldFilter = view.addFirstFieldFilter;

        view.addFirstFieldFilter = () => {
            const query = view.fieldQuickSearchInput?.value ?? '';

            this.isClosingSuppressed = true;

            try {
                originalAddFirstFieldFilter.call(view);
            } finally {
                this.isClosingSuppressed = false;
            }

            if (query) {
                this.restoreQuickSearch(query);
            }
        };

        const originalCloseAddFieldDropdown = view.closeAddFieldDropdown;

        view.closeAddFieldDropdown = () => {
            if (this.isClosingSuppressed) {
                return;
            }

            return originalCloseAddFieldDropdown.call(view);
        };
    }

    setup() {
        this.bindRootClick();
        this.reorderFieldItems();
        this.ensureEmptyItem();

        const query = this.view.fieldQuickSearchInput?.value ?? '';

        if (query) {
            this.filterFieldItems(query);
        }
    }

    bindRootClick() {
        if (this.isRootBound || !this.view.$el) {
            return;
        }

        this.isRootBound = true;

        // Stopping the click before it reaches the document prevents Bootstrap from closing the menu.
        // The delegated core handler on the view root has already run at this point.
        this.view.$el.on('click', (e) => {
            if (e.target instanceof Element && e.target.closest('ul.filter-list')) {
                e.stopPropagation();
            }
        });
    }

    getFilterList() {
        return this.view.filterListElement ?? null;
    }

    getUsageKey() {
        const userId = this.view.getUser?.()?.id ?? 'anonymous';

        return `${USAGE_STORAGE_PREFIX}.${this.view.entityType}.${userId}`;
    }

    getUsage() {
        try {
            return JSON.parse(localStorage.getItem(this.getUsageKey())) || {};
        } catch (e) {
            return {};
        }
    }

    recordUsage(name) {
        const usage = this.getUsage();

        usage[name] = (usage[name] || 0) + 1;

        try {
            localStorage.setItem(this.getUsageKey(), JSON.stringify(usage));
        } catch (e) {
            // Storage can be unavailable (private mode, quota); ordering then simply stays default.
        }
    }

    reorderFieldItems() {
        const list = this.getFilterList();

        if (!list) {
            return;
        }

        const usage = this.getUsage();

        const items = Array.from(list.querySelectorAll('li.filter-item'))
            .map((element, index) => ({
                element: element,
                index: index,
                count: usage[element.dataset.name] || 0,
            }))
            .sort((a, b) => (b.count - a.count) || (a.index - b.index));

        items.forEach(item => list.appendChild(item.element));
    }

    ensureEmptyItem() {
        const list = this.getFilterList();

        if (!list) {
            return null;
        }

        let element = list.querySelector(`li.${EMPTY_ITEM_CLASS}`);

        if (!element) {
            element = document.createElement('li');
            element.className = `quick-search-list-item ${EMPTY_ITEM_CLASS} hidden`;

            const span = document.createElement('span');
            span.className = 'text-muted';
            span.textContent = this.view.translate('No Data');

            element.appendChild(span);
        }

        list.appendChild(element);

        return element;
    }

    filterFieldItems(text) {
        const list = this.getFilterList();

        if (!list) {
            return;
        }

        const query = normalizeText(text);
        const items = Array.from(list.querySelectorAll('li.filter-item'));
        const emptyItem = this.ensureEmptyItem();

        if (!query) {
            items.forEach(item => item.classList.remove(SEARCH_HIDDEN_CLASS));
            emptyItem?.classList.add('hidden');

            return;
        }

        const labels = this.view.fieldFilterTranslations ?? {};

        let visibleCount = 0;

        items.forEach(item => {
            const name = item.dataset.name;
            const label = normalizeText(labels[name] || name);

            const matched = label.includes(query);

            item.classList.toggle(SEARCH_HIDDEN_CLASS, !matched);

            if (matched && !item.classList.contains('hidden')) {
                visibleCount++;
            }
        });

        emptyItem?.classList.toggle('hidden', visibleCount > 0);
    }

    restoreQuickSearch(text) {
        const input = this.view.fieldQuickSearchInput;

        if (!input) {
            return;
        }

        input.value = text;

        this.filterFieldItems(text);
    }
}
