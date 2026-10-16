const FROM_ICON_CLASS = 'fa-ellipsis-v';
const TO_ICON_CLASS = 'fa-filter';

export default class SearchFilterIconSetupHandler {

    constructor(view) {
        this.view = view;
    }

    process() {
        this.view.on('after:render', () => this.apply());

        if (this.view.isRendered()) {
            this.apply();
        }
    }

    apply() {
        const element = this.view.element;

        if (!element) {
            return;
        }

        const icon = element.querySelector('button.add-filter-button > span');

        if (!icon) {
            return;
        }

        icon.classList.remove(FROM_ICON_CLASS);
        icon.classList.add(TO_ICON_CLASS);
    }
}
