import { readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Key } from 'node:readline';
import color from 'picocolors';
import Prompt, { PromptOptions } from './prompt';

interface PathOptions extends PromptOptions<PathPrompt> {
	onlyShowDir?: boolean;
	placeholder?: string;
	maxHintOptions?: number;
}

export default class PathPrompt extends Prompt {
	public readonly placeholder: string;
	public readonly onlyShowDir: boolean;
	public maxHintOptions: number;
	public hint: string;
	public hintOptions: string[];
	public hintIndex: number;
	public valueWithHint: string;

	private get _valueEnd(): string {
		return this.value.replace(/.*\/(.*)$/, '$1');
	}

	private _mapHintOptions(): string[] {
		const dirPath = this.value.replace(/^(.*)\/.*/, '$1').replace(/\s+$/, '');
		const absolutePath = dirPath.startsWith('~') ? dirPath.replace('~', os.homedir()) : dirPath;

		return statSync(absolutePath, { throwIfNoEntry: false })?.isDirectory()
			? readdirSync(absolutePath, { withFileTypes: true })
					.filter(
						(item) =>
							(this.onlyShowDir ? item.isDirectory() : true) && item.name.startsWith(this._valueEnd)
					)
					.slice(0, this.maxHintOptions)
					.map((item) => item.name + (!!item.isDirectory() ? '/' : ''))
			: [];
	}

	private _changeHint(): void {
		const [firstHintOption] = this._mapHintOptions();
		this.hintOptions = [];
		this.hint = firstHintOption ? firstHintOption.replace(this._valueEnd, '') : '';
	}

	private _changeHintOption(step: number): void {
		if (this.hintOptions.length === 0) {
			this.hintIndex = -1;
			this.hintOptions = this._mapHintOptions();
		} else {
			const nextHintIndex = this.hintIndex + step;
			this.hintIndex =
				nextHintIndex >= this.hintOptions.length
					? 0
					: nextHintIndex < 0
					? this.hintOptions.length - 1
					: nextHintIndex;
			this.hint = this.hintOptions[this.hintIndex].replace(this._valueEnd, '');
			this._changeValueWithHint();
		}
	}

	private _changeValueWithHint(): void {
		let value: string;
		let hint: string;
		if (this._cursor >= this.value.length) {
			value = this.value;
			hint = this.hint
				? `${color.inverse(this.hint.charAt(0))}${color.dim(this.hint.slice(1))}`
				: color.inverse(color.hidden('_'));
		} else {
			const s1 = this.value.slice(0, this._cursor);
			const s2 = this.value.slice(this._cursor);
			value = `${s1}${color.inverse(s2[0])}${s2.slice(1)}`;
			hint = color.dim(this.hint);
		}
		this.valueWithHint = value + hint;
	}

	private _completeValue(): void {
		const complete = this.value ? this.hint : this.placeholder;
		this.value += complete;
		this._cursor = this.value.length;
		this.hint = '';
		this.hintOptions = [];
		this.rl.write(complete);
		this._changeHint();
		this._changeValueWithHint();
	}

	private _tabComplete(step: number): void {
		const hintOptions = this.hintOptions.length ? this.hintOptions : this._mapHintOptions();
		if (hintOptions.length <= 1) {
			this._completeValue();
		} else {
			this._changeHintOption(step);
		}
	}

	constructor(opts: PathOptions) {
		super(opts, true);

		this.onlyShowDir = opts.onlyShowDir ?? false;
		this.hint = '';
		this.hintOptions = [];
		this.hintIndex = -1;
		this.maxHintOptions =
			'maxHintOptions' in opts && opts.maxHintOptions ? opts.maxHintOptions : Infinity;
		this.value = opts.initialValue ?? '';
		this.valueWithHint = opts.initialValue ?? '';
		this.placeholder = opts.placeholder ?? '';

		this._changeHint();
		this._changeValueWithHint();

		this.on('cursor', (key) => {
			if (key === 'right' && this._cursor >= this.value.length) {
				this._completeValue();
			}
		});

		this.on('key', (char: string, key: Key) => {
			if (key.name === 'tab') {
				this._tabComplete(key.shift ? -1 : 1);
			} else {
				this._changeHint();
				this._changeValueWithHint();
			}
		});

		this.on('finalize', () => {
			this.value = this.value ? path.normalize(this.value) : '';
		});
	}
}
