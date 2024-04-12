import * as p from '@clack/prompts';

(async () => {
	const inputResult = await p.path({
		message: 'Pick other file with input component:',
		onlyShowDir: false,
		placeholder: process.cwd(),
	});
	if (p.isCancel(inputResult)) {
		p.cancel('File input canceled');
		process.exit(0);
	}

	console.log({ inputResult });
})();
