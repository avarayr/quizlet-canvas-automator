// ==UserScript==
// @name         Canvas Quizlet Autocompleter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Canvas quizlet automator
// @author       You
// @match        https://*.instructure.com/courses/*/quizzes/*
// @grant        none
// ==/UserScript==
window.addEventListener('load', function () {
  (async function () {

    function cleanString(question) {
      let clean = question.replace(/[^\w\s]/gi, '');
      // remove all whitespace
      clean = clean.replace(/\s/g, '');
      return clean.toLowerCase().trim();
    }

    if (window.FETCHED == undefined)
      window.FETCHED = true
    else
      return;

    let questionText = $(".question_text").text().trim()
    if (questionText.split(' ').length > 20)
      questionText = questionText.split(' ').slice(0, 20).join(' ')

    const { answer } = await fetch(`http://localhost:8080/api/getAnswer?question=${encodeURIComponent(questionText)}`).then(res => res.json())
    console.log(answer)
    if (answer != '') {
      let validAnswer = [...document.querySelectorAll(".answer_label")].filter(el => cleanString(el.innerText) == cleanString(answer))
      let radio = $(validAnswer).parent().find("[type=radio]")
      radio.click()
    }

  })();
});