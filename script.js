class AutoScalingText {
	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.scale = 1;
		this.node = null;
		this.name = name
	}

	componentDidUpdate() {
		const { scale } = this;

		const node = this.node;

		if (node.parentNode instanceof HTMLElement) {
			const { parentNode } = node;
			const actualScale = parentNode.offsetWidth / node.offsetWidth;

			if (scale === actualScale)
				return;

			if (actualScale < 1) {
				this.scale = actualScale;
				this.node.style.transform = `scale(${actualScale},${actualScale})`;
			} else if (scale < 1) {
				this.scale = 1;
				this.node.style.transform = `scale(1,1)`;
			}
		}
	}

	/**
	 * @param {Text} children
	 */
	render(children) {
		const div = document.createElement('div');
		div.className = this.name;
		div.style.transform = `scale(${this.scale},${this.scale})`;
		div.appendChild(children);
		this.node = div;
		return div;
	}
}

class CalculatorDisplay {
	/**
	 * @param {string} value
	 */
	constructor(value) {
		this.value = value;
	}

	render() {
		const language = navigator.language || 'en-US';
		let formattedValue = parseFloat(this.value).toLocaleString(language, {
			useGrouping: true,
			maximumFractionDigits: 6
		});
		const match = this.value.match(/\.\d*?(0*)$/);
		if (match)
			formattedValue += /[1-9]/.test(match[0]) ? match[1] : match[0];

		const autoScalingText = new AutoScalingText('display');
		return autoScalingText.render(document.createTextNode(formattedValue));
	}
}

class CalculatorKey {
	/**
	 * @param {string} className
	 * @param {() => void} onPress
	 * @param {string} text
	 */
	constructor(className, onPress, text) {
		this.className = className;
		this.onPress = onPress;
		this.text = text;
	}

	render() {
		const button = document.createElement('button');
		button.className = `calculator-key ${this.className}`;
		button.textContent = this.text;
		button.onclick = () => this.onPress();
		return button;
	}
}

/** @typedef {(prevValue: number, nextValue: number) => number} NumberBinaryOperationFunction */

const CalculatorOperations = {
	/**@type {NumberBinaryOperationFunction}*/
	'/': (prevValue, nextValue) => prevValue / nextValue,
	/**@type {NumberBinaryOperationFunction}*/
	'*': (prevValue, nextValue) => prevValue * nextValue,
	/**@type {NumberBinaryOperationFunction}*/
	'+': (prevValue, nextValue) => prevValue + nextValue,
	/**@type {NumberBinaryOperationFunction}*/
	'-': (prevValue, nextValue) => prevValue - nextValue,
	/**@type {NumberBinaryOperationFunction}*/
	'=': (prevValue, nextValue) => nextValue
};

class Calculator {
	constructor() {
		this.value = null;
		this.displayValue = '0';
		this.operator = null;
		this.waitingForOperand = false;
		this.history = [];
	}

	clearAll() {
		this.value = null;
		this.displayValue = '0';
		this.operator = null;
		this.waitingForOperand = false;
		this.render();
	}

	clearDisplay() {
		this.displayValue = '0';
		this.render();
	}

	clearLastChar() {
		this.displayValue = this.displayValue.substring(0, this.displayValue.length - 1) || '0';
		this.render();
	}

	toggleSign() {
		const newValue = parseFloat(this.displayValue) * -1;
		this.displayValue = String(newValue);
		this.render();
	}

	inputPercent() {
		const currentValue = parseFloat(this.displayValue);
		if (currentValue !== 0) {
			const fixedDigits = this.displayValue.replace(/^-?\d*\.?/, '');
			const newValue = parseFloat(this.displayValue) / 100;
			this.displayValue = String(newValue.toFixed(fixedDigits.length + 2));
			this.render();
		}
	}

	inputDot() {
		if (!/\./.test(this.displayValue)) {
			this.displayValue += '.';
			this.waitingForOperand = false;
			this.render();
		}
	}

	/**
	 * @param {number} digit
	 */
	inputDigit(digit) {
		if (this.waitingForOperand) {
			this.displayValue = String(digit);
			this.waitingForOperand = false;
		} else {
			this.displayValue = this.displayValue === '0' ? String(digit) : this.displayValue + digit;
		}
		this.render();
	}

	/**
	 * @param {string} nextOperator
	 */
	performOperation(nextOperator) {
		const inputValue = parseFloat(this.displayValue);
		if (this.value == null) {
			this.value = inputValue;
		} else if (this.operator) {
			const currentValue = this.value || 0;
			this.value = CalculatorOperations[this.operator](currentValue, inputValue);

			this.displayValue = String(this.value);

			if (this.operator !== '=') this.history.unshift(`${currentValue} ${this.operator} ${inputValue} = ${this.value}`);
		}
		this.waitingForOperand = true;
		this.operator = nextOperator;
		this.render();
	}

	render() {
		const display = new CalculatorDisplay(this.displayValue).render();

		const clearText = this.displayValue !== '0' ? 'C' : 'AC';

		const calculatorKeys = [
			new CalculatorKey("key-clear", () => this.displayValue !== '0' ? this.clearDisplay() : this.clearAll(), clearText),
			new CalculatorKey("key-sign", () => this.toggleSign(), "\xB1"),
			new CalculatorKey("key-clearLastChar", () => this.clearLastChar(), "DEL"),
			new CalculatorKey("key-divide", () => this.performOperation('/'), "\xF7"),
			new CalculatorKey("key-1", () => this.inputDigit(1), "1"),
			new CalculatorKey("key-2", () => this.inputDigit(2), "2"),
			new CalculatorKey("key-3", () => this.inputDigit(3), "3"),
			new CalculatorKey("key-multiply", () => this.performOperation('*'), "\xD7"),
			new CalculatorKey("key-4", () => this.inputDigit(4), "4"),
			new CalculatorKey("key-5", () => this.inputDigit(5), "5"),
			new CalculatorKey("key-6", () => this.inputDigit(6), "6"),
			new CalculatorKey("key-subtract", () => this.performOperation('-'), "\u2212"),
			new CalculatorKey("key-7", () => this.inputDigit(7), "7"),
			new CalculatorKey("key-8", () => this.inputDigit(8), "8"),
			new CalculatorKey("key-9", () => this.inputDigit(9), "9"),
			new CalculatorKey("key-add", () => this.performOperation('+'), "+"),
			new CalculatorKey("key-dot", () => this.inputDot(), "."),
			new CalculatorKey("key-0", () => this.inputDigit(0), "0"),
			new CalculatorKey("key-percent", () => this.inputPercent(), "%"),
			new CalculatorKey("key-equals", () => this.performOperation('='), "=")
		];

		const keys = document.createElement('div');
		keys.className = 'calculator-keys';
		calculatorKeys.forEach(calculatorKey => {
			keys.appendChild(calculatorKey.render());
		});

		const calculator = document.getElementById('calculator');
		calculator.innerHTML = '';
		calculator.appendChild(display);
		calculator.appendChild(keys);

		const historyContainer = document.getElementById('history');
		historyContainer.innerHTML = '';
		this.history.forEach(operation => {
			const historyItem = document.createElement('div');
			historyItem.textContent = operation;
			historyContainer.appendChild(historyItem);
		});
	}
}

const calculator = new Calculator();
calculator.render();
