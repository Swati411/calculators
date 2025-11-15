// Simple calculator code explained with plain words.
// It uses small helper functions and clear comments.

const screen = document.getElementById('screen');
const keys = document.querySelector('.keys');

// This string holds what the user typed, like "12+3"
let expression = '';

// Update the visible screen.
// options.animate - play a small pop animation when true
// options.sub - show a small line above the result (like the old expression)
function updateScreen(options = {}) {
    const { animate = false, sub = '' } = options;
    // show something on the screen, or 0 if empty
    screen.textContent = expression === '' ? '0' : expression;
    // show or hide the small sub-line
    screen.dataset.sub = sub;
    if (sub) screen.classList.add('show-sub'); else screen.classList.remove('show-sub');
    // quick pop animation to feel alive
    if (animate) {
        screen.classList.add('pop');
        setTimeout(() => screen.classList.remove('pop'), 320);
    }
}

// Clear everything
function clearAll() {
    expression = '';
    updateScreen({ animate: true });
}

// Remove last character
function backspace() {
    expression = expression.slice(0, -1);
    updateScreen({ animate: true });
}

// Add a number or dot to the expression
function addNumber(ch) {
    // don't allow extra leading zeros like 000
    if (expression === '0' && ch === '0') return;
    // don't allow two dots in the same number
    const last = getLastNumber();
    if (ch === '.' && last.includes('.')) return;
    expression += ch;
    updateScreen({ animate: true });
}

// Add an operator like + - * /
function addOperator(op) {
    // allow negative number at the start
    if (expression === '' && op === '-') {
        expression = '-';
        updateScreen();
        return;
    }
    if (expression === '') return;
    const last = expression.slice(-1);
    // if last is already an operator, replace it
    if (isOperator(last)) expression = expression.slice(0, -1) + op;
    else expression += op;
    updateScreen({ animate: true });
}

function isOperator(ch) {
    return ['+', '-', '*', '/'].includes(ch);
}

// Get the current number being typed (after the last operator)
function getLastNumber() {
    if (expression === '') return '';
    let i = expression.length - 1;
    while (i >= 0 && !isOperator(expression[i])) i--;
    return expression.slice(i + 1);
}

// ------------- Simple math engine (safe, no eval) -------------
// We turn the typed string into tokens, convert to RPN (Reverse Polish Notation)
// to handle * and / before + and -, then evaluate the RPN.

function tokenize(str) {
    const out = [];
    let numberStr = '';
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if ((ch >= '0' && ch <= '9') || ch === '.') {
            numberStr += ch;
            continue;
        }
        if (isOperator(ch)) {
            if (numberStr !== '') { out.push(numberStr); numberStr = ''; }
            // handle negative numbers like -3 or 5*-2
            if (ch === '-' && (out.length === 0 || isOperator(out[out.length - 1]))) {
                numberStr = '-';
            } else {
                out.push(ch);
            }
        }
    }
    if (numberStr !== '') out.push(numberStr);
    return out;
}

function toRPN(tokens) {
    const out = [];
    const ops = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    tokens.forEach(t => {
        if (!isOperator(t)) out.push(t);
        else {
            while (ops.length > 0 && precedence[ops[ops.length - 1]] >= precedence[t]) out.push(ops.pop());
            ops.push(t);
        }
    });
    while (ops.length) out.push(ops.pop());
    return out;
}

function evalRPN(rpn) {
    const stack = [];
    for (const token of rpn) {
        if (!isOperator(token)) stack.push(parseFloat(token));
        else {
            const b = stack.pop();
            const a = stack.pop();
            if (a === undefined || b === undefined) return 'Error';
            let res = 0;
            if (token === '+') res = a + b;
            else if (token === '-') res = a - b;
            else if (token === '*') res = a * b;
            else if (token === '/') {
                if (b === 0) return 'Error';
                res = a / b;
            }
            stack.push(res);
        }
    }
    if (stack.length !== 1) return 'Error';
    return stack[0];
}

function evaluateExpression(str) {
    const tokens = tokenize(str);
    const rpn = toRPN(tokens);
    const value = evalRPN(rpn);
    if (value === 'Error') return 'Error';
    if (!isFinite(value)) return 'Error';
    // round nicely to avoid long floating tails
    const rounded = Math.round((value + Number.EPSILON) * 1e12) / 1e12;
    return rounded.toString();
}

// ---------------- UI: button clicks ----------------
keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const num = btn.dataset.num;
    if (num !== undefined) { addNumber(num); return; }
    if (action === 'clear') { clearAll(); return; }
    if (action === 'back') { backspace(); return; }
    if (action === '=') {
        if (expression === '') return;
        const last = expression.slice(-1);
        if (isOperator(last)) expression = expression.slice(0, -1);
        // show the old expression above the result for a moment
        const old = expression;
        screen.dataset.sub = old;
        screen.classList.add('show-sub');
        const out = evaluateExpression(expression);
        expression = out === 'Error' ? '' : out;
        screen.textContent = out;
        // small animations: pop and glow
        screen.classList.add('result');
        screen.classList.add('pop');
        setTimeout(() => screen.classList.remove('pop'), 360);
        setTimeout(() => screen.classList.remove('result'), 900);
        return;
    }
    if (isOperator(action)) { addOperator(action); }
});

// Start showing something
updateScreen();

// --- Ripple and pressed effects (keeps the feel) ---
function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 1.2;
    ripple.style.width = ripple.style.height = size + 'px';
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left - size / 2;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top - size / 2;
    ripple.style.left = x + 'px'; ripple.style.top = y + 'px';
    btn.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 700);
}

function attachButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(b => {
        b.addEventListener('pointerdown', (e) => { createRipple(e); b.classList.add('pressed'); }, { passive: true });
        ['pointerup','pointercancel','pointerleave','pointerout'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('pressed')));
        b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') b.classList.add('pressed'); });
        b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') b.classList.remove('pressed'); });
    });
}

attachButtonEffects();