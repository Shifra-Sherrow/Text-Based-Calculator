'use strict';

let variablesMap = {};

const operators = {
    '**': (a, b) => a **= b,
    '*': (a, b) => a *= b,
    '/': (a, b) => a /= b,
    '%': (a, b) => a %= b,
    '+': (a, b) => a += b,
    '-': (a, b) => a -= b
};
const assignmentMarks = {
    '=': (key, val) => variablesMap[key] = val,
    '*=': (key, val) => variablesMap[key] *= val,
    '/=': (key, val) => variablesMap[key] /= val,
    '%=': (key, val) => variablesMap[key] %= val,
    '+=': (key, val) => variablesMap[key] += val,
    '-=': (key, val) => variablesMap[key] -= val
};


function analyzeParagraph(paragraph) {
    try {
        if (!isValidChars(paragraph)) throw 'Invalid character';
        if (paragraph.length < 3) throw 'Invalid expression';

        let lines = paragraph.split('\n');
        lines = lines.filter(line => line.trim());

        lines.forEach(line => {
            analyzeLine(line.trim());
        });
        return variablesMap;

    } catch (err) {
        return err;
    }
}

function analyzeLine(line) {
    try {
        if (line.length < 3) throw 'Invalid expression';

        // A line without '=', exp: i++ ,--j
        if (isShortLine(line)) {
            const varName = line.replace(/(\+\+|--)/, '').trim();
            if (!variablesMap.hasOwnProperty(varName)) throw 'Variable is not defined';
            numericalVals([line]);
            return;
        }

        if (!isValidLine(line)) throw 'Invalid expression';
        const assignmentMarkIdx = /[%\*\/\+-]?=/.exec(line).index;
        const assignmentMark = line[assignmentMarkIdx] === '=' ? '=' : `${line[assignmentMarkIdx]}=`; // =, *=, += ...

        const arr = line.split(assignmentMark);
        const varToChange = arr[0].trim(); // Left part is the var we want to change
        let assignmentExpression = arr[1].trim(); // Right part is the what will be assinged in the variable

        if (!isValidVar(varToChange)) throw 'Invalid variable name';
        if (assignmentMark.length > 1 && !variablesMap.hasOwnProperty(varToChange)) throw 'Variable is not defined';

        if (/[\(\)]/.test(assignmentExpression)) assignmentExpression = analyzeParenthesis(assignmentExpression);

        const calculatedVal = analyzeExpression(assignmentExpression);
        assignmentMarks[assignmentMark](varToChange, calculatedVal);
    } catch (err) {
        throw err;
    }
}

function analyzeParenthesis(expression) {
    try {
        const regex = /\([^\(^\)]+\)/g;
        let res = regex.exec(expression);
        while (res) {
            while (res) {
                const currExpression = expression.substr(res.index + 1, res[0].length - 2).trim(); // The expression inside the parenthesis
                let flatExpression = analyzeExpression(currExpression);

                // The [] are to isolate a legal extreme case of (-b)**3, as opposed to an illegal expression of -b**3
                if (/-[\w$\.]+/.test(flatExpression)) flatExpression = `[${flatExpression}]`;
                expression = expression.replace(res[0], flatExpression);

                res = regex.exec(expression);
            }
            res = regex.exec(expression);
        }
        return expression;
    } catch (err) {
        throw err;
    }
}

function analyzeExpression(expression) {
    try {
        expression = isUnclearPrecedence(expression);

        let expressionParts = expression.split(/[%\*\/\+-\s]+/); // 'Pure' numbers or variables
        if (!expressionParts.every(part => !part || isValidVar(part) || isValidNum(part))) throw 'Invalid number or variable name';
        if (expressionParts.some(part => isValidVar(part) && !variablesMap.hasOwnProperty(part))) throw 'Variable is not defined';

        let expressionOperators = expression.match(/[%\*\/\+-\s]+/g) || []; // The sequence of signs between them
        expressionOperators = expressionOperators.map(op => op.trim());

        expressionOperators = incDecNegative(expressionParts, expressionOperators);
        expressionParts = numericalVals(expressionParts);

        return calculateVal(expressionParts, expressionOperators);
    } catch (err) {
        throw err;
    }
}

function incDecNegative(expressionParts, expressionOperators) {
    // Here i merge the operators to the numbers/variables in the line (++|--|- for negative),
    // all the 'pure' marks (**|%|/|*|+|-) stay as they are, and will be calculated in the calculateVal function
    try {
        if (!expressionParts[0]) {
            if (!['++', '--', '-'].includes(expressionOperators[0])) throw 'Invalid operator';
            expressionParts.shift();
            expressionParts[0] = expressionOperators.shift() + expressionParts[0];
        }

        if (!expressionParts[expressionParts.length - 1]) {
            if (!['++', '--'].includes(expressionOperators[expressionOperators.length - 1])) throw 'Invalid operator';
            expressionParts.pop();
            expressionParts[expressionParts.length - 1] += expressionOperators.pop();
        }

        return expressionOperators.map((operator, idx) => {
            if (/^(\+\+|--)/.test(operator)) {
                expressionParts[idx] = expressionParts[idx] + operator.charAt(0).repeat(2);
                operator = operator.substr(2, operator.length - 2).trim();
            }

            if (/(\s(\+\+|--)|([%\/\*-]\+\+)|([%\/\*\+]--))$/.test(operator)) {
                expressionParts[idx + 1] = operator.charAt(operator.length - 1).repeat(2) + expressionParts[idx + 1];
                operator = operator.substr(0, operator.length - 2).trim();
            }

            else if (/([%\*\/\+-]\s+-|[%\*\/\+]-)$/.test(operator)) {
                expressionParts[idx + 1] = `-${expressionParts[idx + 1]}`;
                operator = operator.substr(0, operator.length - 1).trim();
            }

            if (operator.length > 2 || !isValidOperator(operator)) throw 'Invalid operator';
            return operator;
        });
    } catch (err) {
        throw err;
    }
}

function numericalVals(expressionParts) {
    // Here i go over the parts and convert them into their value 
    // nubmer - will be a number, exp: '3' will be converted into 3
    // variable - will get its numeric value, exp: 'a' will be converted into 5
    try {
        return expressionParts.map(part => {
            if (isValidNum(part)) return +part;
            else if (isValidVar(part)) return variablesMap[part];
            else {
                if (part.startsWith('++')) {
                    const varName = part.substring(2, part.length);
                    return ++variablesMap[varName];
                }
                else if (part.startsWith('--')) {
                    const varName = part.substring(2, part.length);
                    return --variablesMap[varName];
                }
                else if (part.startsWith('-')) {
                    const varName = part.substring(1, part.length);
                    return -variablesMap[varName];
                }
                else if (part.endsWith('++')) {
                    const varName = part.substring(0, part.length - 2);
                    return variablesMap[varName]++;
                }
                else if (part.endsWith('--')) {
                    const varName = part.substring(0, part.length - 2);
                    return variablesMap[varName]--;
                }
                else {
                    throw 'Error';
                }
            }
        });
    } catch (err) {
        throw err;
    }
}

function calculateVal(expressionParts, expressionOperators) {
    // I calculate the expression by the math operators rules
    calc(expressionParts, expressionOperators, /^\*\*$/);
    calc(expressionParts, expressionOperators, /^[\*\/%]$/);
    calc(expressionParts, expressionOperators, /^[+-]$/);

    return expressionParts[0] % 1 === 0 ? expressionParts[0] : +expressionParts[0].toFixed(2);
}

function calc(expressionParts, expressionOperators, regex) {
    let idx = expressionOperators.findIndex(op => regex.test(op));

    while (idx !== -1) {
        const func = operators[expressionOperators[idx]];
        expressionParts[idx] = func(expressionParts[idx], expressionParts.splice(idx + 1, 1)[0]);
        expressionOperators.splice(idx, 1);

        idx = expressionOperators.findIndex(op => regex.test(op));
    };
}

function resetMap() {
    variablesMap = {};
}