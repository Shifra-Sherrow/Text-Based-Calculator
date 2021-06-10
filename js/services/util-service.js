'use strict';

// validations

function isValidNum(str) {
    return /^-?\d+(\.\d+)?$/.test(str);
}

function isValidVar(str) {
    return /^[a-zA-z_$][\w$]*$/.test(str);
}

function isValidChars(str) {
    return /^[\s\w$\.\*\/%\+-=()]+$/.test(str);
}

function isShortLine(str) {
    const condition1 = /^(\+\+|--)\s*[a-zA-z_$][\w$]*$/.test(str);
    const condition2 = /^[a-zA-z_$][\w$]*\s*(\+\+|--)$/.test(str);
    return (condition1 || condition2) && !(condition1 && condition2);
}

function isValidLine(str) {
    return /^[^=]+[%\*\/\+-]?=[^=]+$/.test(str);
}

function isValidOperator(str) {
    return /^([%\*\/\+-]{1}|\*{2})$/.test(str);
}

function isValidParenthesis(str) {
    if (/(\(\s*\)|\)\s*\()/.test(str)) return false; // (empty) , )(

    const parenthesisArr = str.match(/[\(\)]/g);
    let stack = [];

    for (let i = 0; i < parenthesisArr.length; i++) {
        if (parenthesisArr[i] === '(') stack.push(1);
        else {
            if (stack.length) stack.pop();
            else return false;
        }
    }

    if (stack.length) return false;
    return true;
}

function isUnclearPrecedence(str) {
    // Invalid expression like: a = -b**3, a = 5*-b**3, a = 5- -b**3, a = -[-b]**3, a = 5*-[-b]**3, a = 5- -[-b]**3
    if (/^-\s*(\[-)?[\w$\.\]]+\s*\*\*/.test(str) || /[%\*\/\+]-(\[-)?[\w$\.\]]+\s*\*\*/.test(str) || /[%\*\/\+-]\s+-(\[-)?[\w$\.\]]+\s*\*\*/.test(str))
        throw 'Parenthesis must be used to disambiguate operator precedence';

    // The [] were to isolate a legal extreme case of [-b]**3, as opposed to an illegal expression of -b**3,
    // now they are no longer needed, but such cases should be addressed:
    while (/-\s*\[/.test(str)) {
        // b = -[-a], b = 3 *-[-a], b = 3 - -[-a]
        if (/^-\s*\[/.test(str) || /[%\*\/\+]-\s*\[/.test(str) || /[%\*\/\+-]\s+-\s*\[/.test(str)) str = str.replace(/-\s*\[-/, '');
        // b = 3 -[-a]
        else str = str.replace(/-\s*\[-/, '+');
    }
    if (/[\[\]]/.test(str)) str = str.replaceAll(/[\[\]]/g, '');
    return str;
}