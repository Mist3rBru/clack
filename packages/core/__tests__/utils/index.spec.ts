import { stdin, stdout } from 'node:process';
import * as readline from 'node:readline';
import { cursor } from 'sisteransi';
import { isCancel } from '../../src';
import { block, CANCEL_SYMBOL, setRawMode } from '../../src/utils';

const rlSpy = {
	terminal: true,
	close: jest.fn(),
};

jest.mock('node:readline', () => ({
	__esModule: true,
	createInterface: jest.fn(() => rlSpy),
	emitKeypressEvents: jest.fn(),
	moveCursor: jest.fn(),
	clearLine: jest.fn(),
}));

jest.mock('node:process', () => ({
	__esModule: true,
	stdin: {
		isTTY: false,
		once: jest.fn(),
		setRawMode: jest.fn(),
		off: jest.fn(),
	},
	stdout: {
		write: jest.fn(),
	},
}));

describe('Utils', () => {
	describe('isCancel()', () => {
		it('should verify if is cancel symbol', () => {
			expect(isCancel('clack:cancel')).toBe(false);
			expect(isCancel(Symbol('clack:cancel'))).toBe(false);
			expect(isCancel(CANCEL_SYMBOL)).toBe(true);
		});
	});

	describe('setRawMode()', () => {
		it('should set raw mode as true', (done) => {
			const input = {
				isTTY: true,
				setRawMode: (value: boolean) => {
					value === true ? done() : done('invalid value');
				},
			} as any;
			setRawMode(input, true);
		});

		it('should set raw mode as false', (done) => {
			const input = {
				isTTY: true,
				setRawMode: (value: boolean) => {
					value === false ? done() : done('invalid value');
				},
			} as any;
			setRawMode(input, false);
		});

		it('should not set raw mode', () => {
			let calledTimes = 0;
			const input = {
				isTTY: false,
				setRawMode: () => {
					calledTimes++;
				},
			} as any;

			setRawMode(input, true);

			expect(calledTimes).toBe(0);
		});
	});

	describe('block()', () => {
		it('should emit keypress events', () => {
			block();

			expect(readline.emitKeypressEvents).toHaveBeenCalledTimes(1);
		});

		it('should set input raw mode', () => {
			stdin.isTTY = true;

			block();

			expect(stdin.setRawMode).toHaveBeenCalledTimes(1);
			expect(stdin.setRawMode).toHaveBeenCalledWith(true);
		});

		it('should not set input raw mode', () => {
			stdin.isTTY = false;

			block();

			expect(stdin.setRawMode).toHaveBeenCalledTimes(0);
		});

		it('should hide cursor', () => {
			block();

			expect(stdout.write).toHaveBeenCalledWith(cursor.hide);
		});

		it('should not hide cursor', () => {
			block({
				hideCursor: false,
			});

			expect(stdout.write).not.toHaveBeenCalledWith(cursor.hide);
		});

		it('should set keypress listener', () => {
			block();

			expect(stdin.once).toHaveBeenCalledWith('keypress', expect.anything());
		});

		it('should clear keypress listener', () => {
			block()();

			expect(stdin.off).toHaveBeenCalledWith('keypress', expect.anything());
		});

		it('should restore cursor', () => {
			block()();

			expect(stdout.write).toHaveBeenCalledWith(cursor.show);
		});

		it('should restore terminal default mode', () => {
			stdin.isTTY = true;

			block()();

			expect(stdin.setRawMode).toHaveBeenCalledWith(false);
		});

		it('should close readline interface', () => {
			block()();

			expect(rlSpy.terminal).toBe(false);
			expect(rlSpy.close).toHaveBeenCalledTimes(1);
		});
	});
});