'use strict';

function init() {
    const el = document.querySelector('.input');
    el.addEventListener('keydown', ev => {
        const keyCode = ev.which || ev.keyCode;
        if (keyCode === 13 && !ev.shiftKey) {
            const res = analyzeParagraph(ev.target.value);
            typeof res === 'object' ? showResults(res) : showErrorMsg(res);
        }
    });
}

function toggleInfo() {
    document.body.classList.toggle('info-open');
}

function reset() {
    document.querySelector('.input').value = '';
    const el = document.querySelector('.output');
    el.innerText = '';
    el.classList.remove('err');

    resetMap();
}

function showResults(vars) {
    const el = document.querySelector('.output');
    el.classList.remove('err');

    let res = '';
    for (let varName in vars) {
        res += `${varName}:\xa0${vars[varName]}, `;
    }
    res = res.substring(0, res.length - 2);

    el.innerText = res;
}

function showErrorMsg(errorMsg) {
    const el = document.querySelector('.output');
    el.classList.add('err');
    el.innerText = errorMsg;
}