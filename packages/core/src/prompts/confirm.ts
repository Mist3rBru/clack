import { cursor } from 'sisteransi';
import { exposeTestUtils } from '../utils';
import Prompt, { PromptOptions } from './prompt';

interface ConfirmOptions extends PromptOptions<ConfirmPrompt> {
	active: string;
	inactive: string;
	initialValue?: boolean;
}
export default class ConfirmPrompt extends Prompt {
	get cursor() {
		return this.value ? 0 : 1;
	}

	constructor(opts: ConfirmOptions) {
		super(opts, false);
		this.value = opts.initialValue ? true : false;

		exposeTestUtils<ConfirmPrompt>({ value: this.value, cursor: this.cursor });

		this.on('confirm', (confirm) => {
			this.output.write(cursor.move(0, -1));
			this.value = confirm;
			this.state = 'submit';
			this.close();
		});

		this.on('cursor', () => {
			this.value = !this.value;
			exposeTestUtils<ConfirmPrompt>({ cursor: this.cursor });
		});
	}
}
