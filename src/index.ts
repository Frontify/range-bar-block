import { defineBlock } from '@frontify/guideline-blocks-settings';

import { RangeSliderBlock } from './Block';
import { settings } from './settings';

export default defineBlock({
    block: RangeSliderBlock,
    settings,
});
