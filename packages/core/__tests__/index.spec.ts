import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as packageExports from '../src/index';

function pascalCase(input: string): string {
	const words = input.split('-');
	const pascalCaseWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
	return pascalCaseWords.join('');
}

describe('Package', () => {
	const exportedKeys = Object.keys(packageExports);

	it('should export all prompts', async () => {
		const promptsPath = join(__dirname, '../src/prompts');
		const promptFiles = readdirSync(promptsPath);

		for (const file of promptFiles) {
			const prompt = await import(join(promptsPath, file));
			expect(exportedKeys).toContain(prompt.default.name);
		}
	});

	it('should export selected utils', async () => {
		const utils: string[] = ['block', 'isCancel', 'mockPrompt', 'setGlobalAliases'];

		for (const util of utils) {
			expect(exportedKeys).toContain(util);
		}
	});

	it('should export all prompts options', async () => {
		const excludeList: (keyof typeof packageExports)[] = [];
		const promptsPath = join(__dirname, '../src/prompts');
		const promptFiles = readdirSync(promptsPath);

		for (const file of promptFiles) {
			const prompt = await import(join(promptsPath, file));
			const promptName = prompt.default.name;
			if (excludeList.includes(promptName)) {
				continue;
			}
			const promptOptions =
				prompt.default.name === 'Prompt'
					? prompt.default.name
					: pascalCase(promptName.replace('Prompt', 'Options'));
			expect(exportedKeys).toContain(promptOptions);
		}
	});
});
