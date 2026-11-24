/************************************************************************
 * This file is part of Smart Filter for EspoCRM.
 *
 * Copyright (C) 2026 Alexis SANTIN
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 ************************************************************************/

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
