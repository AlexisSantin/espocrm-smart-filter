import {buildGeneral} from 'espo-extension-tools';
import fs from 'fs-extra';

// The module is declared with jsTranspiled, so EspoCRM loads its handlers from lib/transpiled.
// The package builder does not copy that output, so it is added to the package here.
buildGeneral({
    extensionHook: () => {
        fs.copySync(
            'build/assets/transpiled/custom/modules/smart-filter/src',
            'build/tmp/files/client/custom/modules/smart-filter/lib/transpiled/src',
            {filter: file => !file.endsWith('.map')}
        );
    },
});
